// services/financial-data.service.ts - Updated with SSR fix

import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { FinancialData, RentalIncrease } from '../models/financial-data.model';
import { DossierDataService } from './dossier-data.service';

@Injectable({
  providedIn: 'root'
})
export class FinancialDataService {
  private readonly LIVING_SPACE = 150; // m²
  private financialDataSubject = new BehaviorSubject<FinancialData>(this.initFinancialData());
  private editableFinancialDataSubject = new BehaviorSubject<FinancialData>(this.initFinancialData());
  private amortizationYearsSubject = new BehaviorSubject<number>(0);
  
  // Add platform check
  private isBrowser: boolean;

  // Expose as Observables
  financialData$ = this.financialDataSubject.asObservable();
  editableFinancialData$ = this.editableFinancialDataSubject.asObservable();
  amortizationYears$ = this.amortizationYearsSubject.asObservable();

  constructor(
    private dossierDataService: DossierDataService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    
    // Initialize financial data based on dossier inputs
    combineLatest([
      this.dossierDataService.totalCosts$,
      this.dossierDataService.totalFunding$,
      this.dossierDataService.totalSavings$,
      this.dossierDataService.consumptionData$
    ]).subscribe(([totalCosts, totalFunding, totalSavings, consumptionData]) => {
      const currentData = this.financialDataSubject.getValue();
      const hasCustomValues = this.getHasCustomValues();

      if (!hasCustomValues) {
        currentData.totalCosts = totalCosts || 0;
        currentData.totalFunding = totalFunding || 0;
        currentData.effectiveCosts = currentData.totalCosts - currentData.totalFunding;
        currentData.energyCostSavings = totalSavings || 3200;
        currentData.rentalIncrease.perSqmBefore = consumptionData?.rentPrice || 12.50;

        // Initialize rental values
        this.initializeRentalValues(currentData);

        // Perform calculations
        this.calculateAll(currentData);

        // Update subjects
        this.financialDataSubject.next(currentData);
        this.editableFinancialDataSubject.next(JSON.parse(JSON.stringify(currentData)));
      }
    });
  }

  // Safe localStorage access methods
  private safeLocalStorageGet(key: string, defaultValue: any = null): any {
    if (!this.isBrowser) {
      return defaultValue;
    }
    
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn(`Error accessing localStorage for key '${key}':`, error);
      return defaultValue;
    }
  }

  private safeLocalStorageSet(key: string, value: any): void {
    if (!this.isBrowser) {
      return;
    }
    
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`Error setting localStorage for key '${key}':`, error);
    }
  }

  private initFinancialData(): FinancialData {
    return {
      totalCosts: 0,
      totalFunding: 0,
      effectiveCosts: 0,
      energyCostSavings: 0,
      modernizationLevy: 0,
      co2TaxSavings: 450,
      pvSalesIncome: 800,
      totalSavingsPerYear: 0,
      returnOnEquity: 0,
      returnOnEquityBeforeTax: 0,
      amortizationYears: 0,
      fundingRate: 0,
      strandingPointOld: '2018',
      strandingPointNew: '2050+',
      rentalIncrease: {
        perSqmBefore: 12.50,
        perSqmAfter: 10,
        perSqmIncrease: 0,
        totalBefore: 0,
        totalAfter: 0,
        totalIncrease: 0,
        returnBefore: 0,
        returnAfter: 0,
        returnIncrease: 0,
        valueBefore: 0,
        valueAfter: 0,
        valueIncrease: 0,
        totalValueBefore: 0,
        totalValueAfter: 0,
        totalValueIncrease: 0
      }
    };
  }

  private initializeRentalValues(data: FinancialData): void {
    data.rentalIncrease.perSqmAfter = data.rentalIncrease.perSqmBefore + 2.70;
    data.rentalIncrease.totalBefore = Math.round(data.rentalIncrease.perSqmBefore * this.LIVING_SPACE);
    data.rentalIncrease.totalAfter = Math.round(data.rentalIncrease.perSqmAfter * this.LIVING_SPACE);
    data.rentalIncrease.valueBefore = 4500;
    data.rentalIncrease.valueAfter = 5300;
    data.rentalIncrease.totalValueBefore = Math.round(data.rentalIncrease.valueBefore * this.LIVING_SPACE);
    data.rentalIncrease.totalValueAfter = Math.round(data.rentalIncrease.valueAfter * this.LIVING_SPACE);
  }

  // Calculation Methods
  calculateTotalRental(data: FinancialData): void {
    data.rentalIncrease.totalIncrease = data.rentalIncrease.totalAfter - data.rentalIncrease.totalBefore;
    if (data.rentalIncrease.totalIncrease < 0) {
      data.rentalIncrease.totalIncrease = 0;
    }
  }

  calculateRentalReturn(data: FinancialData): void {
    data.rentalIncrease.returnBefore = data.rentalIncrease.valueBefore > 0 ?
      parseFloat(((data.rentalIncrease.perSqmBefore * 12) / data.rentalIncrease.valueBefore * 100).toFixed(1)) : 0;
    data.rentalIncrease.returnAfter = data.rentalIncrease.valueAfter > 0 ?
      parseFloat(((data.rentalIncrease.perSqmAfter * 12) / data.rentalIncrease.valueAfter * 100).toFixed(1)) : 0;
    data.rentalIncrease.returnIncrease = data.rentalIncrease.returnBefore > 0 ?
      parseFloat(((data.rentalIncrease.returnAfter / data.rentalIncrease.returnBefore - 1) * 100).toFixed(1)) :
      (data.rentalIncrease.returnAfter > 0 ? 100.0 : 0);
    if (data.rentalIncrease.returnIncrease < 0) {
      data.rentalIncrease.returnIncrease = 0;
    }
  }

  calculateTotalPropertyValue(data: FinancialData): void {
    data.rentalIncrease.totalValueBefore = Math.round(data.rentalIncrease.valueBefore * this.LIVING_SPACE);
    data.rentalIncrease.totalValueAfter = Math.round(data.rentalIncrease.valueAfter * this.LIVING_SPACE);
    data.rentalIncrease.totalValueIncrease = data.rentalIncrease.totalValueAfter - data.rentalIncrease.totalValueBefore;
    if (data.rentalIncrease.totalValueIncrease < 0) {
      data.rentalIncrease.totalValueIncrease = 0;
    }
  }

  calculatePerSqmIncreaseValues(data: FinancialData): void {
    data.rentalIncrease.perSqmIncrease = parseFloat(
      (data.rentalIncrease.perSqmAfter - data.rentalIncrease.perSqmBefore).toFixed(2)
    );
    if (data.rentalIncrease.perSqmIncrease < 0) {
      data.rentalIncrease.perSqmIncrease = 0;
    }
    data.rentalIncrease.valueIncrease = data.rentalIncrease.valueAfter - data.rentalIncrease.valueBefore;
    if (data.rentalIncrease.valueIncrease < 0) {
      data.rentalIncrease.valueIncrease = 0;
    }
  }

  calculateModernizationLevy(data: FinancialData): void {
    data.modernizationLevy = Math.round(data.effectiveCosts * 0.08);
  }

  calculateTotalSavings(data: FinancialData): void {
    data.totalSavingsPerYear =
      data.energyCostSavings +
      (data.modernizationLevy || 0) +
      data.co2TaxSavings +
      (data.pvSalesIncome || 0);
  }

  calculateFundingRate(data: FinancialData): void {
    data.fundingRate = data.totalCosts > 0 ?
      parseFloat((data.totalFunding / data.totalCosts * 100).toFixed(1)) : 0.0;
  }

  calculateAmortization(data: FinancialData): void {
    data.amortizationYears = data.totalSavingsPerYear > 0 ?
    parseFloat((data.effectiveCosts / data.totalSavingsPerYear).toFixed(1)) : 0.0;
    
    this.amortizationYearsSubject.next(data.amortizationYears);
  }

  calculateReturnOnEquity(data: FinancialData): void {
    data.returnOnEquity = data.effectiveCosts > 0 ?
      parseFloat((data.totalSavingsPerYear / data.effectiveCosts * 100).toFixed(2)) : 0.0;
  }

  calculateReturnOnEquityBeforeTax(data: FinancialData): void {
    data.returnOnEquityBeforeTax = data.effectiveCosts > 0 ?
      parseFloat((data.rentalIncrease.totalValueIncrease / data.effectiveCosts * 100).toFixed(2)) : 0.0;
  }

  calculateAll(data: FinancialData): void {
    this.calculatePerSqmIncreaseValues(data);
    this.calculateTotalRental(data);
    this.calculateRentalReturn(data);
    this.calculateTotalPropertyValue(data);
    this.calculateModernizationLevy(data);
    this.calculateTotalSavings(data);
    this.calculateFundingRate(data);
    this.calculateAmortization(data);
    this.calculateReturnOnEquity(data);
    this.calculateReturnOnEquityBeforeTax(data);
  }

  // Public Methods
  updateEditableData(data: FinancialData): void {
    this.editableFinancialDataSubject.next(JSON.parse(JSON.stringify(data)));
  }

  saveEditableData(): void {
    const editableData = this.editableFinancialDataSubject.getValue();
    this.calculateAll(editableData);
    this.financialDataSubject.next(JSON.parse(JSON.stringify(editableData)));
    this.setHasCustomValues(true);
  }

  resetEditableData(): void {
    const currentData = this.financialDataSubject.getValue();
    this.editableFinancialDataSubject.next(JSON.parse(JSON.stringify(currentData)));
  }

  getCurrentFinancialData(): FinancialData {
    return this.financialDataSubject.getValue();
  }

  getCurrentEditableFinancialData(): FinancialData {
    return this.editableFinancialDataSubject.getValue();
  }

  // Handle specific field updates
  onPerSqmAfterChange(): void {
    const data = this.editableFinancialDataSubject.getValue();
    this.calculatePerSqmIncreaseValues(data);
    this.calculateRentalReturn(data);
    this.editableFinancialDataSubject.next(data);
  }

  onTotalBeforeChange(): void {
    const data = this.editableFinancialDataSubject.getValue();
    data.rentalIncrease.perSqmBefore = this.LIVING_SPACE > 0 ?
      parseFloat((data.rentalIncrease.totalBefore / this.LIVING_SPACE).toFixed(2)) : 0;
    this.calculateAll(data);
    this.editableFinancialDataSubject.next(data);
  }

  onValueBeforeChange(): void {
    const data = this.editableFinancialDataSubject.getValue();
    this.calculateAll(data);
    this.calculateReturnOnEquityBeforeTax(data);
    this.editableFinancialDataSubject.next(data);
  }

  onTotalValueBeforeChange(): void {
    const data = this.editableFinancialDataSubject.getValue();
    data.rentalIncrease.valueBefore = this.LIVING_SPACE > 0 ?
      Math.round(data.rentalIncrease.totalValueBefore / this.LIVING_SPACE) : 0;
    this.calculateAll(data);
    this.calculateReturnOnEquityBeforeTax(data);
    this.editableFinancialDataSubject.next(data);
  }

  onValueAfterChange(): void {
    const data = this.editableFinancialDataSubject.getValue();
    this.calculateAll(data);
    this.calculateReturnOnEquityBeforeTax(data);
    this.editableFinancialDataSubject.next(data);
  }

  onTotalAfterChange(): void {
    const data = this.editableFinancialDataSubject.getValue();
    this.calculateTotalRental(data);
    this.calculatePerSqmIncreaseValues(data);
    this.calculateRentalReturn(data);
    this.calculateTotalPropertyValue(data);
    this.editableFinancialDataSubject.next(data);
  }

  onTotalValueAfterChange(): void {
    const data = this.editableFinancialDataSubject.getValue();
    data.rentalIncrease.valueAfter = this.LIVING_SPACE > 0 ?
      Math.round(data.rentalIncrease.totalValueAfter / this.LIVING_SPACE) : 0;
    this.calculateAll(data);
    this.calculateReturnOnEquityBeforeTax(data);
    this.editableFinancialDataSubject.next(data);
  }

  // Custom Values Handling - Updated with safe localStorage access
  private setHasCustomValues(value: boolean): void {
    this.safeLocalStorageSet('hasCustomFinancialValues', value);
  }

  public getHasCustomValues(): boolean {
    return this.safeLocalStorageGet('hasCustomFinancialValues', false);
  }
}
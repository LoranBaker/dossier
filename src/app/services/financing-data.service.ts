import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { RenovationMeasure } from '@models/models';

export interface FinancingData {
  totalCosts: number;
  totalFunding: number;
  effectiveCosts: number;
  ownCapital: number;
  ownCapitalPercentage: number;
  financingNeeds: number;
  monthlySavings: number;
  annualSavings: number;
  co2TaxSavings: number;
  co2TaxSavingsAnnual: number;
  modernisierungsumlage: number;
  pvStromVerkauf: number; // New field for PV-Strom Verkauf
  additionalSavingsTotal: number;
  totalSavingsMonthly: number;
  monthlyRate10Years: number;
  loanTerm10: number;
  monthlyRate15Years: number;
  loanTerm15: number;
  monthlyRate20Years: number;
  loanTerm20: number;
}

@Injectable({
  providedIn: 'root'
})
export class FinancingService {
  private defaultData: FinancingData = {
    totalCosts: 0,
    totalFunding: 0,
    effectiveCosts: 0,
    ownCapital: 0,
    ownCapitalPercentage: 10, // Keep default percentage
    financingNeeds: 0,
    monthlySavings: 0,
    annualSavings: 0,
    co2TaxSavings: 45,
    co2TaxSavingsAnnual: 550,
    modernisierungsumlage: 0,
    pvStromVerkauf: 0, // Initialize PV-Strom Verkauf to 0
    additionalSavingsTotal: 45,
    totalSavingsMonthly: 45,
    monthlyRate10Years: 0,
    loanTerm10: 10,
    monthlyRate15Years: 0,
    loanTerm15: 15,
    monthlyRate20Years: 0,
    loanTerm20: 20
  };

  private renovationMeasures: RenovationMeasure[] = [];
  
  // Create behavior subjects to hold the current state
  private financingDataSubject = new BehaviorSubject<FinancingData>(this.defaultData);
  private renovationMeasuresSubject = new BehaviorSubject<RenovationMeasure[]>(this.renovationMeasures);

  // Expose observables for components to subscribe to
  public financingData$: Observable<FinancingData> = this.financingDataSubject.asObservable();
  public renovationMeasures$: Observable<RenovationMeasure[]> = this.renovationMeasuresSubject.asObservable();

  constructor() {
    // Log when service is instantiated
    console.log('FinancingService instantiated with default data:', this.defaultData);
  }

  // Method to update financing data
  updateFinancingData(data: Partial<FinancingData>): void {
    // Log incoming data update
    console.log('FinancingService updateFinancingData called with:', data);
    
    const currentData = this.financingDataSubject.getValue();
    console.log('Current data before update:', currentData);
    
    const updatedData = { ...currentData, ...data };
    
    // Check if monthly rates or additional savings fields are being directly edited
    const isMonthlyRatesEdited = 
      data.monthlyRate10Years !== undefined || 
      data.monthlyRate15Years !== undefined || 
      data.monthlyRate20Years !== undefined;
    
    const isAdditionalSavingsEdited =
      data.co2TaxSavings !== undefined ||
      data.pvStromVerkauf !== undefined;
    
    // If CO2 tax savings is edited, update the annual value
    if (data.co2TaxSavings !== undefined) {
      updatedData.co2TaxSavingsAnnual = data.co2TaxSavings * 12;
    }
    
    // Handle savings data
    if (data.annualSavings !== undefined) {
      updatedData.annualSavings = data.annualSavings;
      
      // Always calculate monthlySavings from annualSavings
      updatedData.monthlySavings = Math.round(data.annualSavings / 12);
      
      // Update total monthly savings
      this.updateTotalMonthlySavings(updatedData);
      
      console.log('Annual savings updated to:', updatedData.annualSavings);
      console.log('Monthly savings calculated as:', updatedData.monthlySavings);
      console.log('Total monthly savings updated to:', updatedData.totalSavingsMonthly);
    }
    
    // Only recalculate dependent values if not directly editing monthly rates
    if (!isMonthlyRatesEdited && (data.totalCosts !== undefined || data.totalFunding !== undefined)) {
      // Update effective costs
      updatedData.effectiveCosts = updatedData.totalCosts - updatedData.totalFunding;
      
      // Calculate modernisierungsumlage based on effective costs (8% yearly divided by 12 for monthly)
      updatedData.modernisierungsumlage = Math.round((updatedData.effectiveCosts * 8/100) / 12);
      console.log('Modernisierungsumlage calculated as:', updatedData.modernisierungsumlage);
      
      // Update financing needs based on own capital percentage
      updatedData.ownCapital = Math.round(updatedData.effectiveCosts * (updatedData.ownCapitalPercentage / 100));
      updatedData.financingNeeds = updatedData.effectiveCosts - updatedData.ownCapital;
      
      // Update loan rates based on financing needs
      this.updateLoanRates(updatedData);
    }
    
    // If additional savings fields were edited or modernisierungsumlage was updated, update total savings
    if (isAdditionalSavingsEdited || data.totalCosts !== undefined || data.totalFunding !== undefined) {
      // Update total monthly savings
      this.updateTotalMonthlySavings(updatedData);
    }
    
    console.log('Updated data after calculations:', updatedData);
    this.financingDataSubject.next(updatedData);
  }
  
  // Method to update annual savings from renovation measures
  updateAnnualSavings(totalSavings: number): void {
    console.log('Updating annual savings from renovation measures:', totalSavings);
    
    // Ensure we're working with a number value
    const annualSavings = isNaN(totalSavings) ? 0 : Math.max(0, totalSavings);
    console.log('Validated annual savings value:', annualSavings);
    
    // Calculate monthly savings from annual
    const monthlySavings = Math.round(annualSavings / 12);
    
    // Update with explicit values
    this.updateFinancingData({
      annualSavings: annualSavings,
      monthlySavings: monthlySavings
    });
  }
  
  // Update loan rates based on financing needs
  private updateLoanRates(data: FinancingData): void {
    const financingNeeds = data.financingNeeds;
    const interestRate = 0.049; // 4.9%
    
    // Calculate monthly rates for different loan terms
    // Formula: PMT = P * (r * (1 + r)^n) / ((1 + r)^n - 1)
    // where P = principal, r = monthly interest rate, n = number of payments
    
    // 10-year loan
    const monthlyInterestRate = interestRate / 12;
    const months10 = data.loanTerm10 * 12;
    const monthlyRate10 = -this.calculateMonthlyPayment(financingNeeds, monthlyInterestRate, months10);
    data.monthlyRate10Years = Math.round(monthlyRate10);
    
    // 15-year loan
    const months15 = data.loanTerm15 * 12;
    const monthlyRate15 = -this.calculateMonthlyPayment(financingNeeds, monthlyInterestRate, months15);
    data.monthlyRate15Years = Math.round(monthlyRate15);
    
    // 20-year loan
    const months20 = data.loanTerm20 * 12;
    const monthlyRate20 = -this.calculateMonthlyPayment(financingNeeds, monthlyInterestRate, months20);
    data.monthlyRate20Years = Math.round(monthlyRate20);
  }
  
  // Helper method to calculate monthly payment
  private calculateMonthlyPayment(principal: number, monthlyInterestRate: number, numberOfPayments: number): number {
    if (monthlyInterestRate === 0) return principal / numberOfPayments;
    if (principal <= 0) return 0; // Avoid calculation if there's no financing need
    
    const x = Math.pow(1 + monthlyInterestRate, numberOfPayments);
    return principal * monthlyInterestRate * x / (x - 1);
  }
  
  // Updated helper method to calculate total monthly savings including all components
  private updateTotalMonthlySavings(data: FinancingData): void {
    // Sum up all monthly savings components including PV-Strom Verkauf
    data.additionalSavingsTotal = data.co2TaxSavings + data.modernisierungsumlage + data.pvStromVerkauf;
    data.totalSavingsMonthly = data.monthlySavings + data.additionalSavingsTotal;
    
    console.log('Additional savings updated to:', data.additionalSavingsTotal);
    console.log('Total monthly savings updated to:', data.totalSavingsMonthly);
  }

  // Method to set renovation measures
  setRenovationMeasures(measures: RenovationMeasure[]): void {
    console.log('Setting renovation measures:', measures);
    this.renovationMeasuresSubject.next(measures);
  }

  // Method to get the current financing data
  getCurrentFinancingData(): FinancingData {
    return this.financingDataSubject.getValue();
  }

  // Method to reset to default data
  resetToDefault(): void {
    console.log('Resetting financing data to default');
    this.financingDataSubject.next(this.defaultData);
    this.renovationMeasuresSubject.next([]);
  }
}
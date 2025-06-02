import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { RenovationMeasure } from '@models/models';

@Injectable({
  providedIn: 'root'
})
export class FinancialBenefitsService {
  // Dummy data - with energyCost fields
  private financialBenefitsData = {
    costAfterFunding: 94925,
    
    // Energy cost savings
    energyCost: 10785, // From ConsumptionData - annual value
    energyCost15Years: 88950, // 15-year total BEFORE renovation (energyCost × 15)
    energyCostAfter15Years: 16380, // Editable field - total for 15 years AFTER renovation
    energySavings15Years0Percent: 72570, // Calculated: energyCost15Years - energyCostAfter15Years
    
    // PV electricity generation
    pvGenerationBefore: 0,
    pvGenerationAfter: 308,
    pvGenerationValue15Years: 4620,
    
    // CO2 tax savings
    co2TaxSavingsBefore: 550,
    co2TaxSavingsAfter: 0,
    co2TaxSavings15Years0Percent: 8250,
    
    // Total savings
    totalSavings15Years: 85440,
    effectiveCostAfter15Years: -9485,
    
    // Property value increase
    propertyValueIncrease: 117000,
    propertyValueIncreasePercent: 39.2,
    
    // Rent increase
    rentIncreaseMonthly: 375,
    rentIncreasePercent: 32
  };

  private renovationMeasures: RenovationMeasure[] = [];
  private totalCosts: number = 0;
  private totalFunding: number = 0;
  
  // Create behavior subjects to hold the current state
  private dataSubject = new BehaviorSubject<any>(this.financialBenefitsData);
  private renovationMeasuresSubject = new BehaviorSubject<RenovationMeasure[]>(this.renovationMeasures);
  private totalCostsSubject = new BehaviorSubject<number>(this.totalCosts);
  private totalFundingSubject = new BehaviorSubject<number>(this.totalFunding);

  // Expose observables for components to subscribe to
  public data$: Observable<any> = this.dataSubject.asObservable();
  public renovationMeasures$: Observable<RenovationMeasure[]> = this.renovationMeasuresSubject.asObservable();
  public totalCosts$: Observable<number> = this.totalCostsSubject.asObservable();
  public totalFunding$: Observable<number> = this.totalFundingSubject.asObservable();

  constructor() {
    console.log('FinancialBenefitsService instantiated with dummy data');
  }

  // Method to set energy cost data from consumption tab
  setEnergyCost(energyCost: number): void {
    const currentData = this.dataSubject.getValue();
    
    // Update energy cost and recalculate 15-year total
    currentData.energyCost = energyCost;
    currentData.energyCost15Years = energyCost * 15;
    this.updateEnergySavings(currentData);
    
    this.dataSubject.next(currentData);
  }
  
  // Method to update the energy cost after (editable field)
  setEnergyCostAfter15Years(energyCostAfter15Years: number): void {
    const currentData = this.dataSubject.getValue();
    
    // Update editable field (already represents 15-year total)
    currentData.energyCostAfter15Years = energyCostAfter15Years;
    this.updateEnergySavings(currentData);
    
    this.dataSubject.next(currentData);
  }
  
  // Helper method to recalculate energy savings
  private updateEnergySavings(data: any): void {
    // Calculate 15-year savings (total before - total after)
    data.energySavings15Years0Percent = data.energyCost15Years - data.energyCostAfter15Years;
    
    // Update total savings (sum of all 15-year savings)
    data.totalSavings15Years = data.energySavings15Years0Percent + 
                              data.pvGenerationValue15Years + 
                              data.co2TaxSavings15Years0Percent;
    
    // Update effective cost after 15 years
    data.effectiveCostAfter15Years = data.costAfterFunding - data.totalSavings15Years;
  }

  // Method to set renovation measures
  setRenovationMeasures(measures: RenovationMeasure[]): void {
    this.renovationMeasuresSubject.next(measures);
  }

  // Method to set total costs
  setTotalCosts(value: number): void {
    this.totalCostsSubject.next(value);
    
    // Update cost after funding
    const currentData = this.dataSubject.getValue();
    currentData.costAfterFunding = value - this.totalFundingSubject.getValue();
    this.updateEnergySavings(currentData); // Recalculate effective cost
    this.dataSubject.next(currentData);
  }

  // Method to set total funding
  setTotalFunding(value: number): void {
    this.totalFundingSubject.next(value);
    
    // Update cost after funding
    const currentData = this.dataSubject.getValue();
    currentData.costAfterFunding = this.totalCostsSubject.getValue() - value;
    this.updateEnergySavings(currentData); // Recalculate effective cost
    this.dataSubject.next(currentData);
  }

  // Method to get the current data
  getData(): any {
    return this.dataSubject.getValue();
  }

  // Method to get the current renovation measures
  getRenovationMeasures(): RenovationMeasure[] {
    return this.renovationMeasuresSubject.getValue();
  }

  // Method to get total costs
  getTotalCosts(): number {
    return this.totalCostsSubject.getValue();
  }

  // Method to get total funding
  getTotalFunding(): number {
    return this.totalFundingSubject.getValue();
  }
}
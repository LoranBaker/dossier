import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ConsumptionData, RenovationMeasure } from '@models/models';

@Injectable({
  providedIn: 'root'
})
export class FinancialBenefitsService {
  // Dummy data - with energyCost fields
    private consumptionData: ConsumptionData | null = null; // ADD THIS LINE

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
  // Method to set consumption data and update energy costs
setConsumptionData(consumptionData: ConsumptionData): void {
  this.consumptionData = consumptionData;
  
  if (consumptionData && consumptionData.energyCosts) {
    // Update energy cost from consumption data
    this.setEnergyCost(consumptionData.energyCosts);
  }
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
  
  setPVSalesIncome(pvSalesIncome: number): void {
    const currentData = this.dataSubject.getValue();
    
    // Update PV generation after (annual value)
    currentData.pvGenerationAfter = pvSalesIncome;
    
    // Calculate 15-year PV generation value
    currentData.pvGenerationValue15Years = pvSalesIncome * 15;
    
    // Recalculate total savings
    this.updateEnergySavings(currentData);
    
    this.dataSubject.next(currentData);
    console.log('PV Sales Income updated:', pvSalesIncome, '15-year value:', pvSalesIncome * 15);
  }

  // ADD METHOD to set CO2 tax savings from financial potential
  setCO2TaxSavings(co2TaxSavings: number): void {
    const currentData = this.dataSubject.getValue();
    
    // Update CO2 tax savings before (annual value)
    currentData.co2TaxSavingsBefore = co2TaxSavings;
    
    // Calculate 15-year CO2 tax savings
    currentData.co2TaxSavings15Years0Percent = co2TaxSavings * 15;
    
    // CO2 tax savings after renovation should be 0 (no more CO2 emissions)
    currentData.co2TaxSavingsAfter = 0;
    
    // Recalculate total savings
    this.updateEnergySavings(currentData);
    
    this.dataSubject.next(currentData);
    console.log('CO2 Tax Savings updated:', co2TaxSavings, '15-year value:', co2TaxSavings * 15);
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

// Method to set property value increase data
setPropertyValueIncrease(propertyValueIncrease: number, propertyValueIncreasePercent: number): void {
  const currentData = this.dataSubject.getValue();
  
  currentData.propertyValueIncrease = propertyValueIncrease;
  currentData.propertyValueIncreasePercent = propertyValueIncreasePercent;
  
  this.dataSubject.next(currentData);
  console.log('Property Value Increase updated:', propertyValueIncrease, 'Percent:', propertyValueIncreasePercent);
}

// Method to set rental increase data
setRentIncrease(rentIncreaseMonthly: number, rentIncreasePercent: number): void {
  const currentData = this.dataSubject.getValue();
  
  currentData.rentIncreaseMonthly = rentIncreaseMonthly;
  currentData.rentIncreasePercent = rentIncreasePercent;
  
  this.dataSubject.next(currentData);
  console.log('Rent Increase updated:', rentIncreaseMonthly, 'Percent:', rentIncreasePercent);
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
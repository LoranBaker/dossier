// models/financial-data.model.ts
export interface RentalIncrease {
    perSqmBefore: number;
    perSqmAfter: number;
    perSqmIncrease: number;
    totalBefore: number;
    totalAfter: number;
    totalIncrease: number;
    returnBefore: number;
    returnAfter: number;
    returnIncrease: number;
    valueBefore: number;
    valueAfter: number;
    valueIncrease: number;
    totalValueBefore: number;
    totalValueAfter: number;
    totalValueIncrease: number;
  }
  
export interface FinancialData {
    totalCosts: number;
    totalFunding: number;
    effectiveCosts: number;
    energyCostSavings: number;
    modernizationLevy: number;
    co2TaxSavings: number;
    pvSalesIncome: number;
    totalSavingsPerYear: number;
    returnOnEquity: number;
    returnOnEquityBeforeTax: number;
    amortizationYears: number;
    fundingRate: number;
    strandingPointOld: string;
    strandingPointNew: string;
    rentalIncrease: RentalIncrease;
  }
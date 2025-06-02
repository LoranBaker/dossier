// models/consumption-data.model.ts
export interface ConsumptionData {
    heating: number;
    warmWater: number;
    electricity: number;
    totalEnergy: number;
    energyCosts: number;
    co2Emissions: number;
    strandedAsset: boolean;
    co2Intensity: number;
    energyIntensity: number;
    co2Tax: number;
    co2TaxTotal: number;
    strandingPoint: number;
    strandingRisk: number;
    rentPrice: number; 
    marketPrice: number;

    vermieterAnteil?: number; 
    mieterAnteil?: number; 
  }
  
  // models/renovation-measure.model.ts
  export interface RenovationMeasure {
    type: string;
    description: string;
    description1:string;
    details?: string;
    details1:string;
    cost: number;
    funding: number | string;
    savings: number;
  }
  
  // models/renovation-plan.model.ts
  export interface RenovationPlan {
    year: number;
    measures: string[];
    investment: number;
  }
  
  // models/savings-potential.model.ts
  export interface SavingsPotential {
    energyCostSavings: number;
    energyBalanceSavings: number;
    co2TaxSavings: number;
    amortizationYears: number;
  }
  
  // models/modernization-costs.model.ts
  export interface ModernizationCosts {
    now: number;
    inTenYears: number;
    additionalCosts: number;
  }
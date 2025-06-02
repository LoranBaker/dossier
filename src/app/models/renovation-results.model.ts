// StrandingData interface for managing stranding point analysis
export interface StrandingData {
    currentStrandingPoint: number;
    strandingRisk: number;
    strandingPointChange: string | number;
    newStrandingPoint: number;
  }
  
  // RenovationValues interface for current, future and savings values
  export interface RenovationValues {
    energyCosts: number;
    energyUse: number;
    co2Emissions: number;
    energyRating: string;
  }
  
  // Savings percentages interface
  export interface SavingsPercentages {
    energyCosts: number;
    energyUse: number;
    co2Emissions: number;
  }
  
  // RenovationCosts interface
  export interface RenovationCosts {
    totalCost: number;
    funding: number;
    ownContribution: number;
    fundingRate: number;
  }
  
  // Extended future values interface with CO2 tax
  export interface FutureValues extends RenovationValues {
    co2Tax: number;
  }
import { Injectable } from '@angular/core';
import { ConsumptionData, RenovationMeasure, SavingsPotential } from '@models/models';

// Interface for the stranding data
export interface StrandingData {
  currentStrandingPoint: number;
  strandingRisk: number;
  strandingPointChange: string | number;
  newStrandingPoint: number;
}

export interface RenovationCosts {
  totalCost: number;
  funding: number;
  ownContribution: number;
  fundingRate: number;
}

export interface CurrentValues {
  energyCosts: number;
  energyUse: number;
  co2Emissions: number;
  energyRating: string;
}

export interface FutureValues {
  energyCosts: number;
  energyUse: number;
  co2Emissions: number;
  energyRating: string;
  co2Tax: number;
}

export interface SavingsValues {
  energyCosts: number;
  energyUse: number;
  co2Emissions: number;
}

export interface SavingsPercentages {
  energyCosts: number;
  energyUse: number;
  co2Emissions: number;
}

export interface CO2IntensityTableEntry {
  maxValue: number;
  vermieterShare: number;
}

@Injectable({
  providedIn: 'root'
})
export class RenovationResultsService {
  
  // CO2 intensity to Vermieter share mapping table
  private readonly co2IntensityTable: CO2IntensityTableEntry[] = [
    { maxValue: 12, vermieterShare: 0 },
    { maxValue: 17, vermieterShare: 10 },
    { maxValue: 22, vermieterShare: 20 },
    { maxValue: 27, vermieterShare: 30 },
    { maxValue: 32, vermieterShare: 40 },
    { maxValue: 37, vermieterShare: 50 },
    { maxValue: 42, vermieterShare: 60 },
    { maxValue: 47, vermieterShare: 70 },
    { maxValue: 52, vermieterShare: 80 },
    { maxValue: Infinity, vermieterShare: 95 }
  ];

  constructor() { }

  /**
   * Initialize current values from consumption data
   */
  initializeCurrentValues(consumptionData: ConsumptionData): CurrentValues {
    return {
      energyCosts: consumptionData?.energyCosts || 5930,
      energyUse: ((consumptionData?.heating || 0) + (consumptionData?.warmWater || 0)) || 45500,
      co2Emissions: consumptionData?.co2Emissions || 10826,
      energyRating: this.getEnergyRating(consumptionData?.energyIntensity || 197)
    };
  }

  /**
   * Initialize future values (post-renovation)
   */
  initializeFutureValues(currentValues: CurrentValues, targetEnergyRating?: string): FutureValues {
    return {
      energyCosts: 1092,
      energyUse: 10400,
      co2Emissions: currentValues.co2Emissions, // Using current CO2 emissions value
      energyRating: targetEnergyRating || 'A',
      co2Tax: 0
    };
  }

  /**
   * Get target energy rating for renovation
   */
  getTargetEnergyRating(): string {
    return 'A'; // Default target rating after renovation
  }

  /**
   * Calculate target energy rating based on renovation measures
   */
  calculateTargetEnergyRating(renovationMeasures: RenovationMeasure[]): string {
    // This could be enhanced to calculate based on actual renovation measures
    // For now, return the default target rating
    return this.getTargetEnergyRating();
  }

  /**
   * Initialize stranding data
   */
  initializeStrandingData(consumptionData: ConsumptionData): StrandingData {
    return {
      currentStrandingPoint: consumptionData?.strandingPoint || 2018,
      strandingRisk: consumptionData?.strandingRisk || -7,
      strandingPointChange: '+25 Jahre',
      newStrandingPoint: 2050
    };
  }

  /**
   * Initialize renovation costs
   */
  initializeRenovationCosts(totalCosts: number, totalFunding: number): RenovationCosts {
    return {
      totalCost: totalCosts || 0,
      funding: totalFunding || 0,
      ownContribution: (totalCosts || 0) - (totalFunding || 0),
      fundingRate: totalCosts > 0 ? ((totalFunding || 0) / totalCosts) * 100 : 0
    };
  }

  /**
   * Calculate CO2 intensity
   */
  calculateCO2Intensity(co2Emissions: number, livingSpace: number): number {
    return Math.round(co2Emissions / livingSpace);
  }

  /**
   * Calculate energy intensity
   */
  calculateEnergyIntensity(energyUse: number, livingSpace: number): number {
    return Math.round(energyUse / livingSpace);
  }

  /**
   * Calculate savings values
   */
  calculateSavingsValues(currentValues: CurrentValues, futureValues: FutureValues): SavingsValues {
    return {
      energyCosts: currentValues.energyCosts - futureValues.energyCosts,
      energyUse: currentValues.energyUse - futureValues.energyUse,
      co2Emissions: currentValues.co2Emissions - futureValues.co2Emissions
    };
  }

  /**
   * Calculate savings percentages
   */
  calculateSavingsPercentages(currentValues: CurrentValues, futureValues: FutureValues): SavingsPercentages {
    return {
      energyCosts: this.calculateSavingsPercentage(currentValues.energyCosts, futureValues.energyCosts),
      energyUse: this.calculateSavingsPercentage(currentValues.energyUse, futureValues.energyUse),
      co2Emissions: this.calculateSavingsPercentage(currentValues.co2Emissions, futureValues.co2Emissions)
    };
  }

  /**
   * Calculate savings percentage for individual values
   */
  calculateSavingsPercentage(heute: number, zukunft: number): number {
    if (heute === 0) return 0; // Avoid division by zero
    const savingsAmount = heute - zukunft;
    const savingsPercentage = (savingsAmount / heute) * 100;
    return Math.round(savingsPercentage);
  }

  /**
   * Calculate percentage (general purpose)
   */
  calculatePercentage(value: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  }

  /**
   * Get energy rating from energy intensity
   */
  getEnergyRating(energyIntensity: number): string {
    if (energyIntensity <= 25) return 'A+';
    if (energyIntensity <= 50) return 'A';
    if (energyIntensity <= 75) return 'B';
    if (energyIntensity <= 100) return 'C';
    if (energyIntensity <= 125) return 'D';
    if (energyIntensity <= 150) return 'E';
    if (energyIntensity <= 175) return 'F';
    if (energyIntensity <= 200) return 'G';
    return 'H';
  }

  /**
   * Get rating position from energy intensity
   */
  getRatingPositionFromIntensity(energyIntensity: number): number {
    if (energyIntensity <= 25) return 11;   // A+
    if (energyIntensity <= 50) return 22;   // A  
    if (energyIntensity <= 75) return 33;   // B
    if (energyIntensity <= 100) return 44;  // C
    if (energyIntensity <= 125) return 55;  // D
    if (energyIntensity <= 150) return 66;  // E
    if (energyIntensity <= 175) return 77;  // F
    if (energyIntensity <= 200) return 88;  // G
    return 99; // H
  }

  /**
   * Get Vermieter share based on CO2 intensity
   */
  getVermieterShareFromCO2Intensity(co2Intensity: number): number {
    for (const entry of this.co2IntensityTable) {
      if (co2Intensity < entry.maxValue) {
        return entry.vermieterShare;
      }
    }
    return 95; // Maximum share if no match found
  }

  /**
   * Calculate CO2 tax per m²
   */
  calculateCO2TaxPerM2(
    isVermieter: boolean, 
    co2TaxFromConsumption: { eigennutzerTotal: number; vermieterTotal: number },
    livingSpace: number
  ): number {
    if (!isVermieter) {
      return parseFloat((co2TaxFromConsumption.eigennutzerTotal / livingSpace).toFixed(3));
    } else {
      return parseFloat((co2TaxFromConsumption.vermieterTotal / livingSpace).toFixed(3));
    }
  }

  /**
   * Calculate total CO2 tax
   */
  calculateTotalCO2Tax(
    isVermieter: boolean,
    co2TaxFromConsumption: { eigennutzerTotal: number; vermieterTotal: number }
  ): number {
    if (!isVermieter) {
      return co2TaxFromConsumption.eigennutzerTotal;
    } else {
      return co2TaxFromConsumption.vermieterTotal;
    }
  }

  /**
   * Calculate Vermieter's share of the CO2 tax (total)
   */
  calculateVermieterCO2TaxTotal(
    isVermieter: boolean,
    co2TaxFromConsumption: { eigennutzerTotal: number; vermieterTotal: number },
    co2Intensity: number
  ): number {
    const totalCO2Tax = this.calculateTotalCO2Tax(isVermieter, co2TaxFromConsumption);
    const vermieterShare = this.getVermieterShareFromCO2Intensity(co2Intensity);
    
    const vermieterTaxTotal = totalCO2Tax * (vermieterShare / 100);
    return parseFloat(vermieterTaxTotal.toFixed(2));
  }

  /**
   * Calculate Vermieter CO2 tax
   */
  calculateVermieterCO2Tax(co2Intensity: number): number {
    const vermieterSharePercent = this.getVermieterShareFromCO2Intensity(co2Intensity);
    const vermieterTax = (55 * co2Intensity / 1000) * (vermieterSharePercent / 100);
    return parseFloat(vermieterTax.toFixed(2));
  }

  /**
   * Parse stranding point change from string to number
   */
  parseStrandingPointChange(strandingPointChange: string | number): number {
    if (typeof strandingPointChange === 'string') {
      return parseInt(strandingPointChange.replace(/[^0-9-]/g, ''));
    }
    return strandingPointChange;
  }

  /**
   * Format stranding point change for display
   */
  formatStrandingPointChange(years: number): string {
    return `+${years} Jahre`;
  }

  /**
   * Get current energy intensity with fallback
   */
  getCurrentEnergyIntensity(consumptionData: ConsumptionData): number {
    if (consumptionData && consumptionData.energyIntensity) {
      return consumptionData.energyIntensity;
    }
    return 197; // Default fallback
  }
}
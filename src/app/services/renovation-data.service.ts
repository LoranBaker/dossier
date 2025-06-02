import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ConsumptionData, RenovationMeasure, SavingsPotential } from '@models/models';
import { DossierDataService } from './dossier-data.service';

// Interface for the stranding data
export interface StrandingData {
  currentStrandingPoint: number;
  strandingRisk: number;
  strandingPointChange: string | number;
  newStrandingPoint: number;
}

// Interface for current values
export interface CurrentValues {
  energyCosts: number;
  energyUse: number;
  co2Emissions: number;
  energyRating: string;
}

// Interface for future values
export interface FutureValues {
  energyCosts: number;
  energyUse: number;
  co2Emissions: number;
  energyRating: string;
  co2Tax: number;
}

// Interface for savings values
export interface SavingsValues {
  energyCosts: number;
  energyUse: number;
  co2Emissions: number;
}

// Interface for savings percentages
export interface SavingsPercentages {
  energyCosts: number;
  energyUse: number;
  co2Emissions: number;
}

// Interface for renovation costs
export interface RenovationCosts {
  totalCost: number;
  funding: number;
  ownContribution: number;
  fundingRate: number;
}

@Injectable({
  providedIn: 'root'
})
export class RenovationDataService {
  private apiBaseUrl = 'api/renovation-results';

  // CO2 intensity to Vermieter share mapping table
  private co2IntensityTable = [
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

  // BehaviorSubjects for reactive data
  private isEditModeSubject = new BehaviorSubject<boolean>(false);
  private isVermieterSubject = new BehaviorSubject<boolean>(false);
  private strandingDataSubject = new BehaviorSubject<StrandingData>(this.initDefaultStrandingData());
  private editableStrandingDataSubject = new BehaviorSubject<StrandingData>(this.initDefaultStrandingData());
  private currentValuesSubject = new BehaviorSubject<CurrentValues>(this.initDefaultCurrentValues());
  private futureValuesSubject = new BehaviorSubject<FutureValues>(this.initDefaultFutureValues());
  private editableFutureValuesSubject = new BehaviorSubject<CurrentValues>(this.initDefaultCurrentValuesForEditing());
  private editableCurrentValuesSubject = new BehaviorSubject<{energyRating: string}>({energyRating: 'E'});
  private savingsValuesSubject = new BehaviorSubject<SavingsValues>(this.initDefaultSavingsValues());
  private savingsPercentagesSubject = new BehaviorSubject<SavingsPercentages>(this.initDefaultSavingsPercentages());
  private renovationCostsSubject = new BehaviorSubject<RenovationCosts>(this.initDefaultRenovationCosts());
  private co2IntensitySubject = new BehaviorSubject<number>(0);
  private energyIntensitySubject = new BehaviorSubject<number>(0);
  private livingSapceSubject = new BehaviorSubject<number>(0);

  // Expose as Observables
  isEditMode$ = this.isEditModeSubject.asObservable();
  isVermieter$ = this.isVermieterSubject.asObservable();
  strandingData$ = this.strandingDataSubject.asObservable();
  editableStrandingData$ = this.editableStrandingDataSubject.asObservable();
  currentValues$ = this.currentValuesSubject.asObservable();
  futureValues$ = this.futureValuesSubject.asObservable();
  editableFutureValues$ = this.editableFutureValuesSubject.asObservable();
  editableCurrentValues$ = this.editableCurrentValuesSubject.asObservable();
  savingsValues$ = this.savingsValuesSubject.asObservable();
  savingsPercentages$ = this.savingsPercentagesSubject.asObservable();
  renovationCosts$ = this.renovationCostsSubject.asObservable();
  co2Intensity$ = this.co2IntensitySubject.asObservable();
  energyIntensity$ = this.energyIntensitySubject.asObservable();
  livingSpace$ = this.livingSapceSubject.asObservable();

  constructor(
    private http: HttpClient,
    private dossierDataService: DossierDataService
  ) {}

  // Default initialization methods
  private initDefaultStrandingData(): StrandingData {
    return {
      currentStrandingPoint: 2018,
      strandingRisk: -7,
      strandingPointChange: '+25 Jahre',
      newStrandingPoint: 2050
    };
  }

  private initDefaultCurrentValues(): CurrentValues {
    return {
      energyCosts: 0,
      energyUse: 0,
      co2Emissions: 0,
      energyRating: 'E'
    };
  }

  private initDefaultFutureValues(): FutureValues {
    return {
      energyCosts: 0,
      energyUse: 0,
      co2Emissions: 0,
      energyRating: 'A',
      co2Tax: 0
    };
  }

  private initDefaultCurrentValuesForEditing(): CurrentValues {
    return {
      energyCosts: 0,
      energyUse: 0,
      co2Emissions: 0,
      energyRating: 'E'
    };
  }

  private initDefaultSavingsValues(): SavingsValues {
    return {
      energyCosts: 0,
      energyUse: 0,
      co2Emissions: 0
    };
  }

  private initDefaultSavingsPercentages(): SavingsPercentages {
    return {
      energyCosts: 0,
      energyUse: 0,
      co2Emissions: 0
    };
  }

  private initDefaultRenovationCosts(): RenovationCosts {
    return {
      totalCost: 118750,
      funding: 23825,
      ownContribution: 94925,
      fundingRate: 20.0
    };
  }

  // Initialize all data based on the provided consumption data
  initializeData(consumptionData: ConsumptionData): void {
    // Get the livingSpace from the building data
    const building = this.dossierDataService.getCurrentBuilding();
    this.livingSapceSubject.next(building.livingSpace || 399);
    
    // Load current values from consumption data
    const currentValues: CurrentValues = {
      energyCosts: consumptionData?.energyCosts || 5930,
      energyUse: consumptionData?.totalEnergy || 45500,
      co2Emissions: consumptionData?.co2Emissions || 10826,
      energyRating: this.getEnergyRating(consumptionData?.energyIntensity || 197)
    };
    this.currentValuesSubject.next(currentValues);
    
    // Initialize future values (post-renovation)
    const futureValues: FutureValues = {
      energyCosts: 1092,
      energyUse: currentValues.energyUse, // Using current energy use value
      co2Emissions: currentValues.co2Emissions, // Using current CO2 emissions value
      energyRating: 'A',
      co2Tax: 0
    };
    this.futureValuesSubject.next(futureValues);
    
    // Calculate CO2 intensity and energy intensity
    const livingSpace = this.livingSapceSubject.getValue();
    const co2Intensity = Math.round(futureValues.co2Emissions / livingSpace);
    const energyIntensity = Math.round(futureValues.energyUse / livingSpace);
    this.co2IntensitySubject.next(co2Intensity);
    this.energyIntensitySubject.next(energyIntensity);
    
    // Initialize editable future values
    this.editableFutureValuesSubject.next({
      energyCosts: futureValues.energyCosts,
      energyUse: futureValues.energyUse,
      co2Emissions: futureValues.co2Emissions,
      energyRating: futureValues.energyRating
    });
    
    // Initialize editable current values
    this.editableCurrentValuesSubject.next({
      energyRating: currentValues.energyRating
    });
    
    // Update savings values
    this.updateSavingsValues();
    
    // Initialize renovation costs
    this.renovationCostsSubject.next(this.initDefaultRenovationCosts());
    
    // Initialize stranding data
    const strandingData: StrandingData = {
      currentStrandingPoint: consumptionData?.strandingPoint || 2018,
      strandingRisk: consumptionData?.strandingRisk || -7,
      strandingPointChange: '+25 Jahre',
      newStrandingPoint: 2050
    };
    this.strandingDataSubject.next(strandingData);
    
    // Initialize editable stranding data
    this.editableStrandingDataSubject.next({
      currentStrandingPoint: strandingData.currentStrandingPoint,
      strandingRisk: strandingData.strandingRisk,
      strandingPointChange: 25, // Numeric value for editing
      newStrandingPoint: strandingData.newStrandingPoint
    });
  }
  
  // Get energy rating based on energy intensity
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
  
  // Calculate and update savings values
  updateSavingsValues(): void {
    const currentValues = this.currentValuesSubject.getValue();
    const futureValues = this.futureValuesSubject.getValue();
    
    // Calculate savings values: heute - zukunft
    const savingsValues: SavingsValues = {
      energyCosts: currentValues.energyCosts - futureValues.energyCosts,
      energyUse: currentValues.energyUse - futureValues.energyUse,
      co2Emissions: currentValues.co2Emissions - futureValues.co2Emissions
    };
    this.savingsValuesSubject.next(savingsValues);
    
    // Calculate savings percentages: heute/zukunft
    const savingsPercentages: SavingsPercentages = {
      energyCosts: this.calculateSavingsPercentage(currentValues.energyCosts, futureValues.energyCosts),
      energyUse: this.calculateSavingsPercentage(currentValues.energyUse, futureValues.energyUse),
      co2Emissions: this.calculateSavingsPercentage(currentValues.co2Emissions, futureValues.co2Emissions)
    };
    this.savingsPercentagesSubject.next(savingsPercentages);
  }
  
  // Helper for calculating savings percentage
  calculateSavingsPercentage(heute: number, zukunft: number): number {
    if (zukunft === 0) return 0; // Avoid division by zero
    return Math.round((heute / zukunft) * 100);
  }
  
  // Generic percentage calculation
  calculatePercentage(value: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  }
  
  // Toggle edit mode
  toggleEditMode(): void {
    const currentEditMode = this.isEditModeSubject.getValue();
    
    if (currentEditMode) {
      // Exit edit mode without saving
      this.isEditModeSubject.next(false);
      
      // Reset editable values to match current values
      const futureValues = this.futureValuesSubject.getValue();
      this.editableFutureValuesSubject.next({
        energyCosts: futureValues.energyCosts,
        energyUse: futureValues.energyUse,
        co2Emissions: futureValues.co2Emissions,
        energyRating: futureValues.energyRating
      });
      
      const currentValues = this.currentValuesSubject.getValue();
      this.editableCurrentValuesSubject.next({
        energyRating: currentValues.energyRating
      });
      
      // Reset editable stranding data
      const strandingData = this.strandingDataSubject.getValue();
      this.editableStrandingDataSubject.next({
        currentStrandingPoint: strandingData.currentStrandingPoint,
        strandingRisk: strandingData.strandingRisk,
        strandingPointChange: typeof strandingData.strandingPointChange === 'string' ? 
          parseInt(strandingData.strandingPointChange.replace(/[^0-9-]/g, '')) : 
          strandingData.strandingPointChange,
        newStrandingPoint: strandingData.newStrandingPoint
      });
    } else {
      // Enter edit mode
      this.isEditModeSubject.next(true);
      
      // Initialize editable values
      const futureValues = this.futureValuesSubject.getValue();
      this.editableFutureValuesSubject.next({
        energyCosts: futureValues.energyCosts,
        energyUse: futureValues.energyUse,
        co2Emissions: futureValues.co2Emissions,
        energyRating: futureValues.energyRating
      });
      
      const currentValues = this.currentValuesSubject.getValue();
      this.editableCurrentValuesSubject.next({
        energyRating: currentValues.energyRating
      });
      
      // Initialize editable stranding data
      const strandingData = this.strandingDataSubject.getValue();
      this.editableStrandingDataSubject.next({
        currentStrandingPoint: strandingData.currentStrandingPoint,
        strandingRisk: strandingData.strandingRisk,
        strandingPointChange: typeof strandingData.strandingPointChange === 'string' ? 
          parseInt(strandingData.strandingPointChange.replace(/[^0-9-]/g, '')) : 
          strandingData.strandingPointChange,
        newStrandingPoint: strandingData.newStrandingPoint
      });
    }
  }
  
  // Save changes
  saveChanges(
    consumptionData: ConsumptionData, 
    futureValues: FutureValues,
    editableFutureValues: CurrentValues,
    editableStrandingData: StrandingData
  ): Observable<ConsumptionData> {
    // Update current values
    const editableCurrentValues = this.editableCurrentValuesSubject.getValue();
    const currentValues = this.currentValuesSubject.getValue();
    currentValues.energyRating = editableCurrentValues.energyRating;
    this.currentValuesSubject.next(currentValues);
    
    // Use the passed future values and editable future values
    futureValues.energyCosts = editableFutureValues.energyCosts;
    futureValues.energyUse = editableFutureValues.energyUse;
    futureValues.co2Emissions = editableFutureValues.co2Emissions;
    futureValues.energyRating = editableFutureValues.energyRating;
    this.futureValuesSubject.next(futureValues);
    
    // Use the passed editable stranding data
    const strandingData: StrandingData = {
      currentStrandingPoint: editableStrandingData.currentStrandingPoint,
      strandingRisk: editableStrandingData.strandingRisk,
      strandingPointChange: '+' + editableStrandingData.strandingPointChange + ' Jahre',
      newStrandingPoint: editableStrandingData.newStrandingPoint
    };
    this.strandingDataSubject.next(strandingData);
    
    // Update consumptionData with new stranding data for persistence
    consumptionData.strandingPoint = strandingData.currentStrandingPoint;
    consumptionData.strandingRisk = strandingData.strandingRisk;
    
    // Recalculate CO2 intensity and energy intensity
    const livingSpace = this.livingSapceSubject.getValue();
    const co2Intensity = Math.round(futureValues.co2Emissions / livingSpace);
    const energyIntensity = Math.round(futureValues.energyUse / livingSpace);
    this.co2IntensitySubject.next(co2Intensity);
    this.energyIntensitySubject.next(energyIntensity);
    
    // Update savings values
    this.updateSavingsValues();
    
    // Reset edit mode
    this.isEditModeSubject.next(false);
    
    // Update the data through the service
    return this.dossierDataService.updateConsumptionData(consumptionData);
  }
  
  // Cancel changes
  cancelChanges(): void {
    // Exit edit mode without saving
    this.isEditModeSubject.next(false);
    
    // Reset editable values to original values
    const futureValues = this.futureValuesSubject.getValue();
    this.editableFutureValuesSubject.next({
      energyCosts: futureValues.energyCosts,
      energyUse: futureValues.energyUse,
      co2Emissions: futureValues.co2Emissions,
      energyRating: futureValues.energyRating
    });
    
    const currentValues = this.currentValuesSubject.getValue();
    this.editableCurrentValuesSubject.next({
      energyRating: currentValues.energyRating
    });
    
    // Reset editable stranding data
    const strandingData = this.strandingDataSubject.getValue();
    this.editableStrandingDataSubject.next({
      currentStrandingPoint: strandingData.currentStrandingPoint,
      strandingRisk: strandingData.strandingRisk,
      strandingPointChange: typeof strandingData.strandingPointChange === 'string' ? 
        parseInt(strandingData.strandingPointChange.replace(/[^0-9-]/g, '')) : 
        strandingData.strandingPointChange,
      newStrandingPoint: strandingData.newStrandingPoint
    });
  }
  
  // Set user type (Vermieter/Eigennutzer)
  setUserType(isVermieter: boolean): void {
    this.isVermieterSubject.next(isVermieter);
  }
  
  // Calculate Vermieter share based on CO2 intensity
  getVermieterShareFromCO2Intensity(co2Intensity: number): number {
    // Find the appropriate share percentage based on CO2 intensity
    for (const entry of this.co2IntensityTable) {
      if (co2Intensity < entry.maxValue) {
        return entry.vermieterShare;
      }
    }
    // If we reach here, use the maximum share (95%)
    return 95;
  }
  
  // Calculate total CO2 tax based on CO2 intensity
  // Formula: 55 * CO2 Intensity / 1000
  calculateTotalCO2Tax(): number {
    const co2Intensity = this.co2IntensitySubject.getValue();
    // Calculate total CO2 tax (55€ per tonne of CO2)
    const totalCO2Tax = (55 * co2Intensity) / 1000;
    return parseFloat(totalCO2Tax.toFixed(2));
  }
  
  // Calculate CO2 tax per square meter
  // Formula: calculateTotalCO2Tax / livingSpace
  calculateCO2TaxPerM2(): number {
    const totalCO2Tax = this.calculateTotalCO2Tax();
    const livingSpace = this.livingSapceSubject.getValue();
    
    if (livingSpace > 0) {
      const co2TaxPerM2 = totalCO2Tax / livingSpace;
      return parseFloat(co2TaxPerM2.toFixed(2));
    }
    return 0;
  }
  
  // Calculate Vermieter's share of the CO2 tax
  calculateVermieterCO2TaxTotal(): number {
    const totalCO2Tax = this.calculateTotalCO2Tax();
    const co2Intensity = this.co2IntensitySubject.getValue();
    const vermieterShare = this.getVermieterShareFromCO2Intensity(co2Intensity);
    
    const vermieterTaxTotal = totalCO2Tax * (vermieterShare / 100);
    return parseFloat(vermieterTaxTotal.toFixed(2));
  }
  
  // Calculate Vermieter CO2 tax
  calculateVermieterCO2Tax(): number {
    const co2Intensity = this.co2IntensitySubject.getValue();
    const vermieterSharePercent = this.getVermieterShareFromCO2Intensity(co2Intensity);
    const vermieterTax = (55 * co2Intensity / 1000) * (vermieterSharePercent / 100);
    return parseFloat(vermieterTax.toFixed(2));
  }
  
  // Update renovation costs
  updateRenovationCosts(renovationCosts: RenovationCosts): void {
    this.renovationCostsSubject.next(renovationCosts);
  }

  // Public methods to get current values
  getCurrentValues(): CurrentValues {
    return this.currentValuesSubject.getValue();
  }

  getFutureValues(): FutureValues {
    return this.futureValuesSubject.getValue();
  }

  getEditableFutureValues(): CurrentValues {
    return this.editableFutureValuesSubject.getValue();
  }

  getEditableCurrentValues(): {energyRating: string} {
    return this.editableCurrentValuesSubject.getValue();
  }

  getSavingsValues(): SavingsValues {
    return this.savingsValuesSubject.getValue();
  }

  getSavingsPercentages(): SavingsPercentages {
    return this.savingsPercentagesSubject.getValue();
  }

  getRenovationCosts(): RenovationCosts {
    return this.renovationCostsSubject.getValue();
  }

  getStrandingData(): StrandingData {
    return this.strandingDataSubject.getValue();
  }

  getEditableStrandingData(): StrandingData {
    return this.editableStrandingDataSubject.getValue();
  }

  getCO2Intensity(): number {
    return this.co2IntensitySubject.getValue();
  }

  getEnergyIntensity(): number {
    return this.energyIntensitySubject.getValue();
  }

  getLivingSpace(): number {
    return this.livingSapceSubject.getValue();
  }

  getIsEditMode(): boolean {
    return this.isEditModeSubject.getValue();
  }

  getIsVermieter(): boolean {
    return this.isVermieterSubject.getValue();
  }
}
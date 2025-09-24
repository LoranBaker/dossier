import { Component, OnInit, Input, OnChanges, SimpleChanges, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ConsumptionData } from '@models/models';
import { RenovationMeasure } from '@models/models';
import { SavingsPotential } from '@models/models';
import { DossierDataService } from '../../services/dossier-data.service';
import { 
  RenovationResultsService, 
  StrandingData, 
  RenovationCosts, 
  CurrentValues, 
  FutureValues, 
  SavingsValues, 
  SavingsPercentages 
} from '../../services/renovation-results.service';

@Component({
  selector: 'app-renovation-results-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './renovation-results-tab.component.html',
  styleUrls: ['./renovation-results-tab.component.scss']
})
export class RenovationResultsTabComponent implements OnInit, OnChanges {
  @Input() consumptionData!: ConsumptionData;
  @Input() renovationMeasures!: RenovationMeasure[];
  @Input() savingsPotential!: SavingsPotential;
  @Input() totalCosts!: number; // Added input for total costs from renovation tab
  @Input() totalFunding!: number;
  @Input() co2TaxFromConsumption: { eigennutzerTotal: number; vermieterTotal: number } = { eigennutzerTotal: 0, vermieterTotal: 0 };

  @Output() savingsPercentagesChanged = new EventEmitter<{
    energyCostSavings: number;
    energyBalanceSavings: number;
    co2TaxSavings: number;
  }>();

  @Output() energyRatingChanged = new EventEmitter<{
    currentEnergyRating: string;
    targetEnergyRating: string;
  }>();

  isEditMode = false;
  isVermieter = false; // Added for vermieter/eigennutzer switch
  editableConsumptionData: ConsumptionData | null = null;
  
  // Data models
  strandingData!: StrandingData;
  editableStrandingData!: StrandingData;
  editableRenovationCosts!: RenovationCosts;
  currentValues!: CurrentValues;
  futureValues!: FutureValues;
  editableFutureValues!: FutureValues;
  editableCurrentValues!: Partial<CurrentValues>;
  savingsValues!: SavingsValues;
  savingsPercentages!: SavingsPercentages;
  
  // For ESG management calculations
  co2Intensity = 0;
  energyIntensity = 0;
  livingSpace = 0;

  constructor(
    private dossierDataService: DossierDataService,
    private renovationResultsService: RenovationResultsService
  ) { }

  ngOnInit(): void {
    const building = this.dossierDataService.getCurrentBuilding();
    this.livingSpace = building.livingSpace || 399;
    this.initializeData();
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['consumptionData'] || changes['renovationMeasures'] || 
        changes['totalCosts'] || changes['totalFunding']) {
      this.initializeData();
      // Emit percentages whenever inputs change
      setTimeout(() => {
        this.emitSavingsPercentages();
        this.emitEnergyRatings();
      }, 0);
    }
  }
  
  initializeData(): void {
    // Get the livingSpace from the building data
    const building = this.dossierDataService.getCurrentBuilding();
    this.livingSpace = building.livingSpace || 399; // Default to 399 if not available
    
    // Initialize data using service
    this.currentValues = this.renovationResultsService.initializeCurrentValues(this.consumptionData);
    
    // Get target energy rating from service
    const targetEnergyRating = this.renovationResultsService.calculateTargetEnergyRating(this.renovationMeasures);
    this.futureValues = this.renovationResultsService.initializeFutureValues(this.currentValues, targetEnergyRating);
    
    this.strandingData = this.renovationResultsService.initializeStrandingData(this.consumptionData);
    this.editableRenovationCosts = this.renovationResultsService.initializeRenovationCosts(this.totalCosts, this.totalFunding);
    
    // Calculate CO2 intensity and energy intensity
    this.co2Intensity = this.renovationResultsService.calculateCO2Intensity(this.futureValues.co2Emissions, this.livingSpace);
    this.energyIntensity = this.renovationResultsService.calculateEnergyIntensity(this.futureValues.energyUse, this.livingSpace);
    
    // Initialize editable future values
    this.editableFutureValues = {
      energyCosts: this.futureValues.energyCosts,
      energyUse: this.futureValues.energyUse,
      co2Emissions: this.futureValues.co2Emissions,
      energyRating: this.futureValues.energyRating,
      co2Tax: this.futureValues.co2Tax
    };
    
    // Initialize editable current values
    this.editableCurrentValues = {
      energyRating: this.currentValues.energyRating
    };
    
    this.updateSavingsValues();
    
    // Emit energy ratings whenever they change
    this.emitEnergyRatings();
    
    // Initialize editable stranding data
    this.editableStrandingData = {
      currentStrandingPoint: this.strandingData.currentStrandingPoint,
      strandingRisk: this.strandingData.strandingRisk,
      strandingPointChange: this.renovationResultsService.parseStrandingPointChange(this.strandingData.strandingPointChange),
      newStrandingPoint: this.strandingData.newStrandingPoint
    };
  }
  
  updateSavingsValues(): void {
    // Calculate savings using service
    this.savingsValues = this.renovationResultsService.calculateSavingsValues(this.currentValues, this.futureValues);
    this.savingsPercentages = this.renovationResultsService.calculateSavingsPercentages(this.currentValues, this.futureValues);
    
    this.emitSavingsPercentages();
  }

  private emitSavingsPercentages(): void {
    const percentagesData = {
      energyCostSavings: this.savingsPercentages.energyCosts,
      energyBalanceSavings: this.savingsPercentages.energyUse,
      co2TaxSavings: this.savingsPercentages.co2Emissions
    };
    
    console.log('Emitting savings percentages:', percentagesData);
    this.savingsPercentagesChanged.emit(percentagesData);
  }

  private emitEnergyRatings(): void {
    const energyRatingData = {
      currentEnergyRating: this.currentValues.energyRating,
      targetEnergyRating: this.futureValues.energyRating
    };
    
    console.log('Emitting energy ratings:', energyRatingData);
    this.energyRatingChanged.emit(energyRatingData);
  }

  getRatingPositionFromIntensity(energyIntensity: number): number {
    return this.renovationResultsService.getRatingPositionFromIntensity(energyIntensity);
  }

  getCurrentEnergyIntensity(): number {
    return this.renovationResultsService.getCurrentEnergyIntensity(this.consumptionData);
  }

  calculateSavingsPercentage(heute: number, zukunft: number): number {
    return this.renovationResultsService.calculateSavingsPercentage(heute, zukunft);
  }
  
  // Keep this for other percentage calculations
  calculatePercentage(value: number, total: number): number {
    return this.renovationResultsService.calculatePercentage(value, total);
  }
  
  getEnergyRating(energyIntensity: number): string {
    return this.renovationResultsService.getEnergyRating(energyIntensity);
  }
  
  toggleEditMode(): void {
    if (this.isEditMode) {
      // Exit edit mode without saving
      this.isEditMode = false;
      this.editableConsumptionData = null;
      // Reset editable values to match current values
      this.editableFutureValues = {
        energyCosts: this.futureValues.energyCosts,
        energyUse: this.futureValues.energyUse,
        co2Emissions: this.futureValues.co2Emissions,
        energyRating: this.futureValues.energyRating,
        co2Tax: this.futureValues.co2Tax
      };
      this.editableCurrentValues = {
        energyRating: this.currentValues.energyRating
      };
      // Reset editable stranding data
      this.editableStrandingData = {
        currentStrandingPoint: this.strandingData.currentStrandingPoint,
        strandingRisk: this.strandingData.strandingRisk,
        strandingPointChange: this.renovationResultsService.parseStrandingPointChange(this.strandingData.strandingPointChange),
        newStrandingPoint: this.strandingData.newStrandingPoint
      };
    } else {
      // Enter edit mode
      this.isEditMode = true;
      // Clone the consumption data for editing
      this.editableConsumptionData = { ...this.consumptionData };
      // Initialize editable values
      this.editableFutureValues = {
        energyCosts: this.futureValues.energyCosts,
        energyUse: this.futureValues.energyUse,
        co2Emissions: this.futureValues.co2Emissions,
        energyRating: this.futureValues.energyRating,
        co2Tax: this.futureValues.co2Tax
      };
      this.editableCurrentValues = {
        energyRating: this.currentValues.energyRating
      };
      // Initialize editable stranding data
      this.editableStrandingData = {
        currentStrandingPoint: this.strandingData.currentStrandingPoint,
        strandingRisk: this.strandingData.strandingRisk,
        strandingPointChange: this.renovationResultsService.parseStrandingPointChange(this.strandingData.strandingPointChange),
        newStrandingPoint: this.strandingData.newStrandingPoint
      };
    }
  }
  
  saveChanges(): void {
    if (this.editableConsumptionData) {
      // Update the consumption data
      Object.assign(this.consumptionData, this.editableConsumptionData);
      
      // Update current values
      this.currentValues.energyRating = this.editableCurrentValues.energyRating!;
      
      // Update future values with editable values
      this.futureValues.energyCosts = this.editableFutureValues.energyCosts;
      this.futureValues.energyUse = this.editableFutureValues.energyUse;
      this.futureValues.co2Emissions = this.editableFutureValues.co2Emissions;
      this.futureValues.energyRating = this.editableFutureValues.energyRating;
      
      // Update stranding data
      this.strandingData = {
        currentStrandingPoint: this.editableStrandingData.currentStrandingPoint,
        strandingRisk: this.editableStrandingData.strandingRisk,
        strandingPointChange: this.renovationResultsService.formatStrandingPointChange(this.editableStrandingData.strandingPointChange as number),
        newStrandingPoint: this.editableStrandingData.newStrandingPoint
      };
      
      // Update consumptionData with new stranding data for persistence
      this.consumptionData.strandingPoint = this.strandingData.currentStrandingPoint;
      this.consumptionData.strandingRisk = this.strandingData.strandingRisk;
      
      // Recalculate CO2 intensity and energy intensity
      this.co2Intensity = this.renovationResultsService.calculateCO2Intensity(this.futureValues.co2Emissions, this.livingSpace);
      this.energyIntensity = this.renovationResultsService.calculateEnergyIntensity(this.futureValues.energyUse, this.livingSpace);
      
      // Update savings values
      this.updateSavingsValues();
      
      // Emit updated energy ratings
      this.emitEnergyRatings();
      
      // Update the service
      this.dossierDataService.updateConsumptionData(this.consumptionData).subscribe(() => {
        // Show saved message with Apple-style animation
        const savedMessage = document.getElementById('renovation-results-saved-message');
        if (savedMessage) {
          savedMessage.classList.add('show');
          setTimeout(() => {
            savedMessage.classList.remove('show');
          }, 3000);
        }
      });
    }
    
    // Exit edit mode
    this.isEditMode = false;
    this.editableConsumptionData = null;
  }
  
  cancelChanges(): void {
    // Exit edit mode without saving
    this.isEditMode = false;
    this.editableConsumptionData = null;
    // Reset editable values to original values
    this.editableFutureValues = {
      energyCosts: this.futureValues.energyCosts,
      energyUse: this.futureValues.energyUse,
      co2Emissions: this.futureValues.co2Emissions,
      energyRating: this.futureValues.energyRating,
      co2Tax: this.futureValues.co2Tax
    };
    this.editableCurrentValues = {
      energyRating: this.currentValues.energyRating
    };
    // Reset editable stranding data
    this.editableStrandingData = {
      currentStrandingPoint: this.strandingData.currentStrandingPoint,
      strandingRisk: this.strandingData.strandingRisk,
      strandingPointChange: this.renovationResultsService.parseStrandingPointChange(this.strandingData.strandingPointChange),
      newStrandingPoint: this.strandingData.newStrandingPoint
    };
  }
  
  // Helper function to get stranding point difference - not used anymore since we use the model
  getStrandingPointDifference(): string {
    return this.strandingData.strandingPointChange.toString();
  }
  
  // Helper function to get new stranding point - not used anymore since we use the model
  getNewStrandingPoint(): number {
    return this.strandingData.newStrandingPoint;
  }
  
  // Handle user type change (Vermieter/Eigennutzer)
  onUserTypeChange(): void {
    // Ensure proper value with type conversion
    setTimeout(() => {
      this.isVermieter = !!this.isVermieter;
    });
  }
  
  // Calculate Vermieter share based on CO2 intensity
  getVermieterShareFromCO2Intensity(co2Intensity: number): number {
    return this.renovationResultsService.getVermieterShareFromCO2Intensity(co2Intensity);
  }
  
  // Calculate CO2 tax per m²
  calculateCO2TaxPerM2(): number {
    return this.renovationResultsService.calculateCO2TaxPerM2(
      this.isVermieter, 
      this.co2TaxFromConsumption, 
      this.livingSpace
    );
  }

  // Calculate total CO2 tax
  calculateTotalCO2Tax(): number {
    return this.renovationResultsService.calculateTotalCO2Tax(
      this.isVermieter, 
      this.co2TaxFromConsumption
    );
  }
  
  // Calculate Vermieter's share of the CO2 tax
  calculateVermieterCO2TaxTotal(): number {
    return this.renovationResultsService.calculateVermieterCO2TaxTotal(
      this.isVermieter,
      this.co2TaxFromConsumption,
      this.co2Intensity
    );
  }
  
  calculateVermieterCO2Tax(): number {
    return this.renovationResultsService.calculateVermieterCO2Tax(this.co2Intensity);
  }
}
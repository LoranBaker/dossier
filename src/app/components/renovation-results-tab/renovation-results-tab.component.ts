import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ConsumptionData } from '@models/models';
import { RenovationMeasure } from '@models/models';
import { SavingsPotential } from '@models/models';
import { DossierDataService } from '../../services/dossier-data.service';

// Interface for the stranding data
interface StrandingData {
  currentStrandingPoint: number;
  strandingRisk: number;
  strandingPointChange: string | number;
  newStrandingPoint: number;
}

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
  
  isEditMode = false;
  isVermieter = false; // Added for vermieter/eigennutzer switch
  editableConsumptionData: ConsumptionData | null = null;
  
  // Added stranding data model
  strandingData: StrandingData = {
    currentStrandingPoint: 2018,
    strandingRisk: -7,
    strandingPointChange: '+25 Jahre',
    newStrandingPoint: 2050
  };
  
  // Editable copy of stranding data
  editableStrandingData: StrandingData = {
    currentStrandingPoint: 2018,
    strandingRisk: -7,
    strandingPointChange: 25,
    newStrandingPoint: 2050
  };
  
  editableRenovationCosts = {
    totalCost: 0,
    funding: 0,
    ownContribution: 0,
    fundingRate: 20.0
  };
  
  // Current values from consumption data
  currentValues = {
    energyCosts: 0,
    energyUse: 0,
    co2Emissions: 0,
    energyRating: 'E'
  };
  
  // Future values after renovation
  futureValues = {
    energyCosts: 0,
    energyUse: 0,
    co2Emissions: 0,
    energyRating: 'A',
    co2Tax: 0
  };
  
  // Editable future values
  editableFutureValues = {
    energyCosts: 0,
    energyUse: 0,
    co2Emissions: 0,
    energyRating: 'A'
  };
  
  // Editable current values
  editableCurrentValues = {
    energyRating: 'E'
  };
  
  // Savings values
  savingsValues = {
    energyCosts: 0,
    energyUse: 0,
    co2Emissions: 0
  };
  
  // Savings percentages
  savingsPercentages = {
    energyCosts: 0,
    energyUse: 0,
    co2Emissions: 0
  };
  
  // For ESG management calculations
  co2Intensity = 0;
  energyIntensity = 0;
  livingSpace = 0;
  
  // CO2 intensity to Vermieter share mapping table
  co2IntensityTable = [
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

  constructor(private dossierDataService: DossierDataService) { }

  ngOnInit(): void {
    this.initializeData();
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['consumptionData'] || changes['renovationMeasures']) {
      this.initializeData();
    }
  }
  
  initializeData(): void {
    // Get the livingSpace from the building data
    const building = this.dossierDataService.getCurrentBuilding();
    this.livingSpace = building.livingSpace || 399; // Default to 399 if not available
    
    // Load current values from consumption data
    this.currentValues = {
      energyCosts: this.consumptionData?.energyCosts || 5930,
      energyUse: this.consumptionData?.totalEnergy || 45500,
      co2Emissions: this.consumptionData?.co2Emissions || 10826,
      energyRating: this.getEnergyRating(this.consumptionData?.energyIntensity || 197)
    };
    
    // Initialize future values (post-renovation)
    // Using current values for co2Emissions and energyUse as requested
    this.futureValues = {
      energyCosts: 1092,
      energyUse: this.currentValues.energyUse, // Using current energy use value
      co2Emissions: this.currentValues.co2Emissions, // Using current CO2 emissions value
      energyRating: 'A',
      co2Tax: 0
    };
    
    // Calculate CO2 intensity and energy intensity
    // CO2 Intensity = CO2 Emissions / Living Space
    this.co2Intensity = Math.round(this.futureValues.co2Emissions / this.livingSpace);
    
    // Energy Intensity = Energy Use / Living Space
    this.energyIntensity = Math.round(this.futureValues.energyUse / this.livingSpace);
    
    // Initialize editable future values
    this.editableFutureValues = {
      energyCosts: this.futureValues.energyCosts,
      energyUse: this.futureValues.energyUse,
      co2Emissions: this.futureValues.co2Emissions,
      energyRating: this.futureValues.energyRating
    };
    
    // Initialize editable current values
    this.editableCurrentValues = {
      energyRating: this.currentValues.energyRating
    };
    
    this.updateSavingsValues();
    
    // Initialize renovation costs
    this.editableRenovationCosts = {
      totalCost: 118750,
      funding: 23825,
      ownContribution: 94925,
      fundingRate: 20.0
    };
    
    // Initialize stranding data
    this.strandingData = {
      currentStrandingPoint: this.consumptionData?.strandingPoint || 2018,
      strandingRisk: this.consumptionData?.strandingRisk || -7,
      strandingPointChange: '+25 Jahre',
      newStrandingPoint: 2050
    };
    
    // Initialize editable stranding data
    this.editableStrandingData = {
      currentStrandingPoint: this.strandingData.currentStrandingPoint,
      strandingRisk: this.strandingData.strandingRisk,
      strandingPointChange: 25, // Numeric value for editing
      newStrandingPoint: this.strandingData.newStrandingPoint
    };
  }
  
  updateSavingsValues(): void {
    // Calculate savings values: heute - zukunft
    this.savingsValues = {
      energyCosts: this.currentValues.energyCosts - this.futureValues.energyCosts,
      energyUse: this.currentValues.energyUse - this.futureValues.energyUse,
      co2Emissions: this.currentValues.co2Emissions - this.futureValues.co2Emissions
    };
    
    // Calculate savings percentages: heute/zukunft
    this.savingsPercentages = {
      energyCosts: this.calculateSavingsPercentage(this.currentValues.energyCosts, this.futureValues.energyCosts),
      energyUse: this.calculateSavingsPercentage(this.currentValues.energyUse, this.futureValues.energyUse),
      co2Emissions: this.calculateSavingsPercentage(this.currentValues.co2Emissions, this.futureValues.co2Emissions)
    };
  }
  
  calculateSavingsPercentage(heute: number, zukunft: number): number {
    if (zukunft === 0) return 0; // Avoid division by zero
    return Math.round((heute / zukunft) * 100);
  }
  
  // Keep this for other percentage calculations
  calculatePercentage(value: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  }
  
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
        energyRating: this.futureValues.energyRating
      };
      this.editableCurrentValues = {
        energyRating: this.currentValues.energyRating
      };
      // Reset editable stranding data
      this.editableStrandingData = {
        currentStrandingPoint: this.strandingData.currentStrandingPoint,
        strandingRisk: this.strandingData.strandingRisk,
        strandingPointChange: typeof this.strandingData.strandingPointChange === 'string' ? 
          parseInt(this.strandingData.strandingPointChange.replace(/[^0-9-]/g, '')) : 
          this.strandingData.strandingPointChange,
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
        energyRating: this.futureValues.energyRating
      };
      this.editableCurrentValues = {
        energyRating: this.currentValues.energyRating
      };
      // Initialize editable stranding data
      this.editableStrandingData = {
        currentStrandingPoint: this.strandingData.currentStrandingPoint,
        strandingRisk: this.strandingData.strandingRisk,
        strandingPointChange: typeof this.strandingData.strandingPointChange === 'string' ? 
          parseInt(this.strandingData.strandingPointChange.replace(/[^0-9-]/g, '')) : 
          this.strandingData.strandingPointChange,
        newStrandingPoint: this.strandingData.newStrandingPoint
      };
    }
  }
  
  saveChanges(): void {
    if (this.editableConsumptionData) {
      // Update the consumption data
      Object.assign(this.consumptionData, this.editableConsumptionData);
      
      // Update current values
      this.currentValues.energyRating = this.editableCurrentValues.energyRating;
      
      // Update future values with editable values
      this.futureValues.energyCosts = this.editableFutureValues.energyCosts;
      this.futureValues.energyUse = this.editableFutureValues.energyUse;
      this.futureValues.co2Emissions = this.editableFutureValues.co2Emissions;
      this.futureValues.energyRating = this.editableFutureValues.energyRating;
      
      // Update stranding data
      this.strandingData = {
        currentStrandingPoint: this.editableStrandingData.currentStrandingPoint,
        strandingRisk: this.editableStrandingData.strandingRisk,
        strandingPointChange: '+' + this.editableStrandingData.strandingPointChange + ' Jahre',
        newStrandingPoint: this.editableStrandingData.newStrandingPoint
      };
      
      // Update consumptionData with new stranding data for persistence
      this.consumptionData.strandingPoint = this.strandingData.currentStrandingPoint;
      this.consumptionData.strandingRisk = this.strandingData.strandingRisk;
      
      // Recalculate CO2 intensity and energy intensity
      this.co2Intensity = Math.round(this.futureValues.co2Emissions / this.livingSpace);
      this.energyIntensity = Math.round(this.futureValues.energyUse / this.livingSpace);
      
      // Update savings values
      this.updateSavingsValues();
      
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
      energyRating: this.futureValues.energyRating
    };
    this.editableCurrentValues = {
      energyRating: this.currentValues.energyRating
    };
    // Reset editable stranding data
    this.editableStrandingData = {
      currentStrandingPoint: this.strandingData.currentStrandingPoint,
      strandingRisk: this.strandingData.strandingRisk,
      strandingPointChange: typeof this.strandingData.strandingPointChange === 'string' ? 
        parseInt(this.strandingData.strandingPointChange.replace(/[^0-9-]/g, '')) : 
        this.strandingData.strandingPointChange,
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
    // Calculate total CO2 tax (55€ per tonne of CO2)
    const totalCO2Tax = (55 * this.co2Intensity) / 1000;
    return parseFloat(totalCO2Tax.toFixed(2));
  }
  
  // Calculate CO2 tax per square meter
  // Formula: calculateTotalCO2Tax / livingSpace
  calculateCO2TaxPerM2(): number {
    const totalCO2Tax = this.calculateTotalCO2Tax();
    if (this.livingSpace > 0) {
      const co2TaxPerM2 = totalCO2Tax / this.livingSpace;
      return parseFloat(co2TaxPerM2.toFixed(2));
    }
    return 0;
  }
  
  // Calculate Vermieter's share of the CO2 tax
  calculateVermieterCO2TaxTotal(): number {
    const totalCO2Tax = this.calculateTotalCO2Tax();
    const vermieterShare = this.getVermieterShareFromCO2Intensity(this.co2Intensity);
    
    const vermieterTaxTotal = totalCO2Tax * (vermieterShare / 100);
    return parseFloat(vermieterTaxTotal.toFixed(2));
  }
  
  calculateVermieterCO2Tax(): number {
    const vermieterSharePercent = this.getVermieterShareFromCO2Intensity(this.co2Intensity);
    const vermieterTax = (55 * this.co2Intensity / 1000) * (vermieterSharePercent / 100);
    return parseFloat(vermieterTax.toFixed(2));
  }
}
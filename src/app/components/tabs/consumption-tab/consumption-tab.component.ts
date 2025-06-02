import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConsumptionData } from '@models/models';
import { Building } from '@models/building.model';

@Component({
  selector: 'app-consumption-tab',
  templateUrl: './consumption-tab.component.html',
  styleUrls: ['./consumption-tab.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class ConsumptionTabComponent implements OnInit {
  @Input() consumptionData!: ConsumptionData;
  @Input() building!: Building;
  
  isEditMode = false;
  editableConsumptionData: ConsumptionData | null = null;
  
  // Calculate energy rating marker position based on energy intensity
  get energyRatingPosition(): string {
    const intensity = this.isEditMode && this.editableConsumptionData 
      ? this.editableConsumptionData.energyIntensity 
      : this.consumptionData.energyIntensity;
    
    // Calculate position on scale (0-250+ kWh/m²)
    // Map intensity to percentage position on the scale
    let position = 0;
    
    if (intensity <= 25) {
      // A+ (0-25)
      position = (intensity / 25) * 11; // 0-11%
    } else if (intensity <= 50) {
      // A (25-50)
      position = 11 + ((intensity - 25) / 25) * 11; // 11-22%
    } else if (intensity <= 75) {
      // B (50-75)
      position = 22 + ((intensity - 50) / 25) * 11; // 22-33%
    } else if (intensity <= 100) {
      // C (75-100)
      position = 33 + ((intensity - 75) / 25) * 11; // 33-44%
    } else if (intensity <= 125) {
      // D (100-125)
      position = 44 + ((intensity - 100) / 25) * 11; // 44-55%
    } else if (intensity <= 150) {
      // E (125-150)
      position = 55 + ((intensity - 125) / 25) * 11; // 55-66%
    } else if (intensity <= 175) {
      // F (150-175)
      position = 66 + ((intensity - 150) / 25) * 11; // 66-77%
    } else if (intensity <= 200) {
      // G (175-200)
      position = 77 + ((intensity - 175) / 25) * 11; // 77-88%
    } else {
      // H (>200)
      position = 88 + Math.min(((intensity - 200) / 50) * 12, 12); // 88-100%
    }
    
    return `${position}%`;
  }
  
  // Get the energy efficiency rating (A+, A, B, etc.) based on intensity
  get energyEfficiencyRating(): string {
    const intensity = this.isEditMode && this.editableConsumptionData 
      ? this.editableConsumptionData.energyIntensity 
      : this.consumptionData.energyIntensity;
    
    if (intensity <= 25) return 'A+';
    if (intensity <= 50) return 'A';
    if (intensity <= 75) return 'B';
    if (intensity <= 100) return 'C';
    if (intensity <= 125) return 'D';
    if (intensity <= 150) return 'E';
    if (intensity <= 175) return 'F';
    if (intensity <= 200) return 'G';
    return 'H';
  }
  
  ngOnInit() {
    this.calculateTotalEnergy();
    this.calculateIntensities();
  }
  
  toggleEditMode() {
    this.isEditMode = !this.isEditMode;
    if (this.isEditMode) {
      this.editableConsumptionData = JSON.parse(JSON.stringify(this.consumptionData));
    } else {
      this.editableConsumptionData = null;
    }
  }
  
  saveChanges() {
    if (this.editableConsumptionData) {
      this.calculateTotalEnergy();
      this.calculateIntensities();
      
      this.consumptionData = JSON.parse(JSON.stringify(this.editableConsumptionData));
      this.isEditMode = false;
      this.editableConsumptionData = null;
      this.showSavedMessage();
    }
  }
  
  cancelChanges() {
    this.isEditMode = false;
    this.editableConsumptionData = null;
  }
  
  calculateTotalEnergy() {
    if (this.isEditMode && this.editableConsumptionData) {
      this.editableConsumptionData.totalEnergy = 
        (this.editableConsumptionData.heating || 0) + 
        (this.editableConsumptionData.warmWater || 0) + 
        (this.editableConsumptionData.electricity || 0);
    } else {
      this.consumptionData.totalEnergy = 
        (this.consumptionData.heating || 0) + 
        (this.consumptionData.warmWater || 0) + 
        (this.consumptionData.electricity || 0);
    }
  }
  
calculateIntensities() {
  // Calculate CO2 emissions as (heating + warm water) * 0.2
  if (this.isEditMode && this.editableConsumptionData) {
    this.editableConsumptionData.co2Emissions = 
      ((this.editableConsumptionData.heating || 0) + 
       (this.editableConsumptionData.warmWater || 0)) * 0.2;
  } else {
    this.consumptionData.co2Emissions = 
      ((this.consumptionData.heating || 0) + 
       (this.consumptionData.warmWater || 0)) * 0.2;
  }

  // Calculate intensities (per m²) only if living space exists
  if (this.building && this.building.livingSpace > 0) {
    if (this.isEditMode && this.editableConsumptionData) {
      this.editableConsumptionData.co2Intensity = 
        Math.round(this.editableConsumptionData.co2Emissions / this.building.livingSpace);
      
      this.editableConsumptionData.energyIntensity = 
        Math.round(this.editableConsumptionData.totalEnergy / this.building.livingSpace);
    } else {
      this.consumptionData.co2Intensity = 
        Math.round(this.consumptionData.co2Emissions / this.building.livingSpace);
      
      this.consumptionData.energyIntensity = 
        Math.round(this.consumptionData.totalEnergy / this.building.livingSpace);
    }
  }
}
  
  onValueChange() {
    this.calculateTotalEnergy();
    this.calculateIntensities();
  }
  
  showSavedMessage() {
    const savedMessage = document.getElementById('consumption-saved-message');
    if (savedMessage) {
      savedMessage.classList.add('show');
      setTimeout(() => {
        savedMessage.classList.remove('show');
      }, 3000);
    }
  }

 // Add these properties and methods to ConsumptionTabComponent

isVermieter = false;

// Table for CO2 intensity to Vermieter share mapping
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

// Calculate Vermieter's CO2 tax per square meter
calculateVermieterCO2TaxTotal(): number {
  const data = this.isEditMode ? this.editableConsumptionData! : this.consumptionData;
  const co2Intensity = data.co2Intensity;
  const vermieterShare = this.getVermieterShareFromCO2Intensity(co2Intensity);
  
  return parseFloat((data.co2TaxTotal * (vermieterShare / 100)).toFixed(2));
}

// Calculate Vermieter's CO2 tax per square meter by dividing the total by living space
calculateVermieterCO2Tax(): number {
  const totalTax = this.calculateVermieterCO2TaxTotal();
  
  if (this.building && this.building.livingSpace > 0) {
    return parseFloat((totalTax / this.building.livingSpace).toFixed(2));
  }
  
  // If no living space data is available, fall back to the original calculation
  const data = this.isEditMode ? this.editableConsumptionData! : this.consumptionData;
  const co2Intensity = data.co2Intensity;
  const vermieterShare = this.getVermieterShareFromCO2Intensity(co2Intensity);
  
  return parseFloat((data.co2Tax * (vermieterShare / 100)).toFixed(2));
}

// Handle user type change
onUserTypeChange(): void {
  // Ensure proper value with type conversion
  setTimeout(() => {
    this.isVermieter = !!this.isVermieter;
  });
}
}
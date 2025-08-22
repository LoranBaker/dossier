// tabs/building-data-tab/building-data-tab.component.ts - Add methods for hazard classes
import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Building, HazardClass, SaniertPeriod } from '@models/building.model';

@Component({
  selector: 'app-building-data-tab',
  templateUrl: './building-data-tab.component.html',
  styleUrls: ['./building-data-tab.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class BuildingDataTabComponent implements OnInit {
  @Input() building!: Building;
  
  isEditMode = false;
  editableBuilding: Building | null = null;

  // For adding new renovations
  newRenovation = {
    type: '',
    quantity: '',
    year: null as number | null
  };

  // Hazard class level options
  hazardLevelOptions: Array<{value: 'gering' | 'mittel' | 'hoch', label: string}> = [
    { value: 'gering', label: 'gering' },
    { value: 'mittel', label: 'mittel' },
    { value: 'hoch', label: 'hoch' }
  ];

  // Saniert period options
  saniertPeriodOptions: Array<{value: SaniertPeriod, label: string}> = [
    { value: 'Nicht saniert', label: 'Nicht saniert' },
    { value: 'Saniert 1969-1978', label: 'Saniert 1969-1978' },
    { value: 'Saniert 1979-1983', label: 'Saniert 1979-1983' },
    { value: 'Saniert 1984-1994', label: 'Saniert 1984-1994' },
    { value: 'Saniert 1995-2002', label: 'Saniert 1995-2002' },
    { value: 'Saniert 2003-2009', label: 'Saniert 2003-2009' },
    { value: 'Saniert 2010-2016', label: 'Saniert 2010-2016' },
    { value: 'Saniert ab 2017 bis heute', label: 'Saniert ab 2017 bis heute' }
  ];
  constructor() { }

  ngOnInit(): void {
    // Future data initialization if needed
  }

   calculateTotalArea(building: Building): number {
    return building.livingSpace + building.commercialSpace;
  }
  
  // Get CSS class for hazard level indicator
  getHazardLevelClass(level: 'gering' | 'mittel' | 'hoch'): string {
    switch (level) {
      case 'gering': return 'hazard-level-low';
      case 'mittel': return 'hazard-level-medium';
      case 'hoch': return 'hazard-level-high';
      default: return 'hazard-level-low';
    }
  }

  // Update hazard class level
  updateHazardLevel(index: number, event: Event): void {
  const target = event.target as HTMLSelectElement;
  const newLevel = target.value as 'gering' | 'mittel' | 'hoch';
  
  if (this.editableBuilding && this.editableBuilding.hazardClasses[index]) {
    this.editableBuilding.hazardClasses[index].level = newLevel;
  }
}

updateSaniertPeriod(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const newPeriod = target.value as SaniertPeriod;
    
    if (this.editableBuilding && this.editableBuilding.roof) {
      this.editableBuilding.roof.saniert = newPeriod;
    }
  }

    // Update saniert period for facade
  updateFacadeSaniertPeriod(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const newPeriod = target.value as SaniertPeriod;
    
    if (this.editableBuilding && this.editableBuilding.facade) {
      this.editableBuilding.facade.saniert = newPeriod;
    }
  }

  // Update saniert period for windows
  updateWindowsSaniertPeriod(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const newPeriod = target.value as SaniertPeriod;
    
    if (this.editableBuilding && this.editableBuilding.windows) {
      this.editableBuilding.windows.saniert = newPeriod;
    }
  }

  // Update saniert period for basement
  updateBasementSaniertPeriod(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const newPeriod = target.value as SaniertPeriod;
    
    if (this.editableBuilding && this.editableBuilding.basement) {
      this.editableBuilding.basement.saniert = newPeriod;
    }
  }
  private initializeEditableBuilding(): void {
  if (!this.editableBuilding) return;
  
  // Initialize valuation if it doesn't exist
  if (!this.editableBuilding.valuation) {
    this.editableBuilding.valuation = {
      baupreisindex2025: 0,
      minInsuranceValue1914: 0,
      maxInsuranceValue1914: 0,
      minInsuranceSum: 0,
      maxInsuranceSum: 0
    };
  }
  
  // Initialize other nested objects if needed
  if (!this.editableBuilding.hazardClasses) {
    this.editableBuilding.hazardClasses = [];
  }
}

  toggleEditMode(): void {
    if (this.isEditMode) {
      this.isEditMode = false;
      this.editableBuilding = null;
      this.newRenovation = { type: '', quantity: '', year: null };
    } else {
      this.isEditMode = true;
      this.editableBuilding = JSON.parse(JSON.stringify(this.building));
      this.initializeEditableBuilding();
    }
  }
  
  saveChanges(): void {
    if (this.editableBuilding) {
      this.building = { ...this.editableBuilding };
      this.isEditMode = false;
      this.editableBuilding = null;
      this.newRenovation = { type: '', quantity: '', year: null };
      this.showSavedMessage();
    }
  }
  
  cancelChanges(): void {
    this.isEditMode = false;
    this.editableBuilding = null;
    this.newRenovation = { type: '', quantity: '', year: null };
  }
  
  showSavedMessage(): void {
    const savedMessage = document.getElementById('saved-message');
    if (savedMessage) {
      savedMessage.classList.add('show');
      setTimeout(() => {
        savedMessage.classList.remove('show');
      }, 3000);
    }
  }
  
  onCheckboxChange(event: Event, object: any, property: string): void {
    const checkbox = event.target as HTMLInputElement;
    object[property] = checkbox.checked;
  }
  
  addRenovation(): void {
    if (this.editableBuilding && this.newRenovation.type.trim() && this.newRenovation.year !== null) {
      if (!this.editableBuilding.renovations) {
        this.editableBuilding.renovations = [];
      }
      
      this.editableBuilding.renovations.push({
        type: this.newRenovation.type,
        quantity: this.newRenovation.quantity,
        year: this.newRenovation.year as number
      });
      
      this.newRenovation = { type: '', quantity: '', year: null };
    }
  }
}
// tabs/building-data-tab/building-data-tab.component.ts
import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Building } from '@models/building.model';

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

  constructor() { }

  ngOnInit(): void {
    // Future data initialization if needed
  }

  toggleEditMode(): void {
    if (this.isEditMode) {
      // If already in edit mode, we're canceling - reset data
      this.isEditMode = false;
      this.editableBuilding = null;
      this.newRenovation = { type: '', quantity: '', year: null };
    } else {
      // Entering edit mode - create a deep copy of the data
      this.isEditMode = true;
      this.editableBuilding = JSON.parse(JSON.stringify(this.building));
    }
  }
  
  saveChanges(): void {
    if (this.editableBuilding) {
      // In a real app, you'd call an API service to save the data
      // apiService.updateBuildingData(this.editableBuilding).subscribe(...)
      
      // For now, directly update the building object
      this.building = { ...this.editableBuilding };
      
      // Exit edit mode
      this.isEditMode = false;
      this.editableBuilding = null;
      this.newRenovation = { type: '', quantity: '', year: null };
      
      // Show success message
      this.showSavedMessage();
    }
  }
  
  // Cancel changes
  cancelChanges(): void {
    // Reset and exit edit mode
    this.isEditMode = false;
    this.editableBuilding = null;
    this.newRenovation = { type: '', quantity: '', year: null };
  }
  
  // Display a temporary saved message
  showSavedMessage(): void {
    const savedMessage = document.getElementById('saved-message');
    if (savedMessage) {
      savedMessage.classList.add('show');
      
      setTimeout(() => {
        savedMessage.classList.remove('show');
      }, 3000);
    }
  }
  
  // Helper method for handling checkbox changes
  onCheckboxChange(event: Event, object: any, property: string): void {
    const checkbox = event.target as HTMLInputElement;
    object[property] = checkbox.checked;
  }
  
  // Add a new renovation
  addRenovation(): void {
    // Only add if there's at least a type and year is not null
    if (this.editableBuilding && this.newRenovation.type.trim() && this.newRenovation.year !== null) {
      // Make sure renovations array exists
      if (!this.editableBuilding.renovations) {
        this.editableBuilding.renovations = [];
      }
      
      // Add the new renovation (type assertion to satisfy TypeScript)
      this.editableBuilding.renovations.push({
        type: this.newRenovation.type,
        quantity: this.newRenovation.quantity,
        year: this.newRenovation.year as number
      });
      
      // Reset the form
      this.newRenovation = { type: '', quantity: '', year: null };
    }
  }
}
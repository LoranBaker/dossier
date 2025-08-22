import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { RenovationMeasure } from '@models/models';

@Component({
  selector: 'app-target-analysis-tab',
  templateUrl: './target-analysis-tab.component.html',
  styleUrls: ['./target-analysis-tab.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class TargetAnalysisTabComponent implements OnInit {
  @Input() renovationMeasures!: RenovationMeasure[];
  @Input() totalSavings: number = 0;

  // Environmental equivalents (with fixed default values)
  equivalentFlights: number = 5;
  equivalentKilometers: number = 118000;
  equivalentTrees: number = 566;

  // Edit mode functionality
  isEditing: boolean = false;
  showSavedMessage: boolean = false;

  // LocalStorage key for persistence
  private readonly STORAGE_KEY = 'target-analysis-measurement-visibility';

  // All available measurements with display names
  allMeasurements = {
    'heizungstechnik': 'Heizungstechnik',
    'kellerdecke': 'Kellerdecke',
    'dach': 'Dach',
    'fassade': 'Fassade',
    'fenster-tueren': 'Fenster & Türen',
    'luftungsanlage': 'Lüftungsanlage',
    'dachgeschossdecke': 'Dachgeschossdecke',
    'dachfenster': 'Dachfenster',
    'photovoltaik': 'Photovoltaik'
  };

  // Measurement visibility control
  measurementVisibility: { [key: string]: boolean } = {
    'heizungstechnik': true,
    'kellerdecke': true,
    'dach': true,
    'fassade': true,
    'fenster-tueren': true,
    'luftungsanlage': true,
    'dachgeschossdecke': true,
    'dachfenster': true,
    'photovoltaik': true
  };

  // Backup for cancel functionality
  private measurementVisibilityBackup: { [key: string]: boolean } = {};

  // Hidden measurements dropdown
  selectedHiddenMeasurement: string = '';
  showAddMeasurementDropdown: boolean = false;

  // SVG icons as safe HTML
  airplaneIcon: SafeHtml;
  camperIcon: SafeHtml;
  treeIcon: SafeHtml;

  constructor(private sanitizer: DomSanitizer) {
    // Apple-style SVG icons (clean, minimal, elegant)
    this.airplaneIcon = this.sanitizer.bypassSecurityTrustHtml(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M41.7,14.3c0.8-0.8,2-0.8,2.8,0c0.8,0.8,0.8,2,0,2.8L27.6,33.9c-0.4,0.4-0.4,1,0,1.4l8.5,8.5c0.4,0.4,0.4,1,0,1.4 l-2.8,2.8c-0.4,0.4-1,0.4-1.4,0L23.4,39c-0.8-0.8-0.8-2,0-2.8L41.7,14.3z"/>
        <path d="M12,43c0,0,6,4,10,4s6-4,6-4"/>
        <circle cx="16" cy="47" r="1.5"/>
        <circle cx="48" cy="16" r="1.5"/>
      </svg>
    `);

    this.camperIcon = this.sanitizer.bypassSecurityTrustHtml(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M8,36h44c1.1,0,2-0.9,2-2V26c0-1.1-0.9-2-2-2h-2c-0.5-3-3.1-5.3-6.2-5.3H28c-3.1,0-5.7,2.3-6.2,5.3h-2 c-2.2,0-4,1.8-4,4V34"/>
        <rect x="38" y="19" width="8" height="5" rx="1" ry="1"/>
        <circle cx="18" cy="40" r="5"/>
        <circle cx="46" cy="40" r="5"/>
        <line x1="8" y1="29" x2="54" y2="29"/>
        <line x1="15" y1="24" x2="15" y2="29"/>
        <line x1="25" y1="24" x2="25" y2="29"/>
        <line x1="35" y1="24" x2="35" y2="29"/>
      </svg>
    `);

    this.treeIcon = this.sanitizer.bypassSecurityTrustHtml(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M32,10c-6,0-10,4-10,10c0,2.5,1,4.7,2.5,6.5C21,28.8,18,33.5,18,39c0,7.7,6.3,14,14,14h0c7.7,0,14-6.3,14-14 c0-5.5-3-10.2-7.5-12.5c1.5-1.8,2.5-4,2.5-6.5C42,14,38,10,32,10z"/>
        <line x1="32" y1="53" x2="32" y2="60"/>
        <line x1="20" y1="60" x2="44" y2="60"/>
      </svg>
    `);
  }

  ngOnInit() {
    // Load saved visibility settings from localStorage
    this.loadVisibilitySettings();
    // You can calculate values here if you want to use actual data
    // this.calculateEquivalents();
  }

  // LocalStorage methods
  private loadVisibilitySettings() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const parsedSettings = JSON.parse(saved);
        // Merge with default settings to handle new measurements
        this.measurementVisibility = { ...this.measurementVisibility, ...parsedSettings };
      }
    } catch (error) {
      console.warn('Failed to load measurement visibility settings:', error);
    }
  }

  private saveVisibilitySettings() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.measurementVisibility));
    } catch (error) {
      console.warn('Failed to save measurement visibility settings:', error);
    }
  }

 // Get hidden measurements for dropdown
getHiddenMeasurements(): { key: string, name: string }[] {
  return Object.keys(this.allMeasurements)
    .filter(key => !this.measurementVisibility[key])
    .map(key => ({
      key,
      name: this.allMeasurements[key as keyof typeof this.allMeasurements]
    }));
}

// Get visible measurements count
getVisibleMeasurementsCount(): number {
  return Object.values(this.measurementVisibility).filter(visible => visible).length;
}

// Get total measurements count
getTotalMeasurementsCount(): number {
  return Object.keys(this.allMeasurements).length;
}

// Check if any measurements are hidden
hasHiddenMeasurements(): boolean {
  return this.getHiddenMeasurements().length > 0;
}

  // Edit mode methods
  toggleEdit() {
    this.isEditing = true;
    this.showAddMeasurementDropdown = false;
    // Create backup for cancel functionality
    this.measurementVisibilityBackup = { ...this.measurementVisibility };
  }

  cancelEdit() {
    this.isEditing = false;
    this.showAddMeasurementDropdown = false;
    this.selectedHiddenMeasurement = '';
    // Restore from backup
    this.measurementVisibility = { ...this.measurementVisibilityBackup };
  }

  saveChanges() {
    this.isEditing = false;
    this.showAddMeasurementDropdown = false;
    this.selectedHiddenMeasurement = '';
    this.showSavedMessage = true;
    
    // Save to localStorage
    this.saveVisibilitySettings();
    
    // Hide saved message after 2 seconds
    setTimeout(() => {
      this.showSavedMessage = false;
    }, 2000);
  }

  // Toggle measurement visibility
  toggleMeasurement(measurementKey: string) {
    if (this.isEditing) {
      this.measurementVisibility[measurementKey] = !this.measurementVisibility[measurementKey];
    }
  }

  // Show/hide add measurement dropdown
  toggleAddMeasurementDropdown() {
    if (!this.isEditing) return;
    this.showAddMeasurementDropdown = !this.showAddMeasurementDropdown;
    if (!this.showAddMeasurementDropdown) {
      this.selectedHiddenMeasurement = '';
    }
  }

  // Add measurement back from dropdown
  addMeasurementBack() {
    if (this.selectedHiddenMeasurement && this.isEditing) {
      this.measurementVisibility[this.selectedHiddenMeasurement] = true;
      this.selectedHiddenMeasurement = '';
      this.showAddMeasurementDropdown = false;
    }
  }

  // Reset all measurements to visible
  showAllMeasurements() {
    if (this.isEditing) {
      Object.keys(this.measurementVisibility).forEach(key => {
        this.measurementVisibility[key] = true;
      });
      this.showAddMeasurementDropdown = false;
      this.selectedHiddenMeasurement = '';
    }
  }

  // Calculate environmental equivalents based on savings
  calculateEquivalents() {
    // Only calculate if we have actual savings data
    if (this.totalSavings > 0) {
      // Calculate CO2 savings in kg
      const co2SavingsInKg = Math.round(this.totalSavings * 0.4);
      
      // Calculate equivalents
      this.equivalentTrees = Math.round(co2SavingsInKg / 22);
      this.equivalentFlights = Math.round(co2SavingsInKg / 1000);
      this.equivalentKilometers = Math.round(co2SavingsInKg / 0.12);
      
      // Ensure minimum values
      if (this.equivalentFlights < 5) this.equivalentFlights = 5;
      if (this.equivalentKilometers < 100000) this.equivalentKilometers = 118000;
      if (this.equivalentTrees < 500) this.equivalentTrees = 566;
    }
  }
}
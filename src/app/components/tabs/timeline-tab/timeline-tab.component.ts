import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RenovationPlan } from '@models/models';
import { RenovationMeasure } from '@models/models';
import { DossierDataService } from '../../../services/dossier-data.service';

@Component({
  selector: 'app-timeline-tab',
  templateUrl: './timeline-tab.component.html',
  styleUrls: ['./timeline-tab.component.scss'],
  standalone: true,
  imports: [CommonModule, CurrencyPipe, FormsModule]
})
export class TimelineTabComponent implements OnInit, OnChanges {
  @Input() renovationPlan!: RenovationPlan[];
  @Input() renovationMeasures!: RenovationMeasure[];
  
  // Edit mode control
  isEditMode = false;
  
  // Selected year for adding a measure
  selectedYear: number | null = null;
  selectedMeasure: string | null = null;
  
  // Available years for planning
  availableYears: number[] = [];
  
  // All unique measure types
  allMeasureTypes: string[] = [];
  
  private excludedMeasures = [
  'Hydraulischer Abgleich',
  'Neue Heizkreispumpe', 
  'Voraussetzung bei Heizungstausch',
  'Förderboni'
];

  constructor(private dossierDataService: DossierDataService) {}

  ngOnInit() {
    // Extract all available years from renovation plan
     this.availableYears = this.renovationPlan.map(plan => plan.year);
  
  // Extract all unique measure types from renovation measures (excluding specific measures)
  const allTypes = [...new Set(this.renovationMeasures.map(measure => measure.type))];
  this.allMeasureTypes = allTypes.filter(type => !this.excludedMeasures.includes(type));
    
    console.log('Timeline component initialized');
    console.log('Available years:', this.availableYears);
    console.log('All measure types:', this.allMeasureTypes);
    console.log('Renovation plan:', this.renovationPlan);

    this.ensurePlanPopulated();
  }
  
  // NEW METHOD: Get only measures that appear in at least one year
  getActiveMeasures(): string[] {
    return this.allMeasureTypes.filter(measure => this.hasMeasureInAnyYear(measure));
  }
  
  // NEW METHOD: Check if a measure appears in any year of the renovation plan
  hasMeasureInAnyYear(measure: string): boolean {
    return this.renovationPlan.some(plan => plan.measures.includes(measure));
  }
  
  // Method to check if a measure is in a specific year's plan
  isMeasureInYear(measure: string, year: number): boolean {
    const yearPlan = this.renovationPlan.find(plan => plan.year === year);
    return yearPlan ? yearPlan.measures.includes(measure) : false;
  }
  
  // Toggle edit mode
  toggleEditMode() {
    this.isEditMode = !this.isEditMode;
    console.log('Edit mode toggled:', this.isEditMode);
    if (!this.isEditMode) {
      this.resetSelection();
    }
  }
  
  // Reset selection
  resetSelection() {
    this.selectedYear = null;
    this.selectedMeasure = null;
  }
  
  // Handle measure selection change
  measureChanged(event: Event) {
    const select = event.target as HTMLSelectElement;
    console.log('Measure changed to:', select.value);
    this.selectedMeasure = select.value;
  }
  
  // Handle year selection change
  yearChanged(event: Event) {
    const select = event.target as HTMLSelectElement;
    console.log('Year changed to:', select.value);
    this.selectedYear = Number(select.value);
  }
  
  // Select a year for adding a measure
  selectYear(year: number) {
    if (this.isEditMode) {
      console.log('Selected year (before):', this.selectedYear);
      console.log('Selecting year:', year, 'of type:', typeof year);
      
      // Ensure year is treated as a number
      this.selectedYear = Number(year);
      
      console.log('Selected year (after):', this.selectedYear);
    }
  }
  
  // Get cost for a specific measure type
  getMeasureCost(measureType: string): number {
    const measure = this.renovationMeasures.find(m => m.type === measureType);
    return measure ? measure.cost : 0;
  }
  
  // Add a measure to the timeline
  addMeasureToTimeline() {
    console.log('Add measure button clicked');
    console.log('Adding measure:', this.selectedMeasure, 'to year:', this.selectedYear);
    
    if (!this.selectedYear || !this.selectedMeasure) {
      console.log('No measure or year selected');
      return;
    }
    
    // Convert to number to ensure proper comparison
    const selectedYearNum = Number(this.selectedYear);
    
    // Find the plan for the selected year
    const yearPlanIndex = this.renovationPlan.findIndex(plan => plan.year === selectedYearNum);
    console.log('Year plan index:', yearPlanIndex);
    
    if (yearPlanIndex !== -1) {
      // Check if measure already exists in any year
      const measureExists = this.renovationPlan.some(plan => 
        plan.measures.includes(this.selectedMeasure!)
      );
      console.log('Measure exists in timeline:', measureExists);
      
      // If measure exists in another year, remove it first
      if (measureExists) {
        this.renovationPlan.forEach(plan => {
          const measureIndex = plan.measures.indexOf(this.selectedMeasure!);
          if (measureIndex !== -1) {
            console.log('Removing measure from year:', plan.year);
            plan.measures.splice(measureIndex, 1);
            
            // Update investment amount (subtract measure cost)
            plan.investment -= this.getMeasureCost(this.selectedMeasure!);
          }
        });
      }
      
      // Add measure to selected year
      console.log('Adding to year plan at index:', yearPlanIndex);
      const updatedMeasures = [...this.renovationPlan[yearPlanIndex].measures, this.selectedMeasure!];
      this.renovationPlan[yearPlanIndex].measures = updatedMeasures;
      
      // Update investment amount (add measure cost)
      const cost = this.getMeasureCost(this.selectedMeasure!);
      console.log('Adding cost to investment:', cost);
      this.renovationPlan[yearPlanIndex].investment += cost;
      
      // Show saved message
      this.showSavedMessage();
      
      // Persist plan to service
      this.dossierDataService.updateRenovationPlan(this.renovationPlan).subscribe();
      
      // Reset selection
      this.resetSelection();
      
      console.log('Updated renovation plan:', this.renovationPlan);
    } else {
      console.log('Year plan not found');
    }
  }
  
  // Remove a measure from the timeline
  removeMeasureFromTimeline(measure: string, year: number) {
    if (!this.isEditMode) {
      return;
    }
    
    console.log('Removing measure:', measure, 'from year:', year);
    
    // Find the plan for the year
    const yearPlanIndex = this.renovationPlan.findIndex(plan => plan.year === year);
    
    if (yearPlanIndex !== -1) {
      // Find the measure in the year plan
      const measureIndex = this.renovationPlan[yearPlanIndex].measures.indexOf(measure);
      
      if (measureIndex !== -1) {
        console.log('Found measure at index:', measureIndex);
        
        // Remove measure from the year plan
        this.renovationPlan[yearPlanIndex].measures.splice(measureIndex, 1);
        
        // Update investment amount (subtract measure cost)
        this.renovationPlan[yearPlanIndex].investment -= this.getMeasureCost(measure);
        
        // Show saved message
        this.showSavedMessage();
        
        // Persist plan to service
        this.dossierDataService.updateRenovationPlan(this.renovationPlan).subscribe();
        
        console.log('Updated renovation plan:', this.renovationPlan);
      }
    }
  }
  
  // Show saved message
  showSavedMessage() {
    const savedMessage = document.getElementById('timeline-saved-message');
    if (savedMessage) {
      savedMessage.style.display = 'block';
      setTimeout(() => {
        savedMessage.style.display = 'none';
      }, 3000);
    }
  }
  
  // Get available measures (not already in timeline)
  getAvailableMeasures(): string[] {
    // Get all measures already in timeline
    const measuresInTimeline = this.renovationPlan.reduce((acc, plan) => {
      return [...acc, ...plan.measures];
    }, [] as string[]);
    
    // Filter out measures already in timeline
    return this.allMeasureTypes.filter(measure => !measuresInTimeline.includes(measure));
  }
  
  // Calculate investment for a specific year based only on measures assigned to that year
  calculateYearInvestment(year: number): number {
    const yearPlan = this.renovationPlan.find(plan => plan.year === year);
    if (!yearPlan) return 0;
    
    // Calculate sum of costs for measures in this year
    return yearPlan.measures.reduce((total, measure) => {
      return total + this.getMeasureCost(measure);
    }, 0);
  }
  
  // Cancel changes
  cancelChanges() {
    this.isEditMode = false;
    this.resetSelection();
  }
  
  // Save changes
  saveChanges() {
    this.isEditMode = false;
    this.resetSelection();
    this.showSavedMessage();
    this.dossierDataService.updateRenovationPlan(this.renovationPlan).subscribe();
  }

  // NEW: ensure initial population of plan with measures if empty
  private ensurePlanPopulated(): void {
    if (!this.renovationPlan || this.renovationPlan.length === 0) return;
    const alreadyAssigned = new Set(this.renovationPlan.flatMap(p => p.measures));
    const assignable = this.renovationMeasures
      .filter(m => !this.excludedMeasures.includes(m.type))
      .map(m => m.type)
      .filter(t => !alreadyAssigned.has(t));
    if (alreadyAssigned.size === 0 && assignable.length > 0) {
      assignable.forEach((type, idx) => {
        const target = this.renovationPlan[idx % this.renovationPlan.length];
        target.measures.push(type);
      });
      // Recalculate investments
      this.renovationPlan.forEach(p => {
        p.investment = p.measures.reduce((sum, t) => sum + this.getMeasureCost(t), 0);
      });
      this.dossierDataService.updateRenovationPlan(this.renovationPlan).subscribe();
    }
  }

  // NEW: implement OnChanges to update derived data when inputs change
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['renovationPlan'] && this.renovationPlan) {
      this.availableYears = this.renovationPlan.map(p => p.year);
    }
    if (changes['renovationMeasures'] && this.renovationMeasures) {
      const allTypes = [...new Set(this.renovationMeasures.map(m => m.type))];
      this.allMeasureTypes = allTypes.filter(t => !this.excludedMeasures.includes(t));
    }
    // After any input change, ensure plan populated
    this.ensurePlanPopulated();
  }
}
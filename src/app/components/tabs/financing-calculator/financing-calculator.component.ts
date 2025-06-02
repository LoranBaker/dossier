import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DecimalPipe, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RenovationMeasure } from '@models/models';
import { FinancingService, FinancingData } from '../../../services/financing-data.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-financing-calculator',
  templateUrl: './financing-calculator.component.html',
  styleUrls: ['./financing-calculator.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CurrencyPipe
  ]
})
export class FinancingCalculatorComponent implements OnInit, OnDestroy {
  // Add these two input properties
  @Input() 
  set initialTotalCosts(value: number) {
    console.log('Received initialTotalCosts:', value);
    if (value > 0) {
      this._initialTotalCosts = value;
      // Update when both values are set
      this.updateInitialValues();
    }
  }
  
  @Input() 
  set initialTotalFunding(value: number) {
    console.log('Received initialTotalFunding:', value);
    if (value > 0) {
      this._initialTotalFunding = value;
      // Update when both values are set
      this.updateInitialValues();
    }
  }
  
  @Input()
  set initialTotalSavings(value: number) {
    console.log('Received initialTotalSavings:', value);
    if (value > 0) {
      this._initialTotalSavings = value;
      // Update when all values are set
      this.updateInitialValues();
    }
  }
  
  // Keep private backing fields
  private _initialTotalCosts = 0;
  private _initialTotalFunding = 0;
  private _initialTotalSavings = 0;
  private initialValuesUpdated = false;

  // Your existing properties
  totalCosts = 0;
  totalFunding = 0;
  effectiveCosts = 0;
  ownCapital = 0;
  ownCapitalPercentage = 0;
  financingNeeds = 0;
  monthlySavings = 0;
  annualSavings = 0;
  co2TaxSavings = 0;
  co2TaxSavingsAnnual = 0;
  modernisierungsumlage = 0;  
  pvStromVerkauf = 0; // New property for PV-Strom Verkauf
  additionalSavingsTotal = 0;
  totalSavingsMonthly = 0;
  
  // Loan options
  monthlyRate10Years = 0;
  loanTerm10 = 10;
  monthlyRate15Years = 0;
  loanTerm15 = 15;
  monthlyRate20Years = 0;
  loanTerm20 = 20;
  
  // Renovation measures
  renovationMeasures: RenovationMeasure[] = [];
  
  // Edit mode
  isEditing = false;
  showSavedMessage = false;
  
  // Edit data structure - expanded to include new editable fields
  editData = {
    monthlyRate10Years: 0,
    monthlyRate15Years: 0,
    monthlyRate20Years: 0,
    co2TaxSavings: 0,
    pvStromVerkauf: 0
  };
  
  // Subscription to manage the cleanup
  private subscription = new Subscription();
  
  constructor(private financingService: FinancingService) {}
  
  ngOnInit() {
    // Subscribe to financing data from service
    this.subscription.add(
      this.financingService.financingData$.subscribe(data => {
        console.log('Financing data received:', data);
        
        // Update component data
        this.updateComponentData(data);
        
        // When data changes, update edit data too (if not actively editing)
        if (!this.isEditing) {
          this.initEditData();
        }
      })
    );
    
    // Initialize edit data
    this.initEditData();
    
    // Try updating values after a short delay to ensure component is fully initialized
    setTimeout(() => this.updateInitialValues(), 0);
  }
  
  // Method to update finance service with initial values when values are available
  private updateInitialValues() {
    // Check if we have costs and funding values and haven't already updated
    if (this._initialTotalCosts > 0 && this._initialTotalFunding > 0 && !this.initialValuesUpdated) {
      console.log('Updating financing data with initial values:', {
        totalCosts: this._initialTotalCosts,
        totalFunding: this._initialTotalFunding,
        annualSavings: this._initialTotalSavings
      });
      
      // If we also have initial savings, update that first
      if (this._initialTotalSavings > 0) {
        console.log('Using initialTotalSavings as annual savings:', this._initialTotalSavings);
        // Update the annual savings first with proper conversion to monthly
        this.financingService.updateAnnualSavings(this._initialTotalSavings);
      } else {
        console.log('No initialTotalSavings available, using default values');
      }
      
      // Then update costs and funding
      this.financingService.updateFinancingData({
        totalCosts: this._initialTotalCosts,
        totalFunding: this._initialTotalFunding
      });
      
      this.initialValuesUpdated = true;
    }
  }
  
  ngOnDestroy() {
    // Clean up subscriptions when component is destroyed
    this.subscription.unsubscribe();
  }
  
  // Update component data with values from service
  private updateComponentData(data: FinancingData) {
    this.totalCosts = data.totalCosts;
    this.totalFunding = data.totalFunding;
    this.effectiveCosts = data.effectiveCosts;
    this.ownCapital = data.ownCapital;
    this.ownCapitalPercentage = data.ownCapitalPercentage;
    this.financingNeeds = data.financingNeeds;
    this.monthlySavings = data.monthlySavings;
    this.annualSavings = data.annualSavings;
    this.co2TaxSavings = data.co2TaxSavings;
    this.co2TaxSavingsAnnual = data.co2TaxSavingsAnnual;
    this.modernisierungsumlage = data.modernisierungsumlage;
    this.pvStromVerkauf = data.pvStromVerkauf; // Added new property
    this.additionalSavingsTotal = data.additionalSavingsTotal;
    this.totalSavingsMonthly = data.totalSavingsMonthly;
    this.monthlyRate10Years = data.monthlyRate10Years;
    this.monthlyRate15Years = data.monthlyRate15Years;
    this.monthlyRate20Years = data.monthlyRate20Years;
    this.loanTerm10 = data.loanTerm10;
    this.loanTerm15 = data.loanTerm15;
    this.loanTerm20 = data.loanTerm20;
  }
  
  // Initialize edit data with current values - expanded to include new editable fields
  initEditData() {
    this.editData = {
      monthlyRate10Years: this.monthlyRate10Years,
      monthlyRate15Years: this.monthlyRate15Years,
      monthlyRate20Years: this.monthlyRate20Years,
      co2TaxSavings: this.co2TaxSavings,
      pvStromVerkauf: this.pvStromVerkauf
    };
  }
  
  // Toggle edit mode
  toggleEdit() {
    this.isEditing = true;
    this.initEditData();
  }
  
  // Cancel edit mode
  cancelEdit() {
    this.isEditing = false;
    this.initEditData();
  }
  
  // Save changes and update service data - expanded to include new editable fields
  saveChanges() {
    // Create partial data object with edited values
    const updatedData: Partial<FinancingData> = {
      monthlyRate10Years: this.editData.monthlyRate10Years,
      monthlyRate15Years: this.editData.monthlyRate15Years,
      monthlyRate20Years: this.editData.monthlyRate20Years,
      co2TaxSavings: this.editData.co2TaxSavings,
      pvStromVerkauf: this.editData.pvStromVerkauf
    };
    
    // Update service data
    this.financingService.updateFinancingData(updatedData);
    
    // Show saved message
    this.isEditing = false;
    this.showSavedMessage = true;
    
    // Hide message after 3 seconds
    setTimeout(() => {
      this.showSavedMessage = false;
    }, 3000);
  }
}
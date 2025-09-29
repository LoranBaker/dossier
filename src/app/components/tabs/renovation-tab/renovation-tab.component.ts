import { Component, Input, OnInit, OnChanges, Output, EventEmitter, OnDestroy, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RenovationMeasure } from '@models/models';
import { SavingsPotential } from '@models/models';
import { RenovationService } from '../../../services/renovation.service';
import { FinancingService } from '../../../services/financing-data.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-renovation-tab',
  templateUrl: './renovation-tab.component.html',
  styleUrls: ['./renovation-tab.component.scss'],
  standalone: true,
  imports: [CommonModule, CurrencyPipe, FormsModule]
})
export class RenovationTabComponent implements OnInit, OnChanges, OnDestroy {
  @Input() renovationMeasures!: RenovationMeasure[];
  @Input() savingsPotential!: SavingsPotential;
  @Input() amortizationYears: number = 0;
  @Input() foerderboniMeasures: any[] = [];
  
  // Output the calculated totals to parent component if needed
  @Output() totalsChanged = new EventEmitter<{
    totalCosts: number;
    totalFunding: number;
    totalSavings: number;
  }>();
  
  isEditMode = false;
  editableMeasures: RenovationMeasure[] = [];
  
  // Keep this property in the component for template access
  fixedFundingMeasures = ['Solarthermie', 'Heizung'];
  
  private destroy$ = new Subject<void>();
  
  constructor(
    private renovationService: RenovationService,
    private financingService: FinancingService
  ) {}
  
  // Computed properties to replace inputs
  get totalCosts(): number {
    return this.calculateTotalCosts();
  }
  
  get totalFunding(): number {
    return this.calculateTotalFunding();
  }
  
  get totalSavings(): number {
    return this.calculateTotalSavings();
  }
  
  ngOnInit() {
    console.log('RenovationTabComponent initialized');
    
    if (this.renovationMeasures && this.renovationMeasures.length > 0) {
      console.log('Initial renovation measures:', this.renovationMeasures);
      
      // Calculate funding for all measures on initialization
      this.initializeFundingValues();
      this.copyMeasuresToEditable();
      
      // Emit initial totals
      this.emitTotals();
      
      // Force an initial update to financing service with explicit values
      const forcedTotalCosts = this.calculateTotalCosts();
      const forcedTotalFunding = this.calculateTotalFunding();
      const forcedTotalSavings = this.calculateTotalSavings();
      
      console.log('Forced initial values:', { 
        totalCosts: forcedTotalCosts, 
        totalFunding: forcedTotalFunding,
        totalSavings: forcedTotalSavings
      });
      
      // Pass annual savings to financing service
      this.financingService.updateAnnualSavings(forcedTotalSavings);
      
      // Instead of using getter properties, pass explicit calculated values
      this.financingService.updateFinancingData({
        totalCosts: forcedTotalCosts,
        totalFunding: forcedTotalFunding
      });
    } else {
      console.warn('No renovation measures available on initialization');
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    console.log('RenovationTabComponent received changes:', changes);
    
    // If renovation measures change, update financing data
    if (changes['renovationMeasures'] && !changes['renovationMeasures'].firstChange) {
      console.log('Renovation measures updated, updating financing data');
      this.updateFinancingTotals();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  initializeFundingValues() {
    // Update funding values for all measures based on current costs
    this.renovationMeasures = this.renovationService.initializeFundingValues([...this.renovationMeasures]);
  }
  
  copyMeasuresToEditable() {
    this.editableMeasures = JSON.parse(JSON.stringify(this.renovationMeasures));
  }
  
  toggleEditMode() {
    this.isEditMode = !this.isEditMode;
    if (this.isEditMode) {
      this.copyMeasuresToEditable();
    }
  }
  
  cancelChanges() {
    this.isEditMode = false;
    this.copyMeasuresToEditable();
  }
  
  saveChanges() {
    // Copy the edited values back to the original array
    this.renovationMeasures = JSON.parse(JSON.stringify(this.editableMeasures));
    
    // Show saved message
    const savedMessage = document.getElementById('saved-message');
    if (savedMessage) {
      savedMessage.style.display = 'block';
      setTimeout(() => {
        savedMessage.style.display = 'none';
      }, 3000);
    }
    
    this.isEditMode = false;
    
    // Update the service with new measures
    this.renovationService.updateRenovationMeasures(this.renovationMeasures)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Emit updated totals
        this.emitTotals();
        
        // Directly calculate and update with explicit values
        const updatedTotalCosts = this.calculateTotalCosts();
        const updatedTotalFunding = this.calculateTotalFunding();
        const updatedTotalSavings = this.calculateTotalSavings();
        
        console.log('Directly updating financing data after save:', {
          totalCosts: updatedTotalCosts,
          totalFunding: updatedTotalFunding,
          totalSavings: updatedTotalSavings
        });
        
        // Update annual savings in financing service
        this.financingService.updateAnnualSavings(updatedTotalSavings);
        
        // Update with explicit values instead of using getters
        this.financingService.updateFinancingData({
          totalCosts: updatedTotalCosts,
          totalFunding: updatedTotalFunding
        });
      });
  }
  
  calculateTotalCosts(): number {
    if (!this.renovationMeasures || this.renovationMeasures.length === 0) {
      console.warn('No renovation measures available for totalCosts calculation');
      return 0;
    }
    
    const total = this.isEditMode
      ? this.renovationService.calculateTotalCosts(this.editableMeasures)
      : this.renovationService.calculateTotalCosts(this.renovationMeasures);
    
    console.log(`Calculated totalCosts: ${total}`);
    return total;
  }
  
  calculateTotalFunding(): number {
    if (!this.renovationMeasures || this.renovationMeasures.length === 0) {
      console.warn('No renovation measures available for totalFunding calculation');
      return 0;
    }
    
    const total = this.renovationService.calculateTotalFunding(this.renovationMeasures);
    console.log(`Calculated totalFunding: ${total}`);
    return total;
  }
  
  calculateTotalSavings(): number {
    if (!this.renovationMeasures || this.renovationMeasures.length === 0) {
      return 0;
    }
    const total = this.renovationService.calculateTotalSavings(this.renovationMeasures);
    console.log(`Calculated totalSavings: ${total}`);
    return total;
  }
  
  // Handle cost change and update funding accordingly
  onCostChange(index: number) {
    // Update funding based on the new cost
    this.editableMeasures[index].funding = this.renovationService.calculateFunding(this.editableMeasures[index]);
  }
  
  // Emit the calculated totals to parent component
  private emitTotals() {
    const totals = {
      totalCosts: this.totalCosts,
      totalFunding: this.totalFunding,
      totalSavings: this.totalSavings
    };
    
    console.log('Emitting totals:', totals);
    this.totalsChanged.emit(totals);
    this.renovationService.updateTotals(this.renovationMeasures);
  }

  // Update financing data with current totals - using direct calculation
  private updateFinancingTotals() {
    // Directly calculate values instead of using getters
    const currentTotalCosts = this.calculateTotalCosts();
    const currentTotalFunding = this.calculateTotalFunding();
    const currentTotalSavings = this.calculateTotalSavings();
    
    console.log('Updating financing data with:', {
      totalCosts: currentTotalCosts,
      totalFunding: currentTotalFunding,
      totalSavings: currentTotalSavings
    });
    
    // Update annual savings in financing service
    this.financingService.updateAnnualSavings(currentTotalSavings);
    
    // Update financing service with explicit values
    this.financingService.updateFinancingData({
      totalCosts: currentTotalCosts,
      totalFunding: currentTotalFunding
    });
  }

  onSavingsPercentagesChanged(percentages: {
  energyCostSavings: number;
  energyBalanceSavings: number;
  co2TaxSavings: number;
}): void {
  console.log('Received savings percentages from renovation results:', percentages);
  
  // Update the savingsPotential object with the new percentages
  if (this.savingsPotential) {
    this.savingsPotential.energyCostSavings = percentages.energyCostSavings;
    this.savingsPotential.energyBalanceSavings = percentages.energyBalanceSavings;
    this.savingsPotential.co2TaxSavings = percentages.co2TaxSavings;
    
    console.log('Updated savingsPotential:', this.savingsPotential);
  }
}

/**
 * Check if a string is a URL
 */
isUrl(text: string): boolean {
  if (!text) return false;
  return text.startsWith('www.') || text.startsWith('http://') || text.startsWith('https://');
}

/**
 * Get the full URL with https:// prefix if needed
 */
getFullUrl(url: string): string {
  if (!url) return '';
  
  // If it already has a protocol, return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // If it starts with www., add https://
  if (url.startsWith('www.')) {
    return `https://${url}`;
  }
  
  // For other cases, assume it needs https://www.
  return `https://www.${url}`;
}

// Add this getter method in the RenovationTabComponent class
get numberOfMeasures(): number {
  if (!this.renovationMeasures || this.renovationMeasures.length === 0) {
    return 0;
  }
  
  // Count measures excluding 'Förderboni' type if you don't want to count it
  return this.renovationMeasures.filter(measure => measure.type !== 'Förderboni').length;
}

}
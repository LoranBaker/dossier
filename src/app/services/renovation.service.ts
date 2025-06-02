// services/renovation.service.ts
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { RenovationMeasure } from '@models/models';
import { SavingsPotential } from '@models/models';
import { DossierDataService } from './dossier-data.service';

@Injectable({
  providedIn: 'root'
})
export class RenovationService {
  // Measures with fixed funding values that shouldn't be auto-calculated
  private fixedFundingMeasures = ['Solarthermie', 'Heizung'];
  
  constructor(private dossierDataService: DossierDataService) {}

  /**
   * Get renovation measures from the dossier service
   */
  getRenovationMeasures(): Observable<RenovationMeasure[]> {
    return this.dossierDataService.renovationMeasures$;
  }
  
  /**
   * Get savings potential from the dossier service
   */
  getSavingsPotential(): Observable<SavingsPotential> {
    return this.dossierDataService.savingsPotential$;
  }
  
  /**
   * Get the current renovation measures synchronously
   */
  getCurrentRenovationMeasures(): RenovationMeasure[] {
    return this.dossierDataService.getCurrentRenovationMeasures();
  }

  /**
   * Get the current savings potential synchronously
   */
  getCurrentSavingsPotential(): SavingsPotential {
    return this.dossierDataService.getCurrentSavingsPotential();
  }

  /**
   * Update the renovation measures
   */
  updateRenovationMeasures(measures: RenovationMeasure[]): Observable<RenovationMeasure[]> {
    return this.dossierDataService.updateRenovationMeasures(measures);
  }

  /**
   * Initialize funding values for all measures
   */
  initializeFundingValues(measures: RenovationMeasure[]): RenovationMeasure[] {
    const updatedMeasures = [...measures];
    
    updatedMeasures.forEach(measure => {
      if (!this.fixedFundingMeasures.includes(measure.type) && 
          measure.type !== 'Photovoltaik') {
        measure.funding = this.calculateFunding(measure);
      }
    });
    
    return updatedMeasures;
  }

  /**
   * Calculate funding for a measure
   */
  calculateFunding(measure: RenovationMeasure): number | string {
    // Return the original value for measures with fixed funding
    if (this.fixedFundingMeasures.includes(measure.type)) {
      return measure.funding;
    }

    // Photovoltaik has a special funding text
    if (measure.type === 'Photovoltaik') {
      return 'siehe S.13 mögl.Bonus';
    }
    
    // For other measures, calculate 20% of the cost
    return Math.round(measure.cost * 0.20);
  }

  /**
   * Get the list of fixed funding measures
   */
  getFixedFundingMeasures(): string[] {
    return this.fixedFundingMeasures;
  }

  /**
   * Calculate total costs from measures
   */
  calculateTotalCosts(measures: RenovationMeasure[]): number {
    return measures.reduce((total, measure) => total + measure.cost, 0);
  }
  
  /**
   * Calculate total funding from measures
   */
  calculateTotalFunding(measures: RenovationMeasure[]): number {
    return measures.reduce((total, measure) => {
      // Convert funding to number if it's a string
      const fundingValue = typeof measure.funding === 'string' 
        ? 0 // Handle special cases like "siehe S.13 mögl.Bonus"
        : measure.funding;
      return total + fundingValue;
    }, 0);
  }
  
  /**
   * Calculate total savings from measures
   */
  calculateTotalSavings(measures: RenovationMeasure[]): number {
    return measures.reduce((total, measure) => total + measure.savings, 0);
  }
  
  /**
   * Calculate and update totals to the dossier service
   */
  updateTotals(measures: RenovationMeasure[]): void {
    const totals = {
      totalCosts: this.calculateTotalCosts(measures),
      totalFunding: this.calculateTotalFunding(measures),
      totalSavings: this.calculateTotalSavings(measures)
    };
    
    this.dossierDataService.updateRenovationTotals(totals);
  }
  
  /**
   * Get the total costs, funding, and savings
   */
  getTotals(): Observable<{totalCosts: number, totalFunding: number, totalSavings: number}> {
    return this.dossierDataService.renovationMeasures$.pipe(
      map(measures => ({
        totalCosts: this.calculateTotalCosts(measures),
        totalFunding: this.calculateTotalFunding(measures),
        totalSavings: this.calculateTotalSavings(measures)
      }))
    );
  }
  
  /**
   * Get the current totals synchronously
   */
  getCurrentTotals(): {totalCosts: number, totalFunding: number, totalSavings: number} {
    const measures = this.getCurrentRenovationMeasures();
    return {
      totalCosts: this.calculateTotalCosts(measures),
      totalFunding: this.calculateTotalFunding(measures),
      totalSavings: this.calculateTotalSavings(measures)
    };
  }
}
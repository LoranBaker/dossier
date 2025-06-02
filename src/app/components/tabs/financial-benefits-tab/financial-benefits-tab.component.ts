import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RenovationMeasure } from '@models/models';
import { FinancialBenefitsService } from '../../../services/financial-benefit-data.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-financial-benefits-tab',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './financial-benefits-tab.component.html',
  styleUrls: ['./financial-benefits-tab.component.scss']
})
export class FinancialBenefitsTabComponent implements OnInit, OnDestroy {
  @Input() renovationMeasures: RenovationMeasure[] = [];
  @Input() totalCosts: number = 0;
  @Input() totalFunding: number = 0;
  
  // Cost after funding
  costAfterFunding: number = 0;
  
  // Energy cost savings
  energyCost: number = 0;
  energyCost15Years: number = 0;
  energyCostAfter15Years: number = 0;
  energySavings15Years0Percent: number = 0;
  
  // PV electricity generation
  pvGenerationBefore: number = 0;
  pvGenerationAfter: number = 0;
  pvGenerationValue15Years: number = 0;
  
  // CO2 tax savings
  co2TaxSavingsBefore: number = 0;
  co2TaxSavingsAfter: number = 0;
  co2TaxSavings15Years0Percent: number = 0;
  
  // Total savings
  totalSavings15Years: number = 0;
  effectiveCostAfter15Years: number = 0;
  
  // Property value increase
  propertyValueIncrease: number = 0;
  propertyValueIncreasePercent: number = 0;
  
  // Rent increase
  rentIncreaseMonthly: number = 0;
  rentIncreasePercent: number = 0;
  
  private subscription: Subscription = new Subscription();
  
  constructor(private financialBenefitsService: FinancialBenefitsService) {}
  
  ngOnInit(): void {
    // Store the input values in the service
    this.financialBenefitsService.setRenovationMeasures(this.renovationMeasures);
    this.financialBenefitsService.setTotalCosts(this.totalCosts);
    this.financialBenefitsService.setTotalFunding(this.totalFunding);
    
    // Subscribe to the data observable to get updates
    this.subscription.add(
      this.financialBenefitsService.data$.subscribe(data => {
        // Set all the component properties from the service data
        this.costAfterFunding = data.costAfterFunding;
        
        // Energy cost savings
        this.energyCost = data.energyCost;
        this.energyCost15Years = data.energyCost15Years;
        this.energyCostAfter15Years = data.energyCostAfter15Years;
        this.energySavings15Years0Percent = data.energySavings15Years0Percent;
        
        // PV electricity generation
        this.pvGenerationBefore = data.pvGenerationBefore;
        this.pvGenerationAfter = data.pvGenerationAfter;
        this.pvGenerationValue15Years = data.pvGenerationValue15Years;
        
        // CO2 tax savings
        this.co2TaxSavingsBefore = data.co2TaxSavingsBefore;
        this.co2TaxSavingsAfter = data.co2TaxSavingsAfter;
        this.co2TaxSavings15Years0Percent = data.co2TaxSavings15Years0Percent;
        
        // Total savings
        this.totalSavings15Years = data.totalSavings15Years;
        this.effectiveCostAfter15Years = data.effectiveCostAfter15Years;
        
        // Property value increase
        this.propertyValueIncrease = data.propertyValueIncrease;
        this.propertyValueIncreasePercent = data.propertyValueIncreasePercent;
        
        // Rent increase
        this.rentIncreaseMonthly = data.rentIncreaseMonthly;
        this.rentIncreasePercent = data.rentIncreasePercent;
      })
    );
  }
  
  ngOnDestroy(): void {
    // Clean up subscriptions when the component is destroyed
    this.subscription.unsubscribe();
  }
}
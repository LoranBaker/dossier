import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConsumptionData } from '@models/models'; // Import the ConsumptionData interface

@Component({
  selector: 'app-financial-potential-tab',
  templateUrl: './financial-potential-tab.component.html',
  imports: [CommonModule, FormsModule],
  styleUrls: ['./financial-potential-tab.component.scss']
})
export class FinancialPotentialTabComponent implements OnInit, OnChanges {
  @Input() renovationMeasures: any[] = [];
  @Input() totalCosts: number = 0;
  @Input() totalFunding: number = 0;
  @Input() totalSavingsFromRenovation: number = 0;
  @Input() consumptionData: ConsumptionData | null = null; // Add new input for consumption data
  
  // Flag to force use of input values
  forceUseInputValues = true;
  
  // Direct display properties
  displayCosts: number = 0;
  displayFunding: number = 0;
  displayEffectiveCosts: number = 0;
  
  isEditMode = false;
  hasCustomValues = false;
  
  // Original financial data
  financialData: any = {
    totalCosts: 0,
    totalFunding: 0,
    effectiveCosts: 0,
    energyCostSavings: 3200,
    modernizationLevy: 0,
    co2TaxSavings: 450,
    pvSalesIncome: 800,
    totalSavingsPerYear: 4450,
    returnOnEquity: 5.24,
    returnOnEquityBeforeTax: 0,
    amortizationYears: 19.1,
    fundingRate: 29.2,
    strandingPointOld: '2035',
    strandingPointNew: '2050+',
    rentalIncrease: {
      perSqmBefore: 0, // Will be dynamically set from consumptionData.rentPrice
      perSqmAfter: 15.20,
      perSqmIncrease: 2.70,
      totalBefore: 18755,
      totalAfter: 2280,
      totalIncrease: 405,
      returnBefore: null, // Will be calculated based on perSqmBefore and valueBefore
      returnAfter: null, // Will be calculated based on perSqmAfter and valueAfter
      returnIncrease: null, // Will be calculated as the difference between returnAfter and returnBefore
      valueBefore: 4500,
      valueAfter: 5300,
      valueIncrease: 800,
      totalValueBefore: 675000,
      totalValueAfter: 795000,
      totalValueIncrease: 130000
    }
  };
  
  // Editable copy of financial data
  editableFinancialData: any;
  
  // Constants
  readonly LIVING_SPACE = 150;  // m²

  constructor() { }

  ngOnInit(): void {
    // Initialize display values
    this.updateDisplayValues();
    
    // Update perSqmBefore from consumptionData.rentPrice if available
    this.updatePerSqmBeforeFromConsumptionData();
    
    // Deep clone the financial data to create an editable copy
    this.editableFinancialData = JSON.parse(JSON.stringify(this.financialData));
    
    // Set initial editable values
    this.editableFinancialData.totalCosts = this.displayCosts;
    this.editableFinancialData.totalFunding = this.displayFunding;
    this.editableFinancialData.effectiveCosts = this.displayEffectiveCosts;
    
    // Update energyCostSavings from renovation tab if available
    if (this.totalSavingsFromRenovation > 0) {
      this.financialData.energyCostSavings = this.totalSavingsFromRenovation;
      this.editableFinancialData.energyCostSavings = this.totalSavingsFromRenovation;
    }
    
    // Calculate modernizationLevy (8% of effective costs)
    this.calculateModernizationLevy();
    
    // Calculate rental yield (Mietrendite) based on rent and property value
    // This must happen after updating perSqmBefore
    this.calculateRentalYieldForFinancialData();
    this.calculateRentalYield();
    
    // Calculate other derived values
    this.calculateFundingRate();
    this.calculateTotalSavings();
    this.calculateAmortization();
    this.calculateReturnOnEquity();
    this.calculateReturnOnEquityBeforeTax();
    
    // Debug log
    console.log('Financial Tab ngOnInit:');
    console.log('Input totalCosts:', this.totalCosts);
    console.log('Input totalFunding:', this.totalFunding);
    console.log('Input totalSavingsFromRenovation:', this.totalSavingsFromRenovation);
    console.log('Display values:', {
      displayCosts: this.displayCosts,
      displayFunding: this.displayFunding,
      displayEffectiveCosts: this.displayEffectiveCosts
    });
  }
  
  // Respond to changes in the input properties
  ngOnChanges(changes: SimpleChanges): void {
    console.log('Financial Tab ngOnChanges:');
    console.log('Input totalCosts:', this.totalCosts);
    console.log('Input totalFunding:', this.totalFunding);
    console.log('Input totalSavingsFromRenovation:', this.totalSavingsFromRenovation);
    
    // Update perSqmBefore from consumptionData if it has changed
    if (changes['consumptionData'] && this.consumptionData) {
      this.updatePerSqmBeforeFromConsumptionData();
      
      // Recalculate rental yield after updating perSqmBefore
      this.calculateRentalYieldForFinancialData();
    }
    
    // Always update from input values unless user has explicitly saved custom values
    if (!this.hasCustomValues) {
      this.updateDisplayValues();
      
      // Update the financial data to reflect the new values
      this.financialData.totalCosts = this.displayCosts;
      this.financialData.totalFunding = this.displayFunding;
      this.financialData.effectiveCosts = this.displayEffectiveCosts;
      
      // Calculate modernizationLevy (8% of effective costs)
      this.calculateModernizationLevyForFinancialData();
      
      // Update energyCostSavings from renovation tab if available and changed
      if (changes['totalSavingsFromRenovation'] && this.totalSavingsFromRenovation > 0) {
        this.financialData.energyCostSavings = this.totalSavingsFromRenovation;
        if (this.isEditMode) {
          this.editableFinancialData.energyCostSavings = this.totalSavingsFromRenovation;
        }
        // Recalculate total savings
        this.calculateTotalSavingsForFinancialData();
      }
      
      // Recalculate funding rate
      this.calculateFundingRateForFinancialData();
      
      // Recalculate amortization
      this.calculateAmortizationForFinancialData();
      
      // Recalculate return on equity
      this.calculateReturnOnEquityForFinancialData();
      
      // Calculate return on equity before tax
      this.calculateReturnOnEquityBeforeTaxForFinancialData();
      
      // Update editable data if in edit mode
      if (this.isEditMode) {
        this.editableFinancialData.totalCosts = this.displayCosts;
        this.editableFinancialData.totalFunding = this.displayFunding;
        this.editableFinancialData.effectiveCosts = this.displayEffectiveCosts;
        this.editableFinancialData.modernizationLevy = this.financialData.modernizationLevy;
        this.editableFinancialData.fundingRate = this.financialData.fundingRate;
        this.editableFinancialData.amortizationYears = this.financialData.amortizationYears;
        this.editableFinancialData.returnOnEquity = this.financialData.returnOnEquity;
        this.editableFinancialData.returnOnEquityBeforeTax = this.financialData.returnOnEquityBeforeTax;
        this.editableFinancialData.totalSavingsPerYear = this.financialData.totalSavingsPerYear;
      }
    }
  }
  
  updateDisplayValues(): void {
    // If we have custom saved values, use them
    if (this.hasCustomValues) {
      this.displayCosts = this.financialData.totalCosts;
      this.displayFunding = this.financialData.totalFunding;
      this.displayEffectiveCosts = this.financialData.effectiveCosts;
      return;
    }
    
    // Check for valid input values and use them
    if (this.forceUseInputValues || (this.totalCosts > 0 || this.totalFunding > 0)) {
      this.displayCosts = this.totalCosts || 0;
      this.displayFunding = this.totalFunding || 0;
      this.displayEffectiveCosts = this.displayCosts - this.displayFunding;
    } else {
      // Fallback to default values if no input values provided
      this.displayCosts = this.financialData.totalCosts;
      this.displayFunding = this.financialData.totalFunding;
      this.displayEffectiveCosts = this.financialData.effectiveCosts;
    }
    
    console.log('Updated display values:', {
      displayCosts: this.displayCosts,
      displayFunding: this.displayFunding,
      displayEffectiveCosts: this.displayEffectiveCosts
    });
  }

  toggleEditMode(): void {
    this.isEditMode = !this.isEditMode;
    
    // If entering edit mode, reset the editable copy
    if (this.isEditMode) {
      this.editableFinancialData = JSON.parse(JSON.stringify(this.financialData));
      
      // Make sure to use the current display values
      this.editableFinancialData.totalCosts = this.displayCosts;
      this.editableFinancialData.totalFunding = this.displayFunding;
      this.editableFinancialData.effectiveCosts = this.displayEffectiveCosts;
      
      // Always recalculate modernizationLevy to ensure it's correctly set
      this.calculateModernizationLevy();
      
      // Recalculate rental yield
      this.calculateRentalYield();
    }
  }

  saveChanges(): void {
    // Ensure all calculations are up to date before saving
    this.calculateModernizationLevy();
    this.calculateTotalSavings();
    this.calculateRentalYield();
    
    // Update the original data with the edited version
    this.financialData = JSON.parse(JSON.stringify(this.editableFinancialData));
    
    // Mark that user has saved custom values
    this.hasCustomValues = true;
    
    // Update display values from the saved financial data
    this.displayCosts = this.financialData.totalCosts;
    this.displayFunding = this.financialData.totalFunding;
    this.displayEffectiveCosts = this.financialData.effectiveCosts;
    
    // Exit edit mode
    this.isEditMode = false;
    
    // Show saved message
    const savedMessage = document.getElementById('saved-message');
    if (savedMessage) {
      savedMessage.classList.add('show');
      
      // Hide after 3 seconds
      setTimeout(() => {
        savedMessage.classList.remove('show');
      }, 3000);
    }
  }

  cancelChanges(): void {
    // Discard changes and exit edit mode
    this.editableFinancialData = JSON.parse(JSON.stringify(this.financialData));
    this.isEditMode = false;
  }

  // Helper methods to calculate values automatically
  calculateEffectiveCosts(): void {
    this.editableFinancialData.effectiveCosts = 
      this.editableFinancialData.totalCosts - this.editableFinancialData.totalFunding;
  }

  // Calculate modernization levy (8% of effective costs)
  calculateModernizationLevy(): void {
    this.editableFinancialData.modernizationLevy = 
      Math.round(this.editableFinancialData.effectiveCosts * 0.08);
    
    // Recalculate total savings after updating modernization levy
    this.calculateTotalSavings();
  }

  calculateTotalSavings(): void {
    this.editableFinancialData.totalSavingsPerYear = 
      this.editableFinancialData.energyCostSavings + 
      (this.editableFinancialData.modernizationLevy || 0) +
      this.editableFinancialData.co2TaxSavings + 
      (this.editableFinancialData.pvSalesIncome || 0);
  }

  calculateFundingRate(): void {
    if (this.editableFinancialData.totalCosts > 0) {
      this.editableFinancialData.fundingRate = 
        (this.editableFinancialData.totalFunding / this.editableFinancialData.totalCosts * 100).toFixed(1);
    } else {
      this.editableFinancialData.fundingRate = '0.0';
    }
  }

  calculateAmortization(): void {
    if (this.editableFinancialData.totalSavingsPerYear > 0) {
      // Amortisationszeit = Effektive Kosten Eigenanteil / Einnahmen & Einsparungen p.a. gesamt
      this.editableFinancialData.amortizationYears = 
        (this.editableFinancialData.effectiveCosts / this.editableFinancialData.totalSavingsPerYear).toFixed(1);
    } else {
      this.editableFinancialData.amortizationYears = '0.0';
    }
  }

  calculateReturnOnEquity(): void {
    if (this.editableFinancialData.effectiveCosts > 0) {
      this.editableFinancialData.returnOnEquity = 
        (this.editableFinancialData.totalSavingsPerYear / this.editableFinancialData.effectiveCosts * 100).toFixed(2);
    } else {
      this.editableFinancialData.returnOnEquity = '0.00';
    }
  }
  
  // Calculate Return on Equity Before Tax
  calculateReturnOnEquityBeforeTax(): void {
    if (this.editableFinancialData.effectiveCosts > 0) {
      // Eigenkapitalrendite (vor Steuer) = Werterhöhung in € gesamt / Effektive Kosten Eigenanteil
      const totalValueIncrease = this.editableFinancialData.rentalIncrease.totalValueIncrease || 0;
      this.editableFinancialData.returnOnEquityBeforeTax = 
        (totalValueIncrease / this.editableFinancialData.effectiveCosts * 100).toFixed(2);
    } else {
      this.editableFinancialData.returnOnEquityBeforeTax = '0.00';
    }
  }
  
  // Updated method to calculate rental yield (Mietrendite)
  calculateRentalYield(): void {
    if (this.editableFinancialData.rentalIncrease.valueBefore > 0) {
      // Mietrendite Vorher = (Monthly rent Vorher × 12) / Property value per sqm Vorher
      const annualRentBefore = this.editableFinancialData.rentalIncrease.perSqmBefore * 12;
      this.editableFinancialData.rentalIncrease.returnBefore = 
        ((annualRentBefore / this.editableFinancialData.rentalIncrease.valueBefore) * 100).toFixed(1);
    } else {
      this.editableFinancialData.rentalIncrease.returnBefore = '0.0';
    }
    
    if (this.editableFinancialData.rentalIncrease.valueAfter > 0) {
      // Mietrendite Nachher = (Monthly rent Nachher × 12) / Property value per sqm Nachher
      const annualRentAfter = this.editableFinancialData.rentalIncrease.perSqmAfter * 12;
      this.editableFinancialData.rentalIncrease.returnAfter = 
        ((annualRentAfter / this.editableFinancialData.rentalIncrease.valueAfter) * 100).toFixed(1);
    } else {
      this.editableFinancialData.rentalIncrease.returnAfter = '0.0';
    }
    
    // Calculate the increase as percentage difference: (Nachher/Vorher - 1)
    const beforeValue = parseFloat(this.editableFinancialData.rentalIncrease.returnBefore);
    const afterValue = parseFloat(this.editableFinancialData.rentalIncrease.returnAfter);
    
    if (beforeValue > 0) {
      // Calculate percentage change: (Nachher/Vorher - 1) * 100
      this.editableFinancialData.rentalIncrease.returnIncrease = 
        ((afterValue / beforeValue - 1) * 100).toFixed(1);
    } else {
      this.editableFinancialData.rentalIncrease.returnIncrease = '0.0';
    }
  }
  
  // Calculate modernization levy for financial data
  calculateModernizationLevyForFinancialData(): void {
    this.financialData.modernizationLevy = 
      Math.round(this.financialData.effectiveCosts * 0.08);
  }
  
  // Helper methods to calculate values for the financial data object
  calculateFundingRateForFinancialData(): void {
    if (this.financialData.totalCosts > 0) {
      this.financialData.fundingRate = 
        (this.financialData.totalFunding / this.financialData.totalCosts * 100).toFixed(1);
    } else {
      this.financialData.fundingRate = '0.0';
    }
  }
  
  calculateTotalSavingsForFinancialData(): void {
    this.financialData.totalSavingsPerYear = 
      this.financialData.energyCostSavings + 
      (this.financialData.modernizationLevy || 0) +
      this.financialData.co2TaxSavings + 
      (this.financialData.pvSalesIncome || 0);
  }
  
  calculateAmortizationForFinancialData(): void {
    if (this.financialData.totalSavingsPerYear > 0) {
      this.financialData.amortizationYears = 
        (this.financialData.effectiveCosts / this.financialData.totalSavingsPerYear).toFixed(1);
    } else {
      this.financialData.amortizationYears = '0.0';
    }
  }
  
  calculateReturnOnEquityForFinancialData(): void {
    if (this.financialData.effectiveCosts > 0) {
      this.financialData.returnOnEquity = 
        (this.financialData.totalSavingsPerYear / this.financialData.effectiveCosts * 100).toFixed(2);
    } else {
      this.financialData.returnOnEquity = '0.00';
    }
  }
  
  // Calculate Return on Equity Before Tax for financial data
  calculateReturnOnEquityBeforeTaxForFinancialData(): void {
    if (this.financialData.effectiveCosts > 0) {
      const totalValueIncrease = this.financialData.rentalIncrease.totalValueIncrease || 0;
      this.financialData.returnOnEquityBeforeTax = 
        (totalValueIncrease / this.financialData.effectiveCosts * 100).toFixed(2);
    } else {
      this.financialData.returnOnEquityBeforeTax = '0.00';
    }
  }
  
  // Updated method to calculate rental yield for financial data
  calculateRentalYieldForFinancialData(): void {
    if (this.financialData.rentalIncrease.valueBefore > 0) {
      // Mietrendite Vorher = (Monthly rent Vorher × 12) / Property value per sqm Vorher
      const annualRentBefore = this.financialData.rentalIncrease.perSqmBefore * 12;
      this.financialData.rentalIncrease.returnBefore = 
        ((annualRentBefore / this.financialData.rentalIncrease.valueBefore) * 100).toFixed(1);
    } else {
      this.financialData.rentalIncrease.returnBefore = '0.0';
    }
    
    if (this.financialData.rentalIncrease.valueAfter > 0) {
      // Mietrendite Nachher = (Monthly rent Nachher × 12) / Property value per sqm Nachher
      const annualRentAfter = this.financialData.rentalIncrease.perSqmAfter * 12;
      this.financialData.rentalIncrease.returnAfter = 
        ((annualRentAfter / this.financialData.rentalIncrease.valueAfter) * 100).toFixed(1);
    } else {
      this.financialData.rentalIncrease.returnAfter = '0.0';
    }
    
    // Calculate the increase as percentage difference: (Nachher/Vorher - 1)
    const beforeValue = parseFloat(this.financialData.rentalIncrease.returnBefore);
    const afterValue = parseFloat(this.financialData.rentalIncrease.returnAfter);
    
    if (beforeValue > 0) {
      // Calculate percentage change: (Nachher/Vorher - 1) * 100
      this.financialData.rentalIncrease.returnIncrease = 
        ((afterValue / beforeValue - 1) * 100).toFixed(1);
    } else {
      this.financialData.rentalIncrease.returnIncrease = '0.0';
    }
  }
  
  // New method to update perSqmBefore from consumptionData.rentPrice
  updatePerSqmBeforeFromConsumptionData(): void {
    if (this.consumptionData && this.consumptionData.rentPrice) {
      // Update the perSqmBefore value with the rentPrice from consumptionData
      this.financialData.rentalIncrease.perSqmBefore = this.consumptionData.rentPrice;
      
      // If in edit mode, also update the editable data
      if (this.isEditMode && this.editableFinancialData) {
        this.editableFinancialData.rentalIncrease.perSqmBefore = this.consumptionData.rentPrice;
      }
      
      // Recalculate rental yield after updating perSqmBefore
      this.calculateRentalYieldForFinancialData();
      
      console.log('Updated perSqmBefore from consumptionData:', this.financialData.rentalIncrease.perSqmBefore);
    }
  }
}
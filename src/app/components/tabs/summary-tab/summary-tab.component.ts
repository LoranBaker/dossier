import { Component, Input, OnInit, AfterViewInit, ElementRef, ViewChildren, QueryList, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Building } from '@models/building.model';
import { ConsumptionData, RenovationMeasure, SavingsPotential } from '@models/models';
import { trigger, transition, style, animate, state } from '@angular/animations';

@Component({
  selector: 'app-summary-tab',
  templateUrl: './summary-tab.component.html',
  styleUrls: ['./summary-tab.component.scss'],
  standalone: true,
  imports: [CommonModule],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('600ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('numberCountAnimation', [
      state('initial', style({ opacity: 0 })),
      state('final', style({ opacity: 1 })),
      transition('initial => final', animate('1000ms ease-out'))
    ])
  ]
})
export class SummaryTabComponent implements OnInit, AfterViewInit, OnChanges {
  @Input() building: Building | null = null;
  @Input() consumptionData: ConsumptionData | null = null;
  @Input() renovationMeasures: RenovationMeasure[] = [];
  @Input() savingsPotential: SavingsPotential | null = null;
  @Input() totalCosts: number = 0;
  @Input() totalFunding: number = 0;
  @Input() totalSavings: number = 0;
  @Input() financialData: any = {}; // NEW: Add financial data input

  currentEnergyClass: string = 'F';
  targetEnergyClass: string = 'B';
  currentPropertyValue: number = 0;
  targetPropertyValue: number = 0;
  propertyValueIncrease: number = 0;
  currentRentPerSqm: number = 0;
  targetRentPerSqm: number = 0;
  rentIncreaseEuro: number = 0;
  rentIncreasePercent: number = 0;
  
  animationState = 'initial';
  
  @ViewChildren('animatedElement') animatedElements!: QueryList<ElementRef>;

  constructor(private elementRef: ElementRef) { }

  ngOnInit(): void {
    this.calculateValues();
    
    // Start animation after a short delay
    setTimeout(() => {
      this.animationState = 'final';
    }, 300);
  }
  
  ngAfterViewInit(): void {
    // Add intersection observer for scroll animations
    this.setupScrollAnimations();
    
    // Apply progress bar animations
    setTimeout(() => {
      const progressBars = this.elementRef.nativeElement.querySelectorAll('.progress-bar');
      progressBars.forEach((bar: HTMLElement) => {
        bar.style.width = bar.classList.contains('progress-70') ? '70%' : '30%';
      });
    }, 500);
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Recalculate values when inputs change
    if (changes['financialData'] || changes['building'] || changes['consumptionData']) {
      this.calculateValues();
      
      console.log('Summary component inputs changed:', {
        financialData: this.financialData,
        building: this.building,
        consumptionData: this.consumptionData
      });
    }
  }
  
  /**
   * Sets up intersection observers for scroll animations
   */
  private setupScrollAnimations(): void {
    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate');
          observer.unobserve(entry.target);
        }
      });
    }, options);
    
    // Observe summary panels
    const panels = this.elementRef.nativeElement.querySelectorAll('.summary-panel');
    panels.forEach((panel: HTMLElement) => {
      observer.observe(panel);
    });
    
    // Observe summary icons
    const icons = this.elementRef.nativeElement.querySelectorAll('.summary-icon');
    icons.forEach((icon: HTMLElement) => {
      observer.observe(icon);
    });
    
    // Observe conclusion section
    const conclusion = this.elementRef.nativeElement.querySelector('.summary-conclusion');
    if (conclusion) {
      observer.observe(conclusion);
    }
  }

 private calculateValues(): void {
  // Use financial data if available, otherwise fallback to placeholder values
  if (this.financialData && Object.keys(this.financialData).length > 0) {
    console.log('Using financial data for summary calculations:', this.financialData);
    
    // Map values from financial potential tab
    // Left side (current/before values)
    this.currentPropertyValue = this.financialData.currentPropertyValue || 675000;
    this.currentRentPerSqm = this.financialData.currentRentPerSqm || this.getConsumptionRentPrice();
    
    // Right side (future/after values)
    this.targetPropertyValue = this.financialData.targetPropertyValue || 795000;
    this.propertyValueIncrease = this.financialData.propertyValueIncreaseAmount || 120000;
    this.targetRentPerSqm = this.financialData.targetRentPerSqm || 15.20;
    this.rentIncreaseEuro = this.financialData.rentIncreasePerSqm || 2.70;
    
    // Calculate percentage increase
    if (this.currentRentPerSqm > 0) {
      this.rentIncreasePercent = ((this.targetRentPerSqm - this.currentRentPerSqm) / this.currentRentPerSqm) * 100;
    }
  } else {
    console.log('Using fallback values for summary calculations');
    
    // Use consumption data for consistency if available
    this.currentRentPerSqm = this.getConsumptionRentPrice();
    
    // Fallback to default values if no financial data
    this.currentPropertyValue = 675000;
    this.targetPropertyValue = 795000;
    this.propertyValueIncrease = this.targetPropertyValue - this.currentPropertyValue;
    this.targetRentPerSqm = 15.20;
    this.rentIncreaseEuro = this.targetRentPerSqm - this.currentRentPerSqm;
    this.rentIncreasePercent = ((this.targetRentPerSqm - this.currentRentPerSqm) / this.currentRentPerSqm) * 100;
  }
  
  // Log final values for debugging
  console.log('Summary values calculated:', {
    currentPropertyValue: this.currentPropertyValue,
    targetPropertyValue: this.targetPropertyValue,
    propertyValueIncrease: this.propertyValueIncrease,
    currentRentPerSqm: this.currentRentPerSqm,
    targetRentPerSqm: this.targetRentPerSqm,
    rentIncreaseEuro: this.rentIncreaseEuro,
    rentIncreasePercent: this.rentIncreasePercent,
    currentEnergyClass: this.currentEnergyClass,
    targetEnergyClass: this.targetEnergyClass
  });
}
private getConsumptionRentPrice(): number {
  if (this.consumptionData && this.consumptionData.rentPrice && this.consumptionData.rentPrice > 0) {
    console.log('Using consumption data rent price:', this.consumptionData.rentPrice);
    return this.consumptionData.rentPrice;
  }
  console.log('Using fallback rent price: 12.50');
  return 12.50; // fallback value
}
  /**
   * Formats currency values for display
   */
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }

  /**
   * Formats percentage values for display
   */
  formatPercentage(value: number, decimals: number = 1): string {
    return `${value.toFixed(decimals)}%`;
  }

  /**
   * Formats rent per square meter for display
   */
  formatRentPerSqm(value: number): string {
    return `${value.toFixed(2)} €/m²`;
  }

  /**
   * Triggers number counting animation for a specific element
   */
  animateNumber(element: HTMLElement, targetValue: number, duration: number = 1000): void {
    const startValue = 0;
    const startTime = performance.now();
    
    const updateNumber = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = startValue + (targetValue - startValue) * easeOutQuart;
      
      element.textContent = Math.floor(currentValue).toLocaleString('de-DE');
      
      if (progress < 1) {
        requestAnimationFrame(updateNumber);
      } else {
        element.textContent = targetValue.toLocaleString('de-DE');
      }
    };
    
    requestAnimationFrame(updateNumber);
  }

  /**
   * Get energy class color for styling
   */
  getEnergyClassColor(energyClass: string): string {
    const colorMap: { [key: string]: string } = {
      'A+': '#00a651',
      'A': '#4cb847',
      'B': '#8cc63f',
      'C': '#d7df23',
      'D': '#fff200',
      'E': '#ffb300',
      'F': '#ff6900',
      'G': '#e60012',
      'H': '#a50034'
    };
    return colorMap[energyClass] || '#cccccc';
  }
}
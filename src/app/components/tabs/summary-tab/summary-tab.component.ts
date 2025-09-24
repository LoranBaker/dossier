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
  @Input() financialData: any = {}; // Financial data input
  @Input() energyRatings: { currentEnergyRating: string; targetEnergyRating: string } | null = null; // Energy ratings input

  currentEnergyClass: string = 'F';
  targetEnergyClass: string = 'A';
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
    if (changes['financialData'] || changes['building'] || changes['consumptionData'] || changes['energyRatings']) {
      this.calculateValues();
      
      console.log('Summary component inputs changed:', {
        financialData: this.financialData,
        building: this.building,
        consumptionData: this.consumptionData,
        energyRatings: this.energyRatings
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
    // Update energy classes from renovation results if available
    if (this.energyRatings) {
      this.currentEnergyClass = this.energyRatings.currentEnergyRating;
      this.targetEnergyClass = this.energyRatings.targetEnergyRating;
      console.log('Using energy ratings from renovation results:', this.energyRatings);
    } else {
      // Fallback to consumption data or defaults
      this.currentEnergyClass = this.getEnergyClassFromConsumption() || 'F';
      this.targetEnergyClass = 'A'; // Default target after renovation
      console.log('Using fallback energy ratings:', { current: this.currentEnergyClass, target: this.targetEnergyClass });
    }

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
   * Get energy class from consumption data
   */
  private getEnergyClassFromConsumption(): string | null {
    if (this.consumptionData && this.consumptionData.energyIntensity) {
      return this.getEnergyRatingFromIntensity(this.consumptionData.energyIntensity);
    }
    return null;
  }

  /**
   * Convert energy intensity to energy rating
   */
  private getEnergyRatingFromIntensity(energyIntensity: number): string {
    if (energyIntensity <= 25) return 'A+';
    if (energyIntensity <= 50) return 'A';
    if (energyIntensity <= 75) return 'B';
    if (energyIntensity <= 100) return 'C';
    if (energyIntensity <= 125) return 'D';
    if (energyIntensity <= 150) return 'E';
    if (energyIntensity <= 175) return 'F';
    if (energyIntensity <= 200) return 'G';
    return 'H';
  }

  /**
   * Get CSS class name for energy badge (handles special characters)
   */
  getEnergyBadgeClass(energyClass: string): string {
    // Convert to lowercase and handle special characters
    const baseClass = 'energy-badge';
    let energySpecificClass = `energy-badge-${energyClass.toLowerCase()}`;
    
    // Handle A+ special case
    if (energyClass === 'A+') {
      energySpecificClass = 'energy-badge-a-plus';
    }
    
    return `${baseClass} ${energySpecificClass}`;
  }

  /**
   * Debug method to check current energy class values
   */
  debugEnergyClasses(): void {
    console.log('=== ENERGY CLASS DEBUG ===');
    console.log('Current Energy Class:', this.currentEnergyClass);
    console.log('Target Energy Class:', this.targetEnergyClass);
    console.log('Energy Ratings Input:', this.energyRatings);
    console.log('CSS Class for current:', this.getEnergyBadgeClass(this.currentEnergyClass));
    console.log('CSS Class for target:', this.getEnergyBadgeClass(this.targetEnergyClass));
    console.log('Current Energy Color:', this.getEnergyClassColor(this.currentEnergyClass));
    console.log('Target Energy Color:', this.getEnergyClassColor(this.targetEnergyClass));
    console.log('=== END DEBUG ===');
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

  /**
   * Get inline styles for energy badge (alternative to CSS classes)
   */
  getEnergyBadgeStyles(energyClass: string): { [key: string]: string } {
    const baseStyles = {
      'display': 'inline-flex',
      'width': '48px',
      'height': '48px',
      'align-items': 'center',
      'justify-content': 'center',
      'color': 'white',
      'font-weight': '700',
      'font-size': '1.3rem',
      'border-radius': '12px',
      'box-shadow': '0 4px 10px rgba(0, 0, 0, 0.1)',
      'position': 'relative'
    };

    const color = this.getEnergyClassColor(energyClass);
    
    // Create gradient based on energy class
    let background = '';
    switch (energyClass) {
      case 'A+':
        background = 'linear-gradient(135deg, #00a651, #34c759)';
        break;
      case 'A':
        background = 'linear-gradient(135deg, #4cb847, #34c759)';
        break;
      case 'B':
        background = 'linear-gradient(135deg, #8cc63f, #4cb847)';
        break;
      case 'C':
        background = 'linear-gradient(135deg, #d7df23, #8cc63f)';
        break;
      case 'D':
        background = 'linear-gradient(135deg, #fff200, #d7df23)';
        break;
      case 'E':
        background = 'linear-gradient(135deg, #ffb300, #fff200)';
        break;
      case 'F':
        background = 'linear-gradient(135deg, #ff6900, #ffb300)';
        break;
      case 'G':
        background = 'linear-gradient(135deg, #e60012, #ff6900)';
        break;
      case 'H':
        background = 'linear-gradient(135deg, #a50034, #e60012)';
        break;
      default:
        background = color;
    }

    return {
      ...baseStyles,
      'background': background
    };
  }
}
import { Component, Input, OnInit, AfterViewInit, ElementRef, ViewChildren, QueryList } from '@angular/core';
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
export class SummaryTabComponent implements OnInit, AfterViewInit {
  @Input() building: Building | null = null;
  @Input() consumptionData: ConsumptionData | null = null;
  @Input() renovationMeasures: RenovationMeasure[] = [];
  @Input() savingsPotential: SavingsPotential | null = null;
  @Input() totalCosts: number = 0;
  @Input() totalFunding: number = 0;
  @Input() totalSavings: number = 0;

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

  ngOnChanges(): void {
    this.calculateValues();
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
    // Using placeholder values based on the image
    if (this.consumptionData) {

    }

    if (this.building) {
      // Property values calculation
      this.currentPropertyValue = 1414000;
      this.targetPropertyValue = 1696800;
      this.propertyValueIncrease = this.targetPropertyValue - this.currentPropertyValue;

      // Rent calculations
      this.currentRentPerSqm = 8.00;
      this.targetRentPerSqm = 10.60;
      this.rentIncreaseEuro = this.targetRentPerSqm - this.currentRentPerSqm;
      this.rentIncreasePercent = ((this.targetRentPerSqm - this.currentRentPerSqm) / this.currentRentPerSqm) * 100;
    }
  }
}
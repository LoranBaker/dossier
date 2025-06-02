// dossier.component.ts
import { Component, OnInit, HostListener, ViewChild, ViewEncapsulation, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DecimalPipe, CurrencyPipe } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';

// Import Tab Content Components
import { OverviewTabComponent } from '../tabs/overview-tab/overview-tab.component';
import { BuildingDataTabComponent } from '../tabs/building-data-tab/building-data-tab.component';
import { ConsumptionTabComponent } from '../tabs/consumption-tab/consumption-tab.component';
import { AnalysisTabComponent } from '../tabs/analysis-tab/analysis-tab.component';
import { RenovationTabComponent } from '../tabs/renovation-tab/renovation-tab.component';
import { TimelineTabComponent } from '../tabs/timeline-tab/timeline-tab.component';
import { TargetAnalysisTabComponent } from '../tabs/target-analysis-tab/target-analysis-tab.component';
import { FinancialPotentialTabComponent } from '../tabs/financial-potential-tab/financial-potential-tab.component';
import { RenovationResultsTabComponent } from '../renovation-results-tab/renovation-results-tab.component';
import { FinancialBenefitsTabComponent } from '../tabs/financial-benefits-tab/financial-benefits-tab.component';
import { FinancingCalculatorComponent } from '../tabs/financing-calculator/financing-calculator.component';
import { SummaryTabComponent } from '../tabs/summary-tab/summary-tab.component';
// Import Models and Service
import { Building } from '@models/building.model';
import { ConsumptionData, RenovationMeasure, RenovationPlan, SavingsPotential, ModernizationCosts } from '@models/models';
import { DossierDataService } from '../../services/dossier-data.service';

@Component({
  selector: 'app-dossier',
  templateUrl: './dossier.component.html',
  styleUrls: ['./dossier.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    OverviewTabComponent,
    BuildingDataTabComponent,
    ConsumptionTabComponent,
    AnalysisTabComponent,
    RenovationTabComponent,
    TimelineTabComponent,
    TargetAnalysisTabComponent,
    FinancialPotentialTabComponent,
    RenovationResultsTabComponent,
    FinancialBenefitsTabComponent,
    FinancingCalculatorComponent,
    SummaryTabComponent
],
  animations: [
    trigger('tabAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('400ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class DossierComponent implements OnInit {
  activeTab = 'overview';
  scrolled = false;

  @ViewChild('tabsWrapper') tabsWrapper!: ElementRef;
  @ViewChild('tabsContent') tabsContent!: ElementRef;
  
  isScrolledToStart: boolean = true;
  isScrolledToEnd: boolean = false;
  scrollObserver: IntersectionObserver | null = null;

  // Observable streams from service
  building$: Observable<Building>;
  consumptionData$: Observable<ConsumptionData>;
  renovationMeasures$: Observable<RenovationMeasure[]>;
  renovationPlan$: Observable<RenovationPlan[]>;
  savingsPotential$: Observable<SavingsPotential>;
  modernizationCosts$: Observable<ModernizationCosts>;
  totalCosts$: Observable<number>;
  totalFunding$: Observable<number>;
  totalSavings$: Observable<number>;
  buildingImageUrl$: Observable<string | null>;

  // For template access - can be replaced with the async pipe where possible
  building!: Building;
  consumptionData!: ConsumptionData;
  renovationMeasures!: RenovationMeasure[];
  renovationPlan!: RenovationPlan[];
  savingsPotential!: SavingsPotential;
  modernizationCosts!: ModernizationCosts;
  totalCosts: number = 0;
  totalFunding: number = 0;
  totalSavings: number = 0;
  buildingImageUrl: string | null = null;

  constructor(private dossierService: DossierDataService) {
    // Get observables from service
    this.building$ = this.dossierService.building$;
    this.consumptionData$ = this.dossierService.consumptionData$;
    this.renovationMeasures$ = this.dossierService.renovationMeasures$;
    this.renovationPlan$ = this.dossierService.renovationPlan$;
    this.savingsPotential$ = this.dossierService.savingsPotential$;
    this.modernizationCosts$ = this.dossierService.modernizationCosts$;
    this.totalCosts$ = this.dossierService.totalCosts$;
    this.totalFunding$ = this.dossierService.totalFunding$;
    this.totalSavings$ = this.dossierService.totalSavings$;
    this.buildingImageUrl$ = this.dossierService.buildingImageUrl$;
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.scrolled = window.scrollY > 100;
  }

  ngOnInit(): void {
    // Fetch all data from service
    this.dossierService.fetchAll();
    
    // Subscribe to data for template access
    this.building$.subscribe(building => this.building = building);
    this.consumptionData$.subscribe(data => this.consumptionData = data);
    this.renovationMeasures$.subscribe(measures => this.renovationMeasures = measures);
    this.renovationPlan$.subscribe(plan => this.renovationPlan = plan);
    this.savingsPotential$.subscribe(potential => this.savingsPotential = potential);
    this.modernizationCosts$.subscribe(costs => this.modernizationCosts = costs);
    this.totalCosts$.subscribe(costs => this.totalCosts = costs);
    this.totalFunding$.subscribe(funding => this.totalFunding = funding);
    this.totalSavings$.subscribe(savings => this.totalSavings = savings);
    this.buildingImageUrl$.subscribe(url => this.buildingImageUrl = url);
    
    // Setup tab navigation
    this.setupTabNavigation();
    
    // Check initial scroll state
    setTimeout(() => this.checkTabsScroll(), 100);
  }

  ngOnDestroy() {
    // Clean up observer
    if (this.scrollObserver) {
      this.scrollObserver.disconnect();
    }
  }
  
  /**
   * Sets up tab navigation scroll behavior
   */
  setupTabNavigation() {
    // Only setup if tabs content is available
    if (!this.tabsContent || !this.tabsContent.nativeElement) {
      return;
    }
    
    // Check if tab content overflows the wrapper
    this.checkTabsOverflow();
    
    // Add resize listener to check overflow
    window.addEventListener('resize', this.checkTabsOverflow.bind(this));
    
    // Setup scroll event listener
    this.tabsContent.nativeElement.addEventListener('scroll', this.handleTabsScroll.bind(this));
  }
  
  /**
   * Checks if tabs content overflows and needs scroll buttons
   */
  checkTabsOverflow() {
    if (!this.tabsContent || !this.tabsContent.nativeElement || !this.tabsWrapper || !this.tabsWrapper.nativeElement) {
      return;
    }
    
    const tabsEl = this.tabsContent.nativeElement;
    const wrapperEl = this.tabsWrapper.nativeElement;
    
    // Show/hide scroll buttons based on content width
    const hasOverflow = tabsEl.scrollWidth > wrapperEl.clientWidth;
    
    // Set appropriate classes
    wrapperEl.classList.toggle('has-overflow', hasOverflow);
    
    // Check scroll position
    this.checkTabsScroll();
  }
  
  /**
   * Checks current scroll position to update button states
   */
  checkTabsScroll() {
    if (!this.tabsContent || !this.tabsContent.nativeElement) {
      return;
    }
    
    const tabsEl = this.tabsContent.nativeElement;
    
    // Check if scrolled to start or end
    this.isScrolledToStart = tabsEl.scrollLeft <= 10;
    this.isScrolledToEnd = Math.abs(tabsEl.scrollWidth - tabsEl.clientWidth - tabsEl.scrollLeft) <= 10;
  }
  
  /**
   * Handles tab scroll event
   */
  handleTabsScroll() {
    this.checkTabsScroll();
  }
  
  /**
   * Scrolls tabs in specified direction
   */
  scrollTabs(direction: 'left' | 'right') {
    if (direction === 'left' && this.isScrolledToStart) {
      return;
    }
    
    if (direction === 'right' && this.isScrolledToEnd) {
      return;
    }
    
    if (!this.tabsContent || !this.tabsContent.nativeElement) {
      return;
    }
    
    const tabsEl = this.tabsContent.nativeElement;
    const scrollAmount = tabsEl.clientWidth * 0.75; // Scroll 75% of visible width
    
    if (direction === 'left') {
      tabsEl.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    } else {
      tabsEl.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
    
    // Force update the scroll state after scrolling
    setTimeout(() => {
      this.checkTabsScroll();
    }, 300);
  }
  
  /**
   * Scroll active tab into view
   */
  scrollActiveTabIntoView() {
    if (!this.tabsContent || !this.tabsContent.nativeElement) {
      return;
    }
    
    // Find the active tab button
    const activeTab = this.tabsContent.nativeElement.querySelector('button.active');
    if (activeTab) {
      // Calculate position to scroll the active tab to the center
      const tabsEl = this.tabsContent.nativeElement;
      const tabCenter = activeTab.offsetLeft + activeTab.offsetWidth / 2;
      const scrollCenter = tabsEl.clientWidth / 2;
      const scrollTo = tabCenter - scrollCenter;
      
      // Scroll to position
      tabsEl.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  }
  
  /**
   * Sets the active tab and scrolls it into view
   */
  setActiveTab(tab: string): void {
    this.activeTab = tab;
    
    // Scroll active tab into view after a short delay to allow for DOM updates
    setTimeout(() => this.scrollActiveTabIntoView(), 50);
    
    // Smooth scroll to content
    setTimeout(() => {
      const element = document.querySelector('.tab-content');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }
  
  /**
   * Handles image upload
   */
  onImageUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        alert('Bitte nur Bilddateien hochladen.');
        return;
      }
      
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Die Bilddatei darf nicht größer als 5MB sein.');
        return;
      }
      
      // Create a URL for the file
      const reader = new FileReader();
      reader.onload = () => {
        const imageUrl = reader.result as string;
        this.dossierService.setBuildingImage(imageUrl);
      };
      reader.readAsDataURL(file);
    }
  }
  
  /**
   * Removes the building image
   */
  removeImage(): void {
    this.dossierService.setBuildingImage(null);
    // Reset the input
    const fileInput = document.getElementById('building-image-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }
  
  /**
   * Updates renovation totals from child component
   */
  onRenovationTotalsChanged(totals: { totalCosts: number; totalFunding: number; totalSavings: number }): void {
    this.dossierService.updateRenovationTotals(totals);
  }
}
// dossier.component.ts
import { Component, OnInit, HostListener, ViewChild, ViewEncapsulation, ElementRef, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
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
import { ModernizationPlanningComponent } from '../tabs/modernization-planning/modernization-planning.component';
import { ConsultationCtaComponent } from '../tabs/consultation-cta/consultation-cta.component';
import { GeneralInfoComponent } from '../tabs/general-info/general-info.component';

// Import 3D Model Component
import { ModelScreenshot, Simple3DModelComponent } from '../simple3d-model/simple3d-model.component';

// Import Models and Service
import { Building } from '@models/building.model';
import { ConsumptionData, RenovationMeasure, RenovationPlan, SavingsPotential, ModernizationCosts } from '@models/models';
import { DossierDataService } from '../../services/dossier-data.service';
import { FinancialDataService } from '@app/services/financial-data.service';
import { PrintService } from '@app/services/print.service';
import { Building3DService } from '../../services/building-3d.service';
import { PrintPdfService } from '../../services/print-pdf.service';

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
    SummaryTabComponent,
    ModernizationPlanningComponent,
    ConsultationCtaComponent,
    GeneralInfoComponent,
    Simple3DModelComponent // Add 3D model component
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
  amortizationYears$: Observable<number>;
  foerderboniMeasures: any[] = [];
  
  // For template access - can be replaced with the async pipe where possible
  building!: Building;
  consumptionData!: ConsumptionData;
  renovationMeasures!: RenovationMeasure[];
  renovationPlan!: RenovationPlan[];
  modelScreenshots: ModelScreenshot[] = [];
  savingsPotential!: SavingsPotential;
  modernizationCosts!: ModernizationCosts;
  totalCosts: number = 0;
  totalFunding: number = 0;
  totalSavings: number = 0;
  buildingImageUrl: string | null = null;

  currentAmortizationYears: number = 0;
  financialData: any = {};
  co2TaxData: { eigennutzerTotal: number; vermieterTotal: number } = { eigennutzerTotal: 0, vermieterTotal: 0 };

  // NEW: Energy ratings data from renovation results
  energyRatings: { currentEnergyRating: string; targetEnergyRating: string } | null = null;

  // 3D Model specific properties
  buildingId: string | null = null;
  has3DModel: boolean = false;
  loading3DModel: boolean = false;

  constructor(
    private dossierService: DossierDataService,
    private financialDataService: FinancialDataService, 
    private printService: PrintService,
    private building3DService: Building3DService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private printPdfService: PrintPdfService
  ) {
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
    this.amortizationYears$ = this.financialDataService.amortizationYears$;
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    if (isPlatformBrowser(this.platformId)) {
      this.scrolled = window.scrollY > 100;
    }
  }

  ngOnInit(): void {
    // Fetch all data from service
    this.dossierService.fetchAll();
    
    // Subscribe to data for template access
    this.building$.subscribe(building => {
      this.building = building;
      // Only load 3D model in browser environment
      if (isPlatformBrowser(this.platformId) && building && building.address) {
        this.load3DModelForBuilding(building.address);
      }
    });
    
    this.consumptionData$.subscribe(data => this.consumptionData = data);
    this.renovationMeasures$.subscribe(measures => this.renovationMeasures = measures);
    this.renovationPlan$.subscribe(plan => this.renovationPlan = plan);
    this.savingsPotential$.subscribe(potential => this.savingsPotential = potential);
    this.modernizationCosts$.subscribe(costs => this.modernizationCosts = costs);
    this.totalCosts$.subscribe(costs => this.totalCosts = costs);
    this.totalFunding$.subscribe(funding => this.totalFunding = funding);
    this.totalSavings$.subscribe(savings => this.totalSavings = savings);
    this.buildingImageUrl$.subscribe(url => this.buildingImageUrl = url);
    this.amortizationYears$.subscribe(years => this.currentAmortizationYears = years);
    // Add this line in ngOnInit() after the other subscriptions
    this.dossierService.foerderboniMeasures$.subscribe(measures => this.foerderboniMeasures = measures);
    
    // Setup tab navigation (only in browser)
    if (isPlatformBrowser(this.platformId)) {
      this.setupTabNavigation();
      // Check initial scroll state
      setTimeout(() => this.checkTabsScroll(), 100);
    }
    
    this.calculateInitialSavingsPercentages();
  }

  ngOnDestroy() {
    // Clean up observer
    if (this.scrollObserver) {
      this.scrollObserver.disconnect();
    }
  }

  /**
   * Load 3D model for the current building address
   */
  private async load3DModelForBuilding(address: string): Promise<void> {
    if (!address) return;

    try {
      this.loading3DModel = true;
      
      // Get building ID by address
      const buildingId = await this.building3DService.getBuildingIdByAddress(address).toPromise();
      
      if (buildingId) {
        this.buildingId = buildingId;
        this.has3DModel = true;
        console.log('3D Model available for building ID:', buildingId);
      } else {
        this.has3DModel = false;
        console.log('No 3D model available for address:', address);
      }
      
    } catch (error) {
      console.error('Error loading 3D model:', error);
      this.has3DModel = false;
    } finally {
      this.loading3DModel = false;
    }
  }

  /**
   * Retry loading 3D model
   */
  retry3DModel(): void {
    if (this.building && this.building.address) {
      this.load3DModelForBuilding(this.building.address);
    }
  }
  
  /**
   * Sets up tab navigation scroll behavior
   */
  setupTabNavigation() {
    // Only setup if tabs content is available and in browser
    if (!isPlatformBrowser(this.platformId) || !this.tabsContent || !this.tabsContent.nativeElement) {
      return;
    }
    
    // Check if tab content overflows the wrapper
    this.checkTabsOverflow();
    
    // Add resize listener to check overflow
    window.addEventListener('resize', this.checkTabsOverflow.bind(this));
    
    // Setup scroll event listener
    this.tabsContent.nativeElement.addEventListener('scroll', this.handleTabsScroll.bind(this));
  }
  
  onCO2TaxDataChanged(data: { eigennutzerTotal: number; vermieterTotal: number }): void {
    this.co2TaxData = data;
  }

  onScreenshotsChanged(screenshots: ModelScreenshot[]): void {
    this.modelScreenshots = screenshots;
    // Pass screenshots to print service
    this.printService.setScreenshots(screenshots);
    this.printPdfService.setScreenshots(screenshots); 
    console.log('Screenshots updated:', screenshots.length, 'images');
  }

  /**
   * Checks if tabs content overflows and needs scroll buttons
   */
  checkTabsOverflow() {
    if (!isPlatformBrowser(this.platformId) || !this.tabsContent || !this.tabsContent.nativeElement || !this.tabsWrapper || !this.tabsWrapper.nativeElement) {
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
    if (!isPlatformBrowser(this.platformId) || !this.tabsContent || !this.tabsContent.nativeElement) {
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
    if (!isPlatformBrowser(this.platformId)) return;
    
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
    if (!isPlatformBrowser(this.platformId) || !this.tabsContent || !this.tabsContent.nativeElement) {
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
    
    if (isPlatformBrowser(this.platformId)) {
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
  }
  
  /**
   * Updates renovation totals from child component
   */
  onRenovationTotalsChanged(totals: { totalCosts: number; totalFunding: number; totalSavings: number }): void {
    this.dossierService.updateRenovationTotals(totals);
  }

  financialPotentialData: any = {
    pvSalesIncome: 0,
    co2TaxSavings: 0,
    pvSalesIncomeMonthly: 0,
    co2TaxSavingsMonthly: 0
  };

  onFinancialPotentialDataChanged(data: any): void {
    this.financialPotentialData = data;
    this.financialData = data;
    console.log('Financial Potential Data Updated:', data);
  }
  
  async printDossier(printType: 'kunde' | 'lv' | 'bank'): Promise<void> {
    await this.printService.printDossierWithType(
      this.building,
      (tab: string) => this.setActiveTab(tab),
      () => this.activeTab,
      printType
    );
  }

  printScreenshotDossier() {
    const tabOrder = [
      'overview',
      'buildingData',
      'consumption',
      'analysis',
      'renovation',
      'timeline',
      'targetAnalysis',
      'financialPotential',
      'renovationResults',
      'financialBenefits',
      'financingCalculator',
      'summary',
      'modernizationPlanning',
      'consultationCta',
      'generalInfo'
    ];

    this.printPdfService.exportDossierTabs(tabOrder, (tab: string) => this.setActiveTab(tab), {
      fileName: 'dossier-full.pdf',
      darkBackground: false,
      contentSelector: '.tab-content',
      headerSelector: '.dossier-header',
      delayMs: 600,
      includeScreenshots: true
    });
  }

  private calculateInitialSavingsPercentages(): void {
    if (this.consumptionData) {
      const currentEnergyCosts = this.consumptionData.energyCosts || 5930;
      const futureEnergyCosts = 1092;
      const currentEnergyUse = this.consumptionData.totalEnergy || 45500;
      const futureEnergyUse = currentEnergyUse; // Same as current
      const currentCO2 = this.consumptionData.co2Emissions || 10826;
      const futureCO2 = currentCO2; // Same as current
      
      const percentages = {
        energyCostSavings: this.calculateSavingsPercentage(currentEnergyCosts, futureEnergyCosts),
        energyBalanceSavings: this.calculateSavingsPercentage(currentEnergyUse, futureEnergyUse),
        co2TaxSavings: this.calculateSavingsPercentage(currentCO2, futureCO2)
      };
      
      this.onRenovationResultsSavingsChanged(percentages);
    }
  }
  
  private calculateSavingsPercentage(current: number, future: number): number {
    if (current === 0) return 0;
    const savingsAmount = current - future;
    const savingsPercentage = (savingsAmount / current) * 100;
    return Math.round(savingsPercentage);
  }
  
  onRenovationResultsSavingsChanged(percentages: {
    energyCostSavings: number;
    energyBalanceSavings: number;
    co2TaxSavings: number;
  }): void {
    console.log('Updating savings percentages:', percentages);
    
    // Update the savingsPotential object
    if (this.savingsPotential) {
      this.savingsPotential.energyCostSavings = percentages.energyCostSavings;
      this.savingsPotential.energyBalanceSavings = percentages.energyBalanceSavings;
      this.savingsPotential.co2TaxSavings = percentages.co2TaxSavings;
    }
  }

  /**
   * NEW: Handle energy rating changes from renovation results component
   */
  onRenovationResultsEnergyRatingChanged(energyRatings: {
    currentEnergyRating: string;
    targetEnergyRating: string;
  }): void {
    console.log('Energy ratings received from renovation results:', energyRatings);
    this.energyRatings = energyRatings;
  }
}
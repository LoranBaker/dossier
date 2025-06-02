// services/dossier-data.service.ts
import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';

import { Building } from '../models/building.model';
import { ConsumptionData, RenovationMeasure, RenovationPlan, SavingsPotential, ModernizationCosts } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class DossierDataService {
  private apiBaseUrl = 'api/dossier';

  // BehaviorSubjects to store and share data across components
  private buildingSubject = new BehaviorSubject<Building>(this.initMockBuilding());
  private consumptionDataSubject = new BehaviorSubject<ConsumptionData>(this.initMockConsumptionData());
  private renovationMeasuresSubject = new BehaviorSubject<RenovationMeasure[]>(this.initMockRenovationMeasures());
  private renovationPlanSubject = new BehaviorSubject<RenovationPlan[]>(this.initRenovationPlan());
  private savingsPotentialSubject = new BehaviorSubject<SavingsPotential>(this.initSavingsPotential());
  private modernizationCostsSubject = new BehaviorSubject<ModernizationCosts>(this.initModernizationCosts());
  
  // Calculated totals
  private totalCostsSubject = new BehaviorSubject<number>(0);
  private totalFundingSubject = new BehaviorSubject<number>(0);
  private totalSavingsSubject = new BehaviorSubject<number>(0);
  
  // Building image
  private buildingImageUrlSubject = new BehaviorSubject<string | null>(null);

  // Expose as Observables
  building$ = this.buildingSubject.asObservable();
  consumptionData$ = this.consumptionDataSubject.asObservable();
  renovationMeasures$ = this.renovationMeasuresSubject.asObservable();
  renovationPlan$ = this.renovationPlanSubject.asObservable();
  savingsPotential$ = this.savingsPotentialSubject.asObservable();
  modernizationCosts$ = this.modernizationCostsSubject.asObservable();
  totalCosts$ = this.totalCostsSubject.asObservable();
  totalFunding$ = this.totalFundingSubject.asObservable();
  totalSavings$ = this.totalSavingsSubject.asObservable();
  buildingImageUrl$ = this.buildingImageUrlSubject.asObservable();

  constructor(private http: HttpClient) {
    // Initialize calculated totals
    this.initializeRenovationFunding();
    this.calculateTotals();
  }

  // Initialize mock data methods
  private initMockBuilding(): Building {
    return {
      address: 'Karlstrasse 22 in 65510 Hünstetten',
      buildingType: 'EFH',
      buildingYear: 1994,
      selfOccupied: 1,
      ownerStructure: 'Privat',
      selfUsedLivingSpace: 120,
      floors: 2,
      adjacentBuildings: false,
      units: {
        total: 5,
        commercial: 1
      },
      livingSpace: 399,
      baseArea: 147,
      retrofittedInsulation: false,
      additionalConstruction: false,
      commercialSpace: 100,
      plotSize: 605,
      residents: 4,
      heating: {
        type: 'Gas',
        surfaces: 'Heizkörper',
        renovationYear: null,
        insulatedPipes: false
      },
      hotWater: {
        source: 'Nur über Heizung',
        renovationYear: null
      },
      roof: {
        form: 'versch. Dachtypen',
        usage: 'genutzt/beheizt',
        area: 190,
        orientation: {
          direction: 'SSO / ONO',
          area: {
            sso: 11.7,
            ono: 95.4
          }
        },
        skylights: 2
      },
      facade: {
        construction: 'Massiv',
        condition: 'solide'
      },
      windows: {
        glazing: '2-fach',
        frameMaterial: 'Kunststoff'
      },
      basement: {
        exists: true,
        heated: true,
        partialBasement: false,
        fullBasement: true,
        hasUndergroundGarage: false,
        isUndergroundGarageVentilated: true,
        isUndergroundGarageHeated: false
      },
      photovoltaic: {
        installed: false,
        panelArea: 0,
        power: 0,
        panelCount: 0
      },
      consumption: {
        electricity: 'Unbekannt',
        heating: 'Ca. 40.000 kWh*',
        hotWater: 'unbekannt'
      },
      renovations: [
        {
          type: 'Fenster & Türen',
          quantity: '5 Fenster',
          year: 1990
        },
        {
          type: 'Heizung',
          quantity: '',
          year: 1985
        }
      ]
    };
  }

  private initMockConsumptionData(): ConsumptionData {
    return {
      heating: 61400,
      warmWater: 8000,
      electricity: 9500,
      totalEnergy: 78900,
      energyCosts: 10785,
      co2Emissions: 17490,
      strandedAsset: true,
      co2Intensity: 43,
      energyIntensity: 197,
      co2Tax: 2.41,
      co2TaxTotal: 962,
      strandingPoint: 2018,
      strandingRisk: -7,
      rentPrice: 10,
      marketPrice: 1500
    };
  }

  private initMockRenovationMeasures(): RenovationMeasure[] {
  return [
    {
      type: 'Solarthermie',
      description: 'vorher',
      description1: 'nachher',
      details: 'keine Solaranlage',
      details1:'nicht sanieren',
      cost: 13000,
      funding: 3900,
      savings: 0
    },
    {
      type: 'Photovoltaik',
      description: 'vorher',
      description1: 'nachher',
      details: 'Keine Photovoltaik',
      details1:'Kristallines Modul (20 %)',
      cost: 19500,
      funding: 'siehe S.13 mögl.Bonus',
      savings: 2741
    },
    {
      type: 'Dach',
      description: 'vorher',
      description1: 'nachher',
      details: 'Dach nicht gedämmt',
      details1:'Dämmen 20 cm mit WLG 0,035',
      cost: 22000,
      funding: 4400,
      savings: 705
    },
    {
      type: 'Fenster & Türen',
      description: 'vorher',
      description1: 'nachher',
      details: '2-fach-Verglasung',
      details1:'3-fach Verglasung (Wärmeschutz)',
      cost: 12000,
      funding: 2400,
      savings: 391
    },
    {
      type: 'Lüftung',
      description: 'vorher',
      description1: 'nachher',
      details: 'manuelle Lüftung',
      details1:'Lüftungsanlage dezentral mit Wärmerückgewinnung',
      cost: 9000,
      funding: 1800,
      savings: 548
    },
    {
      type: 'Heizung',
      description: 'vorher',
      description1: 'nachher',
      details: 'Gas, Bj. 1994',
      details1:'Luft-Wärmepumpe (14kW) +WW',
      cost: 35000,
      funding: 12250,
      savings: 2271
    },
    {
      type: 'Keller',
      description: 'vorher',
      description1: 'nachher',
      details: 'Keller nicht gedämmt',
      details1:'Dämmung, 10 cm mit WLG 0,035',
      cost: 10500,
      funding: 2100,
      savings: 235
    },
    {
      type: 'Fassade',
      description: 'vorher',
      description1: 'nachher',
      details: 'keine zusätzl. Dämmung',
      details1:'Dämmung, 16 cm mit WLG 0,035',
      cost: 38000,
      funding: 7600,
      savings: 939
    },
    {
      type: 'Dachgeschossdecke',
      description: 'vorher',
      description1: 'nachher',
      details: 'nicht saniert',
      details1:'nicht sanieren',
      cost: 17000,
      funding: 3400,
      savings: 0
    },
    {
      type: 'Dachfenster',
      description: 'vorher',
      description1: 'nachher',
      details: '2 und 3-fach Verglasung',
      details1:'nicht sanieren',
      cost: 1800,
      funding: 360,
      savings: 0
    },
    {
      type: 'Hydraulischer Abgleich',
      description: '',
      description1: '',
      details: '',
      details1:'Kosten in Heizung berücksichtigt',
      cost: 0,
      funding: 0,
      savings: 0
    },
    {
      type: 'Neue Heizkreispumpe',
      description: '',
      description1: '',
      details: '',
      details1:'Kosten in Heizung berücksichtigt',
      cost: 0,
      funding: 0,
      savings: 0
    },
    {
      type: 'Voraussetzung bei Heizungstausch',
      description: '',
      description1: '',
      details: '',
      details1:'',
      cost: 0,
      funding: 0,
      savings: 0
    },
       {
      type: 'Förderboni',
      description: '',
      description1: '',
      details: '',
      details1:'iSFP-Bonus 5%',
      cost: 0,
      funding: 0,
      savings: 0
    },
  ];
}

  private initRenovationPlan(): RenovationPlan[] {
    return [
      { year: 2025, measures: [], investment: 0 },
      { year: 2026, measures: [], investment: 0 },
      { year: 2027, measures: [], investment: 0 },
      { year: 2028, measures: [], investment: 0 },
      { year: 2029, measures: [], investment: 0 }
    ];
  }

  private initSavingsPotential(): SavingsPotential {
    return {
      energyCostSavings: 73,
      energyBalanceSavings: 95,
      co2TaxSavings: 100,
      amortizationYears: 13
    };
  }

  private initModernizationCosts(): ModernizationCosts {
    return {
      now: 146000,
      inTenYears: 238000,
      additionalCosts: 92000
    };
  }

  // Data fetching methods (currently return mock data)
  fetchAll(): void {
    this.fetchBuildingData();
    this.fetchConsumptionData();
    this.fetchRenovationMeasures();
    this.fetchRenovationPlan();
    this.fetchSavingsPotential();
    this.fetchModernizationCosts();
  }
  
  fetchBuildingData(): void {
    // For API: this.http.get<Building>(`${this.apiBaseUrl}/building`).subscribe(...)
    this.buildingSubject.next(this.initMockBuilding());
  }

  fetchConsumptionData(): void {
    // For API: this.http.get<ConsumptionData>(`${this.apiBaseUrl}/consumption`).subscribe(...)
    this.consumptionDataSubject.next(this.initMockConsumptionData());
  }

  fetchRenovationMeasures(): void {
    // For API: this.http.get<RenovationMeasure[]>(`${this.apiBaseUrl}/measures`).subscribe(...)
    this.renovationMeasuresSubject.next(this.initMockRenovationMeasures());
    this.initializeRenovationFunding();
  }

  fetchRenovationPlan(): void {
    // For API: this.http.get<RenovationPlan[]>(`${this.apiBaseUrl}/plan`).subscribe(...)
    this.renovationPlanSubject.next(this.initRenovationPlan());
  }

  fetchSavingsPotential(): void {
    // For API: this.http.get<SavingsPotential>(`${this.apiBaseUrl}/savings`).subscribe(...)
    this.savingsPotentialSubject.next(this.initSavingsPotential());
  }

  fetchModernizationCosts(): void {
    // For API: this.http.get<ModernizationCosts>(`${this.apiBaseUrl}/modernization`).subscribe(...)
    this.modernizationCostsSubject.next(this.initModernizationCosts());
  }

  // Methods to update data (with API calls in the future)
  updateBuildingData(building: Building): Observable<Building> {
    // For API: return this.http.put<Building>(`${this.apiBaseUrl}/building`, building);
    this.buildingSubject.next(building);
    return of(building);
  }

  updateConsumptionData(data: ConsumptionData): Observable<ConsumptionData> {
    // For API: return this.http.put<ConsumptionData>(`${this.apiBaseUrl}/consumption`, data);
    this.consumptionDataSubject.next(data);
    return of(data);
  }

  updateRenovationMeasures(measures: RenovationMeasure[]): Observable<RenovationMeasure[]> {
    // For API: return this.http.put<RenovationMeasure[]>(`${this.apiBaseUrl}/measures`, measures);
    this.renovationMeasuresSubject.next(measures);
    this.calculateTotals();
    return of(measures);
  }

  updateRenovationPlan(plan: RenovationPlan[]): Observable<RenovationPlan[]> {
    // For API: return this.http.put<RenovationPlan[]>(`${this.apiBaseUrl}/plan`, plan);
    this.renovationPlanSubject.next(plan);
    return of(plan);
  }


  initializeRenovationFunding(): void {
    const measures = this.renovationMeasuresSubject.getValue();
    const fixedFundingMeasures = ['Solarthermie', 'Heizung', 'Photovoltaik'];
    
    measures.forEach(measure => {
      if (!fixedFundingMeasures.includes(measure.type)) {
        // Calculate 20% of cost for funding
        measure.funding = Math.round(measure.cost * 0.20);
      }
    });
    
    this.renovationMeasuresSubject.next(measures);
    this.calculateTotals();
  }

  calculateTotals(): void {
    const measures = this.renovationMeasuresSubject.getValue();
    
    const totalCosts = measures.reduce((total, measure) => total + measure.cost, 0);
    
    const totalFunding = measures.reduce((total, measure) => {
      const fundingValue = typeof measure.funding === 'string' ? 0 : measure.funding;
      return total + fundingValue;
    }, 0);
    
    const totalSavings = measures.reduce((total, measure) => total + measure.savings, 0);
    
    this.totalCostsSubject.next(totalCosts);
    this.totalFundingSubject.next(totalFunding);
    this.totalSavingsSubject.next(totalSavings);
  }

  updateRenovationTotals(totals: { totalCosts: number; totalFunding: number; totalSavings: number }): void {
    this.totalCostsSubject.next(totals.totalCosts);
    this.totalFundingSubject.next(totals.totalFunding);
    this.totalSavingsSubject.next(totals.totalSavings);
  }

  // Building image methods
  setBuildingImage(imageUrl: string | null): void {
    this.buildingImageUrlSubject.next(imageUrl);
  }

  // Convenience methods to get current values synchronously
  getCurrentBuilding(): Building {
    return this.buildingSubject.getValue();
  }

  getCurrentConsumptionData(): ConsumptionData {
    return this.consumptionDataSubject.getValue();
  }

  getCurrentRenovationMeasures(): RenovationMeasure[] {
    return this.renovationMeasuresSubject.getValue();
  }

  getCurrentRenovationPlan(): RenovationPlan[] {
    return this.renovationPlanSubject.getValue();
  }

  getCurrentSavingsPotential(): SavingsPotential {
    return this.savingsPotentialSubject.getValue();
  }

  getCurrentModernizationCosts(): ModernizationCosts {
    return this.modernizationCostsSubject.getValue();
  }

  getCurrentTotalCosts(): number {
    return this.totalCostsSubject.getValue();
  }

  getCurrentTotalFunding(): number {
    return this.totalFundingSubject.getValue();
  }

  getCurrentTotalSavings(): number {
    return this.totalSavingsSubject.getValue();
  }

  getCurrentBuildingImageUrl(): string | null {
    return this.buildingImageUrlSubject.getValue();
  }
}
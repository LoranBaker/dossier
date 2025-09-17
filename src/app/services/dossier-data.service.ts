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
  private foerderboniMeasuresSubject = new BehaviorSubject<any[]>(this.initFoerderboniMeasures());

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
  foerderboniMeasures$ = this.foerderboniMeasuresSubject.asObservable();

  constructor(private http: HttpClient) {
    // Initialize calculated totals
    this.initializeRenovationFunding();
    this.calculateTotals();
    // NEW: sync plan with measures so timeline shows data
    this.syncRenovationPlanWithMeasures();
  }

  // Initialize mock data methods
  private initMockBuilding(): Building {
  return {
    address: 'Karlstrasse 22 in 65510 Hünstetten',
    buildingType: 'Einfamilienhaus',
    buildingYear: 1994,
    selfOccupied: 1,
    ownerStructure: 'Privat',
    selfUsedLivingSpace: 120,
    floors: 2,
    adjacentBuildings: false,
    units: {
      total: 4,
      commercial: 1
    },
    livingSpace: 399,
    baseArea: 147,
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
      form: 'verschiedene Dachtypen',
      usage: 'genutzt/beheizt',
      area: 190,
      orientation: {
        direction: 'SSO / ONO',
        area: {
          sso: 11.7,
          ono: 95.4
        }
      },
      skylights: 2,
      saniert: 'Saniert 1995-2002'
    },
    facade: {
      construction: 'Massiv',
      condition: 'solide',
      saniert: 'Saniert 1995-2002'
    },
    windows: {
      glazing: '2-fach',
      frameMaterial: 'Kunststoff',
      saniert: 'Saniert 1995-2002'
    },
    basement: {
      exists: true,
      heated: true,
      partialBasement: false,
      fullBasement: true,
      hasUndergroundGarage: false,
      isUndergroundGarageVentilated: true,
      isUndergroundGarageHeated: false,
      saniert: 'Saniert 1995-2002'
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
    ],
    // Add hazard classes data
    hazardClasses: [
      { name: 'Hochwassergefahrenklasse', level: 'gering' },
      { name: 'Starkregengefahrenklasse', level: 'gering' },
      { name: 'Hochwassergefahrenklasse (Sturmflut)', level: 'gering' },
      { name: 'Sturmgefahrenklasse', level: 'gering' },
      { name: 'Erdbebenrisikozonen', level: 'gering' },
      { name: 'Erdbewegungsrisikozonen', level: 'gering' },
      { name: 'Schneelastzone', level: 'gering' }
    ],
     valuation: {
      baupreisindex2025: 2192.4,
      minInsuranceValue1914: 20000,
      maxInsuranceValue1914: 30000,
      minInsuranceSum: 438480,
      maxInsuranceSum: 657720
    }
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
      type: 'Photovoltaik',
      description: 'vorher',
      description1: 'nachher',
      details: 'Keine Photovoltaik',
      details1:'Kristallines Modul (20 %)',
      cost: 19500,
      funding: 'Wird separat geprüft!',
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
      details1:'Lüftungsanlage dezentral mit Wärmerück- gewinnung',
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
    // {
    //   type: 'Dachgeschossdecke',
    //   description: 'vorher',
    //   description1: 'nachher',
    //   details: 'nicht saniert',
    //   details1:'nicht sanieren',
    //   cost: 17000,
    //   funding: 3400,
    //   savings: 0
    // },
    // {
    //   type: 'Dachfenster',
    //   description: 'vorher',
    //   description1: 'nachher',
    //   details: '2 und 3-fach Verglasung',
    //   details1:'nicht sanieren',
    //   cost: 1800,
    //   funding: 360,
    //   savings: 0
    // },
    //    {
    //   type: 'Förderboni',
    //   description: '',
    //   description1: '',
    //   details: '',
    //   details1:'iSFP-Bonus 5%',
    //   cost: 0,
    //   funding: 0,
    //   savings: 0
    // },
  ];
}

private initFoerderboniMeasures(): any[] {
  return [
    {
      type: 'Energieberatung',
      grundlage: '5% (iSFP-Fahrplan)',
      kosten: '1.500 €',
      zuschuss: '50% (max. 650 € EFH/ZFH; 850 € MFH)'
    },
    {
      type: 'Fachplanung & Baubegleitung',
      grundlage: 'BEG EM',
      kosten: '5.000 €',
      zuschuss: '50% (max. 5tsd € EFH/ZFH; 2tsd € pro WE)'
    },
    {
      type: 'Fachplanung & Baubegleitung',
      grundlage: 'BEG WG 261',
      kosten: '10.000 €',
      zuschuss: '50% (max. 10tsd € EFH/ZFH; 4tsd € pro WE)'
    },
    {
      type: 'ENVALPRO SERVICE',
      grundlage: 'Leistungen und Kostennoten sind separat aufgeführt',
      kosten: '3.000 €*',
      zuschuss: 'pauschal FULL-SERVICE SORGLOSPAKET'
    }
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
    // NEW: ensure plan reflects measures after fetching
    this.syncRenovationPlanWithMeasures();
  }

    getCurrentFoerderboniMeasures(): any[] {
    return this.foerderboniMeasuresSubject.getValue();
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
    // NEW: keep renovation plan in sync when measures change
    this.syncRenovationPlanWithMeasures();
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

  // NEW: helper to get cost by measure type
  private getMeasureCost(type: string): number {
    const m = this.renovationMeasuresSubject.getValue().find(mm => mm.type === type);
    return m ? (typeof m.cost === 'number' ? m.cost : 0) : 0;
  }

  // NEW: synchronize renovation plan with current measures so that timeline displays them
  private syncRenovationPlanWithMeasures(): void {
    const excluded = ['Hydraulischer Abgleich','Neue Heizkreispumpe','Voraussetzung bei Heizungstausch','Förderboni'];
    const measures = this.renovationMeasuresSubject.getValue();
    let plan = [...this.renovationPlanSubject.getValue()];

    // Ensure plan exists
    if (!plan || plan.length === 0) {
      plan = this.initRenovationPlan();
    }

    // Current assigned measure set
    const assigned = new Set(plan.flatMap(p => p.measures));

    // Filter measures we want to assign
    const assignable = measures
      .filter(m => !excluded.includes(m.type))
      .map(m => m.type);

    // Remove orphaned measures (no longer present in measures list)
    plan.forEach(p => {
      p.measures = p.measures.filter(t => assignable.includes(t));
    });

    // Find which assignable measures are missing
    const missing = assignable.filter(t => !assigned.has(t));

    // Distribute missing measures round-robin across years for a more even initial layout
    missing.forEach((type, idx) => {
      const targetPlan = plan[idx % plan.length];
      if (!targetPlan.measures.includes(type)) {
        targetPlan.measures.push(type);
      }
    });

    // Recalculate investment per year based on current measures & their latest costs
    plan.forEach(p => {
      p.investment = p.measures.reduce((sum, t) => sum + this.getMeasureCost(t), 0);
    });

    // Emit updated plan only if something changed (simple always update for now)
    this.renovationPlanSubject.next(plan);
  }
}
export interface HazardClass {
  name: string;
  level: 'gering' | 'mittel' | 'hoch';
}

export interface BuildingValuation {
  baupreisindex2025: number;
  minInsuranceValue1914: number; // in Mark
  maxInsuranceValue1914: number; // in Mark
  minInsuranceSum: number; // in €
  maxInsuranceSum: number; // in €
}

export type SaniertPeriod = 
  | 'Saniert 1969-1978'
  | 'Saniert 1979-1983'
  | 'Saniert 1984-1994'
  | 'Saniert 1995-2002'
  | 'Saniert 2003-2009'
  | 'Saniert 2010-2016'
  | 'Saniert ab 2017 bis heute'
  | 'Nicht saniert';

// models/building.model.ts
export interface Building {
    address: string;
    buildingType: string;
    buildingYear: number;
    selfOccupied: number;
    ownerStructure: string;
    selfUsedLivingSpace: number;
    floors: number;
    adjacentBuildings: boolean;
    units: {
      total: number;
      commercial: number;
    };
    livingSpace: number;
    baseArea: number;
    additionalConstruction: boolean;
    commercialSpace: number;
    plotSize: number;
    residents: number;
    heating: {
      type: string;
      surfaces: string;
      renovationYear: number | null;
      insulatedPipes: boolean;
    };
    hotWater: {
      source: string;
      renovationYear: number | null;
    };
    roof: {
      form: string;
      usage: string;
      area: number;
      orientation: {
        direction: string;
        area: {
          sso: number;
          ono: number;
        };
      };
      skylights: number;
      saniert?: SaniertPeriod; // New property for renovation period
    };
    facade: {
      construction: string;
      condition: string;
      saniert?: SaniertPeriod;
    };
    windows: {
      glazing: string;
      frameMaterial: string;
      saniert?: SaniertPeriod;

    };
    basement: {
      exists: boolean;
      heated: boolean;
      partialBasement: boolean;
      fullBasement: boolean;
      hasUndergroundGarage: boolean;
      isUndergroundGarageVentilated: boolean;
      isUndergroundGarageHeated: boolean;
      saniert?: SaniertPeriod;
    };
    photovoltaic: {
      installed: boolean;
      panelArea: number;
      power: number;
      panelCount: number;
    };
    consumption: {
      electricity: string;
      heating: string;
      hotWater: string;
      heizungsverbrauch: string;
    };
    renovations: Array<{
      type: string;
      quantity: string;
      year: number;
    }>;
      hazardClasses: HazardClass[];
      valuation?: BuildingValuation;
  }

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
    retrofittedInsulation: boolean;
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
    };
    facade: {
      construction: string;
      condition: string;
    };
    windows: {
      glazing: string;
      frameMaterial: string;
    };
    basement: {
      exists: boolean;
      heated: boolean;
      partialBasement: boolean;
      fullBasement: boolean;
      hasUndergroundGarage: boolean;
      isUndergroundGarageVentilated: boolean;
      isUndergroundGarageHeated: boolean;
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
    };
    renovations: Array<{
      type: string;
      quantity: string;
      year: number;
    }>;
  }
import { Component, Inject, PLATFORM_ID, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { isPlatformBrowser } from '@angular/common';
import mapboxgl from 'mapbox-gl';

interface Benefit {
  text: string;
  checked: boolean;
}

@Component({
  selector: 'app-modernization-planning',
  templateUrl: './modernization-planning.component.html',
  imports: [CommonModule],
  styleUrls: ['./modernization-planning.component.scss']
})
export class ModernizationPlanningComponent implements AfterViewInit {
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;
  
  benefits: Benefit[] = [
    {
      text: "Unabhängige Angebotseinholung – Wir holen unverbindlich Kostenvoranschläge von Firmen im Umkreis von 100 km ein.",
      checked: true
    },
    {
      text: "Transparenter Vergleich – Sie erhalten eine Übersicht mit Preisen, Leistungen und Bewertungen zur einfachen Auswahl.",
      checked: true
    },
    {
      text: "Fördermittelprüfung – Wir prüfen, ob Ihr Angebot förderfähig ist.",
      checked: true
    }
  ];

  isBrowser: boolean;
  map!: mapboxgl.Map;
  address: string = 'KARLSTRASSE 22 IN 65510 HÜNSTETTEN'; 

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngAfterViewInit(): void {
    if (this.isBrowser) {
      // Wait a bit for DOM to be ready
      setTimeout(() => {
        this.initializeMap();
      }, 500);
    }
  }

  trackByIndex(index: number, item: Benefit): number {
    return index;
  }

  private async initializeMap(): Promise<void> {
  try {
     mapboxgl.accessToken = 'pk.eyJ1Ijoicm9vb290MjMiLCJhIjoiY202ZjN5ZG9sMDE5YTJrcjh1MGQ3ZnU2bCJ9.-rcm9jyWz8jB0gukAvjHnQ'; 
    
    if (!this.mapContainer || !this.mapContainer.nativeElement) {
      console.error('Map container not found');
      return;
    }

    const coordinates = await this.geocodeAddress(this.address);
    
    // Initialize the map with preserveDrawingBuffer: true for PDF capture
    this.map = new mapboxgl.Map({
      container: this.mapContainer.nativeElement,
      style: 'mapbox://styles/mapbox/light-v11',
      center: coordinates,
      zoom: 10,
      interactive: false,
      attributionControl: false,
      logoPosition: 'bottom-left',
      // CRITICAL: This enables PDF capture
      preserveDrawingBuffer: true,
      antialias: true
    });

    this.map.on('load', () => {
      this.addRadiusCircle(coordinates);
    });

  } catch (error) {
    console.error('Error initializing map:', error);
  }
}

  private async geocodeAddress(address: string): Promise<[number, number]> {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${mapboxgl.accessToken}&country=de&limit=1`
      );
      
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        return [lng, lat];
      } else {
        console.warn('No results found for address:', address);
        // Return Berlin coordinates as fallback
        return [13.405, 52.52];
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      // Return Berlin coordinates as fallback
      return [13.405, 52.52];
    }
  }

  private addRadiusCircle(center: [number, number]): void {
    // Create a circle with 100km radius
    const radiusInKm = 100;
    const radiusInMeters = radiusInKm * 1000;
    
    // Create circle using Turf.js-like approach (simple version)
    const circlePoints = this.createCircle(center, radiusInMeters);

    // Add the circle as a data source
    this.map.addSource('radius-circle', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Polygon',
          coordinates: [circlePoints]
        }
      }
    });

    // Add the circle fill layer
    this.map.addLayer({
      id: 'radius-fill',
      type: 'fill',
      source: 'radius-circle',
      paint: {
        'fill-color': '#34C759',
        'fill-opacity': 0.1
      }
    });

    // Add the circle border layer
    this.map.addLayer({
      id: 'radius-border',
      type: 'line',
      source: 'radius-circle',
      paint: {
        'line-color': '#34C759',
        'line-width': 3,
        'line-opacity': 0.6
      }
    });
  }

  private createCircle(center: [number, number], radiusInMeters: number): [number, number][] {
    const points: [number, number][] = [];
    const earthRadius = 6378137; // Earth's radius in meters
    const lat = (center[1] * Math.PI) / 180;
    const lng = (center[0] * Math.PI) / 180;
    const d = radiusInMeters / earthRadius;

    for (let i = 0; i <= 360; i += 10) {
      const bearing = (i * Math.PI) / 180;
      
      const lat2 = Math.asin(
        Math.sin(lat) * Math.cos(d) + Math.cos(lat) * Math.sin(d) * Math.cos(bearing)
      );
      
      const lng2 = lng + Math.atan2(
        Math.sin(bearing) * Math.sin(d) * Math.cos(lat),
        Math.cos(d) - Math.sin(lat) * Math.sin(lat2)
      );

      points.push([
        (lng2 * 180) / Math.PI,
        (lat2 * 180) / Math.PI
      ]);
    }

    return points;
  }
}
import { Component, AfterViewInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { isPlatformBrowser } from '@angular/common';

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

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngAfterViewInit(): void {
    if (this.isBrowser) {
      setTimeout(() => {
        import('leaflet').then(L => {
          this.initMap(L);
        }).catch(err => {
          console.error('Failed to load Leaflet:', err);
        });
      }, 0);
    }
  }

  private initMap(L: any): void {
    const mapContainer = document.getElementById('service-map');
    if (!mapContainer) {
      console.error('Map container not found');
      return;
    }

    const map = L.map('service-map', {
      center: [52.52, 13.405], // Berlin, Germany
      zoom: 8,
      zoomControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      touchZoom: false
    });

    // Custom tile layer with better styling
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
      className: 'map-tiles'
    }).addTo(map);

    // Service radius circle with enhanced styling
    L.circle([52.52, 13.405], {
      radius: 100000, // 100km
      color: '#007AFF',
      fillColor: '#007AFF',
      fillOpacity: 0.08,
      weight: 2,
      opacity: 0.6,
      dashArray: '8, 4'
    }).addTo(map);

    // Add subtle map styling
    const style = document.createElement('style');
    style.textContent = `
      .map-tiles {
        filter: saturate(0.8) brightness(1.1) contrast(0.9);
      }
    `;
    document.head.appendChild(style);
  }

  trackByIndex(index: number, item: Benefit): number {
    return index;
  }
}
import { Component, Inject, PLATFORM_ID } from '@angular/core';
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
export class ModernizationPlanningComponent {
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
  staticMapUrl: string;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    
    // Use the working path from your console logs
    this.staticMapUrl = 'map-image/image.png';
  }

  trackByIndex(index: number, item: Benefit): number {
    return index;
  }

  // Handle image loading errors (fallback to free map)
  onImageError(event: any): void {
    console.warn('Local image failed to load, using fallback map');
    this.staticMapUrl = 'https://maps.wikimedia.org/img/osm-intl,2/8/52.52/13.405/450x450.png';
  }

  // Handle successful image loading
  onImageLoad(): void {
    console.log('Map image loaded successfully');
  }
}
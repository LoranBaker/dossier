// consultation-cta.component.ts
import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

interface ServiceDetail {
  title: string;
  items: string[];
}

interface ServiceStep {
  number: number;
  title: string;
  color: string;
  details: ServiceDetail;
}

@Component({
  selector: 'app-consultation-cta',
  templateUrl: './consultation-cta.component.html',
  imports: [CommonModule],
  styleUrls: ['./consultation-cta.component.scss']
})
export class ConsultationCtaComponent {
  @ViewChild('serviceStepsContainer', { static: false }) serviceStepsContainer!: ElementRef;

  serviceSteps: ServiceStep[] = [
    {
      number: 1,
      title: 'Finanzierungsmanagement',
      color: '#007AFF',
      details: {
        title: 'Finanzierungsmanagement',
        items: [
          'Modernisierungskreditberatung',
          'Bankenauswahl',
          'Kreditanträge',
          'Kreditbegleitung'
        ]
      }
    },
    {
      number: 2,
      title: 'Handwerkermanagement',
      color: '#34C759',
      details: {
        title: 'Handwerkermanagement',
        items: [
          'Handwerkerauswahl',
          'Handwerker AP bei Fragen',
          'Preisverhandlung und Abstimmung'
        ]
      }
    },
    {
      number: 3,
      title: 'Förderservice',
      color: '#FF9500',
      details: {
        title: 'Förderservice-Management',
        items: [
          'Förderungssuche',
          'Förderungsauswahl',
          'Förderungsantrag und Einreichung',
          'Förderungsbegleitung'
        ]
      }
    },
    {
      number: 4,
      title: 'Energiemanagement',
      color: '#AF52DE',
      details: {
        title: 'Energiemanagement',
        items: [
          'Empfehlungen Energieeinsparungen',
          'Kältebrücken erkennen',
          'iSFP-Fahrplan erstellen'
        ]
      }
    },
    {
      number: 5,
      title: 'Baubegleitungsmanagement',
      color: '#FF2D92',
      details: {
        title: 'Baubegleitungsmanagement',
        items: [
          'Überwachung Budget und Zeitabschnitte',
          'Monitoring der Kosten und Zeitvorgaben',
          'Ein Ansprechpartner für gesamten Vorgang',
          'Maßnahmenumsetzung von der Planung bis zur Sanierung'
        ]
      }
    },
    {
      number: 6,
      title: 'Opt. Versicherungsschutz',
      color: '#5AC8FA',
      details: {
        title: 'Versicherungsanpassung und Einsparungen bei Gebäudeversicherung',
        items: [
          'Abstimmung mit Versicherung bzgl. Versicherungsschutz Höhe (Unter-/Überdeckung)',
          'Suche beste Angebote und Anpassung der Versicherungssumme'
        ]
      }
    },
    {
      number: 7,
      title: 'Effektive Investitionen',
      color: '#FFCC00',
      details: {
        title: 'Effektive Investition in Maßnahmen mit maximalem Wertzuwachs',
        items: [
          'Sofortige Einblicke in die wirtschaftlichen und nachhaltigen Auswirkungen potentieller ESG-Maßnahmen auf Ihre Immobilie',
          'Bewertung und Auswahl von Sanierungsmaßnahmen nach ökologischen und wirtschaftlichen Kriterien',
          'Fundierte Entscheidungen unter Berücksichtigung von Förderungen, Mietsteigerungen und Kosteneinsparungen bei der CO₂-Steuer für jede Modernisierungsmaßnahme'
        ]
      }
    },
    {
      number: 8,
      title: 'Immobilien-Szenarioanalyse',
      color: '#FF453A',
      details: {
        title: 'Immobilien-Analyse mit dem Modernisierungsrechner',
        items: [
          'Risikobewertung (CRREM-Pfad) und Prüfung der Taxonomie-Konformität',
          'Stranding-Zeitpunkt und die Energieeffizienz Ihrer Assets auf einem Blick',
          'Bestimmung der Energie- und Emissionsbilanz Ihrer Assets mit minimalen Datenpunkten'
        ]
      }
    }
  ];

  getTooltipClass(index: number, totalSteps: number): string {
  // For first row (steps 1-5)
  if (index < 5) {
    if (index === 0) return 'step-tooltip-left'; // First step
    if (index === 4) return 'step-tooltip-right'; // Last step in first row
  }
  // For second row (steps 6-8)
  else {
    const secondRowIndex = index - 5;
    if (secondRowIndex === 0) return 'step-tooltip-left'; // First step in second row
    if (secondRowIndex === 2) return 'step-tooltip-right'; // Last step in second row
  }
  
  return ''; // Center positioning for middle steps
}

  // TrackBy function for better performance
  trackByIndex(index: number, item: ServiceStep): number {
  return index;
}

  onConsultationClick(): void {
    // Handle consultation request
    console.log('Consultation requested');
    // You can add your logic here (e.g., open modal, navigate, etc.)
  }
}

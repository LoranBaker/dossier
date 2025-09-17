// general-info.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface InfoSection {
  title: string;
  content: string[];
}

@Component({
  selector: 'app-general-info',
  templateUrl: './general-info.component.html',
  imports: [CommonModule],
  styleUrls: ['./general-info.component.scss']
})
export class GeneralInfoComponent {
  infoSections: InfoSection[] = [
    {
      title: 'Allgemeine Hinweise:',
      content: [
        'Förderfähige Sanierungsmaßnahmen erfordern eventuell Baubegleitung durch Energieeffizienzexperten/innen. Diese unterstützen Sie ggf. auch bei der Beantragung der Fördermittel. Die tatsächlich anfallenden Kosten variieren je nach Auftragsumfang und können ggf. im Rahmen einer Förderung anteilig bezuschusst werden.',
        'Ausgewiesene Energieverbräuche, -kosten und -kosteneinsparungen sowie die Eingruppierung in eine Energieklasse basieren auf Ihren Angaben bzw. wurden errechnet mit Bedarfswerten eines vergleichbaren Haushalts anhand von Ihren Gebäudeeigenschaften und Gebäudetypologien. Wegen individuellem Nutzungsverhalten und sich ändernder Energiepreise können die tatsächlichen Kosten von den ausgewiesenen abweichen. Die Kosten werden mit Hilfe der Kostenabellen, zusammengestellt, ermittelt und beinhalten sowohl Material- als auch Arbeitskosten. Durch die regionalen Unterschiede können tatsächliche Angebote signifikant von den ausgewiesenen Kosten abweichen.',
        'Ausgewiesene Einsparungen geben mögliche Energieeinsparungen bei Durchführung der Modernisierungsmaßnahme wieder. Diese wurden bestimmt auf Ihren Gebäudeeigenschaften und errechnetem Werten aus Gebäudeeigenschaften ermittelt. Es wurden keine Energiepreiserhöhungen eingerechnet. Wegen individuellem Nutzungsverhalten und sich ändernder Energiepreise können die tatsächlichen Einsparungen erheblich von den ausgewiesenen abweichen.',
        'Im Rahmen des gegenständlichen Modernisierungs-Checks („Modernisierungs-Check") angegebene Kosten- und Preisindikationen sowie Einsparpotentiale und die damit verbundene mögliche neue Energieklasse stellen lediglich eine unverbindliche Schätzung dar; die tatsächlichen Kosten und Preise bzw. Einsparpotentiale sowie die ermittelte Energieklasse können davon abweichen.',
        'Der Modernisierungs-Check ist nicht mit einer Beantragung von Fördermitteln verbunden. Der Modernisierungs-Check stellt keine abschließende Berechnung über das Vorliegen der Fördervoraussetzungen nach Maßgabe der einschlägigen Förderbestimmungen (siehe dazu KfW-Programmblätter), kein Angebot und auch keine sonstige rechtsverbindliche Zusage dar; der Modernisierungs-Check begründet insbesondere keinen Rechtsanspruch auf eine Förderung.',
        'Der Modernisierungs-Check dient ausschließlich dazu, einen etwaigen Antrag auf Förderung vom Kunden - je nach Programm - entweder über einen bei der KfW akkreditierten Finanzierungspartner oder - für die Inanspruchnahme eines Zuschusses - vom Kunden direkt im KfW-Zuschussportal oder beim BAFA zu stellen. Der den Modernisierungs-Check nutzende Finanzierungspartner wird durch den Modernisierungs-Check nicht zu einer Begleitung des Kundenvorhabens und insbesondere nicht zu einer entsprechenden Beantragung von Fördermitteln für das Kundenvorhaben verpflichtet.',
        'Der Sanierungsrechner und dieses Dossier „Ihre persönliche Gebäudeanalyse" stellen weder eine Fachberatung durch einen Fachbetrieb, eine weitergehende Energieberatung durch Sachverständige noch die Erstellung eines öffentlich-rechtlich anerkannten Energieausweises dar und sollen dies auch nicht ersetzen.'
      ]
    },
    {
      title: 'Was bietet ENVALPRO?',
      content: [
        'Der interessierte Hausbesitzer kann sich einen schnellen Überblick verschaffen, wie eine energetische Verbesserung am Haus vorgenommen werden kann. ENVALPRO führt Sie auf spielerische Weise in die Thematik ein. Der abschließende ENVALPRO-Bericht kann als Basis für das Gespräch mit dem Planer & Architekten eingesetzt werden. Sie sind optimal vorbereitet für ein anstehendes Sanierungsprojekt.'
      ]
    },
    {
      title: 'Berechnungsmodell',
      content: [
        'Die vom Anwender eingegebenen Gebäudemaße und -eigenschaften haben Einfluss auf den Energiebedarf. Damit werden auch ungefähre Dämmstärken (Wand, Dach, Keller etc.) verbucht. Die daraus berechnete Energiekennzahl zeigt die aktuelle Bewertung Ihres Gebäudes. Diese Angaben beruhen auf ungefähren Richtwerten und können von ihren wirklichen Werten abweichen. Auf dieser Basis wird die Wirkung der verschiedenen Sanierungsmaßnahmen ermittelt.'
      ]
    },
    {
      title: 'Investitionen & Fördergelder',
      content: [
        'Die Investitionen und die Fördergelder werden auf Grund der simulierten Sanierungen aufgerechnet. Die eingesetzten Preise verstehen sich als Richtpreise und müssen zusammen mit Ihrem Planer nochmals konkret nachkalkuliert werden.'
      ]
    },
    {
      title: 'Grenzen von ENVALPRO',
      content: [
        'ENVALPRO ist ein Werkzeug für eine grobe Vorkalkulation von Sanierungsmaßnahmen. ENVALPRO versteht sich nicht als Planungsinstrument. Die eigentliche Planung & Realisierung erfolgt zusammen mit Fachleuten (Energieeffizienzberater, Planer & Architekten, Kreditvermittlern, Handwerkern, Fachunternehmen, Bauformen etc.). Alle Werte sind ca.-Werte, die Berechnung und Kalkulation basieren auf Algorithmen nach aktuellsten Planungen, welche aufgrund der Individualität von Immobilien und Bauweisen nachträglich und individuell vor Ort nachvollziehbar geprüft und beurteilt werden müssen. Eine Haftung kann aufgrund der unzähligen Faktoren von uns mit diesem Sanierungskonzept nicht übernommen werden.'
      ]
    }
  ];

  // TrackBy function for info sections
  trackBySectionIndex(index: number, item: InfoSection): number {
    return index;
  }

  // TrackBy function for paragraphs
  trackByParagraphIndex(index: number, item: string): number {
    return index;
  }
}
// Modified analysis-tab.component.ts
import { Component, Input, OnChanges, SimpleChanges, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-analysis-tab',
  templateUrl: './analysis-tab.component.html',
  styleUrls: ['./analysis-tab.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class AnalysisTabComponent implements OnChanges, AfterViewInit {
  @Input() totalRenovationCosts: number = 0;
  @ViewChild('mehrkostenBar', { static: false }) mehrkostenBarRef!: ElementRef;
  
  // Tooltip state for hover tooltips
  showTooltip: boolean = false;
  tooltipData: any = null;
  tooltipPosition: { x: number, y: number } = { x: 0, y: 0 };
  
  // Always visible tooltip state for mehrkosten bar
  showMehrkostenTooltip: boolean = false;
  mehrkostenTooltipData: any = null;
  mehrkostenTooltipPosition: { x: number, y: number } = { x: 0, y: 0 };

  constructor() { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['totalRenovationCosts']) {
      console.log('Analysis tab received total costs:', this.totalRenovationCosts);
      // Update mehrkosten tooltip when costs change
      this.updateMehrkostenTooltip();
    }
  }

  ngAfterViewInit(): void {
    // Position the always-visible tooltip after view init
    setTimeout(() => {
      this.positionMehrkostenTooltip();
      this.updateMehrkostenTooltip();
    }, 100);
  }

  // Calculate cost in 10 years with 5% annual increase
  get costIn10Years(): number {
    if (this.totalRenovationCosts === 0) return 0;
    return Math.round(this.totalRenovationCosts * Math.pow(1.05, 10));
  }

  // Calculate additional cost
  get additionalCost(): number {
    return this.costIn10Years - this.totalRenovationCosts;
  }

  // Format currency for display
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }

  getTooltipData(type: string) {
    const data = {
      heute: {
        title: 'Heutiger Wert',
        value: this.formatCurrency(this.totalRenovationCosts),
        description: 'Würden Sie es heute modernisieren, müssten Sie zahlen',
        subtitle: 'Aktuelle Marktpreise',
        color: '#1976D2'
      },
      future: {
        title: 'Prognose in 10 Jahren',
        value: this.formatCurrency(this.costIn10Years),
        description: 'Würden Sie es in 10 Jahren modernisieren, müssten Sie zahlen (5% Kostensteigerung p.a.)',
        subtitle: 'Bei jährlicher Inflation',
        color: '#1976D2'
      },
      additional: {
        title: 'Mehrkosten in 10 Jahren',
        value: this.formatCurrency(this.additionalCost) + '*',
        description: 'Würden Sie in 10 Jahren unnötigerweise mehr zahlen (5% Kostensteigerung p.a.)!',
        subtitle: '* ohne Wertverlust Ihrer Immobilie',
        color: '#D32F2F'
      }
    };
    return data[type as keyof typeof data];
  }

  // Regular tooltip methods (for hover tooltips on other bars)
  onBarHover(event: MouseEvent, type: string): void {
    // Don't show hover tooltip for mehrkosten bar since it has always-visible one
    if (type === 'additional') return;
    
    this.tooltipData = this.getTooltipData(type);
    this.updateTooltipPosition(event);
    this.showTooltip = true;
  }

  onBarMouseMove(event: MouseEvent): void {
    if (this.showTooltip) {
      this.updateTooltipPosition(event);
    }
  }

  onBarLeave(): void {
    this.showTooltip = false;
    this.tooltipData = null;
  }

  private updateTooltipPosition(event: MouseEvent): void {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.tooltipPosition = {
      x: event.clientX,
      y: event.clientY - 120
    };
  }

  // Methods for always-visible mehrkosten tooltip
  private updateMehrkostenTooltip(): void {
    this.mehrkostenTooltipData = this.getTooltipData('additional');
    this.showMehrkostenTooltip = true;
  }

private positionMehrkostenTooltip(): void {
  if (this.mehrkostenBarRef) {
    const barRect = this.mehrkostenBarRef.nativeElement.getBoundingClientRect();
    this.mehrkostenTooltipPosition = {
      x: barRect.right + 50, // Position to the right of the bar
      y: barRect.bottom + 680 // Position below the bar with small gap
    };
  }
}

  // Optional: Reposition tooltip on window resize
  onWindowResize(): void {
    this.positionMehrkostenTooltip();
  }
}
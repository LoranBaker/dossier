// print.service.ts
import { Injectable } from '@angular/core';
import { ModelScreenshot } from '@app/components/simple3d-model/simple3d-model.component';

@Injectable({
  providedIn: 'root'
})
export class PrintService {
  private screenshots: ModelScreenshot[] = [];

// CSS files mapping - For files in public/print-styles/
private cssFiles = {
  shared: 'print-styles/shared-print.css',
  buildingData: 'print-styles/building-data.print.css',
  overview: 'print-styles/overview.print.css',
  consumption: 'print-styles/consumption.print.css',
  analysis: 'print-styles/analysis.print.css',
  renovation: 'print-styles/renovation.print.css',
  timeline: 'print-styles/timeline.print.css',
  targetAnalysis: 'print-styles/target-analysis.print.css',
  financialPotential: 'print-styles/financial-potential.print.css',
  renovationResults: 'print-styles/renovation-results.print.css',
  financialBenefits: 'print-styles/financial-benefits.print.css',
  financingCalculator: 'print-styles/financing-calculator.print.css',
  summary: 'print-styles/summary.print.css',
  modernizationPlanning: 'print-styles/modernization-planning.print.css',
  consultationCta: 'print-styles/consultation-cta.print.css',
  generalInfo: 'print-styles/general-info.print.css',
  screenshots: 'print-styles/screenshots.print.css'
};

  /**
   * Shows print settings instructions to user
   */
  private showPrintInstructions(): boolean {
    const browserName = this.getBrowserName();
    let instructions = '';
    
    switch (browserName) {
      case 'chrome':
        instructions = `Für PDF ohne Kopf-/Fußzeilen:

1. Im Druckdialog auf "Weitere Optionen" klicken
2. "Kopf- und Fußzeilen" DEAKTIVIEREN
3. Optional: Nur "Seitenzahlen" aktivieren

Möchten Sie fortfahren?`;
        break;
        
      case 'firefox':
        instructions = `Für PDF ohne Kopf-/Fußzeilen:

1. Im Druckdialog "Seite einrichten..." wählen
2. Reiter "Ränder & Kopf-/Fußzeilen"
3. Alle Kopf-/Fußzeilen auf "Leer" setzen
4. Optional: Eine Position auf "--#--" für Seitenzahlen setzen

Möchten Sie fortfahren?`;
        break;
        
      case 'safari':
        instructions = `Für PDF ohne Kopf-/Fußzeilen:

1. Im Druckdialog "Details einblenden" klicken
2. "Safari" Dropdown-Menü wählen
3. "Kopf- und Fußzeile drucken" DEAKTIVIEREN

Möchten Sie fortfahren?`;
        break;
        
      case 'edge':
        instructions = `Für PDF ohne Kopf-/Fußzeilen:

1. Im Druckdialog auf "Weitere Einstellungen" klicken
2. "Kopf- und Fußzeilen" DEAKTIVIEREN
3. Optional: Nur "Seitenzahlen" aktivieren

Möchten Sie fortfahren?`;
        break;
        
      default:
        instructions = `Für PDF ohne Kopf-/Fußzeilen:

1. Im Druckdialog "Weitere Einstellungen" suchen
2. "Kopf- und Fußzeilen" DEAKTIVIEREN
3. Optional: Nur "Seitenzahlen" aktivieren

Möchten Sie fortfahren?`;
    }
    
    return confirm(instructions);
  }

  /**
   * Detects browser name for specific instructions
   */
  private getBrowserName(): string {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
      return 'chrome';
    } else if (userAgent.includes('firefox')) {
      return 'firefox';
    } else if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
      return 'safari';
    } else if (userAgent.includes('edg')) {
      return 'edge';
    }
    
    return 'unknown';
  }

  /**
   * Prints the complete dossier with all tab contents
   */
  async printDossier(
  building: any,
  setActiveTab: (tab: string) => void,
  getCurrentActiveTab: () => string
): Promise<void> {
  // Call the new method with 'kunde' as default
  return this.printDossierWithType(building, setActiveTab, getCurrentActiveTab, 'kunde');
}

   setScreenshots(screenshots: ModelScreenshot[]): void {
    this.screenshots = screenshots;
  }
/**
 * Prints the complete dossier with specific print type and CSS files
 */
async printDossierWithType(
  building: any,
  setActiveTab: (tab: string) => void,
  getCurrentActiveTab: () => string,
  printType: 'kunde' | 'lv' | 'bank'
): Promise<void> {
  
  // Show print instructions and get user confirmation
  if (!this.showPrintInstructions()) {
    return; // User cancelled
  }
  
  // Create print window IMMEDIATELY after user interaction to avoid popup blocker
  const printWindow = window.open('', '_blank', 'width=800,height=600');
  if (!printWindow) {
    alert('Pop-up-Blocker verhindert das Drucken. Bitte erlauben Sie Pop-ups für diese Seite.');
    return;
  }
  
  // Store current active tab
  const currentTab = getCurrentActiveTab();
  
  try {
    // Create print container
    const printContainer = document.createElement('div');
    printContainer.className = 'print-container';
    
    // Get the header and building image
    const header = document.querySelector('.dossier-header')?.cloneNode(true) as HTMLElement;
    const buildingImage = document.querySelector('.building-image')?.cloneNode(true) as HTMLElement;
    
    if (header) {
      // Remove edit elements from header
      const editElements = header.querySelectorAll('.edit-controls, .action-buttons');
        editElements.forEach(el => el.remove());
        
        // Remove address, URL, date, and time from header - keep only logo and title
        this.cleanHeaderFooter(header);
        printContainer.appendChild(header);
      }
    if (this.screenshots && this.screenshots.length > 0) {
this.addScreenshotsToFirstPage(printContainer);
}
    if (buildingImage) {
      // Remove upload controls from building image
      const uploadElements = buildingImage.querySelectorAll('.image-remove-btn, .upload-container');
      uploadElements.forEach(el => el.remove());
      printContainer.appendChild(buildingImage);
    }
    
    // Define sections for each print type
const sectionsByType = {
  kunde: [
    { tab: 'overview', title: 'Übersicht' },
    { tab: 'buildingData', title: 'Gebäudedaten' },
    { tab: 'consumption', title: 'Verbrauch & ESG' },
    { tab: 'analysis', title: 'Bestandsanalyse' },
    { tab: 'renovation', title: 'Sanierungsmaßnahmen' },
    { tab: 'timeline', title: 'iSFP-Fahrplan' },
    { tab: 'targetAnalysis', title: 'Analyse des Zielzustandes' },
    { tab: 'financialPotential', title: 'Finanzielles Potential' },
    { tab: 'renovationResults', title: 'Ergebnisse Sanierung' },
    { tab: 'financialBenefits', title: 'Finanzielle Vorteile' },
    { tab: 'financingCalculator', title: 'Finanzierungsrechner' },
    { tab: 'summary', title: 'Zusammenfassung' },
    { tab: 'modernizationPlanning', title: 'Modernisierungsplanung' },
    { tab: 'consultationCta', title: 'Beratung' },
    { tab: 'generalInfo', title: 'Allgemeine Hinweise' }
  ],
  lv: [
    // Only screenshots will be printed (no tab sections)
  ],
  bank: [
    { tab: 'renovation', title: 'Sanierungsmaßnahmen' },
    { tab: 'financialPotential', title: 'Finanzielles Potential' },
    { tab: 'renovationResults', title: 'Ergebnisse Sanierung' },
    { tab: 'financingCalculator', title: 'Finanzierungsrechner' },
    { tab: 'generalInfo', title: 'Allgemeine Hinweise' }
  ]
};

// Get sections for the specific print type
const sections = sectionsByType[printType];
    
    // Render each section by temporarily switching tabs
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      
      // Switch to the tab to render the component
      setActiveTab(section.tab);
      
      // Wait for Angular to render the component
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Get the rendered content
      const tabContent = document.querySelector('.tab-content');
      if (tabContent) {
        const sectionContainer = document.createElement('div');
        let sectionClass = 'print-section-container';
        
        // Add special class for single-page optimization
        if (['modernizationPlanning', 'consultationCta', 'generalInfo'].includes(section.tab)) {
          sectionContainer.classList.add('single-page-optimized');
        }
        
        // Add section-specific classes to prevent blank pages
        if (section.tab === 'analysis') {
          sectionContainer.classList.add('analysis-section');
        }
        if (section.tab === 'financialPotential') {
          sectionContainer.classList.add('financial-potential-section');
        }
        if (section.tab === 'summary') {
          sectionContainer.classList.add('summary-section');
        }
        
        // Skip forced page breaks for problematic sections
        if (['analysis', 'financialPotential'].includes(section.tab)) {
          sectionClass += ' force-new-page';
        } else if (section.tab === 'summary') {
          sectionClass += ' summary-no-break'; // Special class for summary
        } else {
          sectionClass += ' with-page-break';
        }

        sectionContainer.className = sectionClass;
        
        // Add section title (skip for specific components that handle their own titles)
        if (!['modernizationPlanning', 'consultationCta', 'generalInfo', 'summary'].includes(section.tab)) {
          const titleElement = document.createElement('h1');
          titleElement.className = 'print-section-title';
          titleElement.textContent = section.title;
          sectionContainer.appendChild(titleElement);
        }
        // Clone the content and clean it up
        const clonedContent = tabContent.cloneNode(true) as HTMLElement;
        
        // Remove interactive elements and empty content
        this.cleanupContent(clonedContent);
        
        // Optimize content for print
        this.optimizeContentForPrint(clonedContent);
        
        // Only add section if it has actual content
        const hasContent = clonedContent.textContent?.trim().length || 0;
        if (hasContent > 50) {
          sectionContainer.appendChild(clonedContent);
          printContainer.appendChild(sectionContainer);
        }
      }
    }
    
    // Restore original tab
    setActiveTab(currentTab);
    
    // Add footer (cleaned)
    const footer = document.querySelector('.dossier-footer')?.cloneNode(true) as HTMLElement;
    if (footer) {
      this.cleanHeaderFooter(footer);
      printContainer.appendChild(footer);
    }
    
    // Populate the already opened print window
    await this.populatePrintWindow(printWindow, printContainer, building, printType);
    
  } catch (error) {
    console.error('Error during printing:', error);
    alert('Fehler beim Drucken. Bitte versuchen Sie es erneut.');
    // Close the print window on error
    if (printWindow && !printWindow.closed) {
      printWindow.close();
    }
    // Restore original tab in case of error
    setActiveTab(currentTab);
  }
}

/**
 * Populates an already opened print window with content
 */
private async populatePrintWindow(printWindow: Window, printContainer: HTMLElement, building: any, printType: 'kunde' | 'lv' | 'bank'): Promise<void> {
  try {
    // Add Firefox-specific adjustments
    if (this.isFirefox()) {
      // Add small delay for Firefox rendering
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Get current page styles
    const styles = this.collectStyles();
    
    // Load print-specific styles based on print type
    const printStyles = await this.loadPrintStylesForType(printType);
    
    // Add enhanced CSS to further suppress headers/footers
    const headerFooterSuppression = this.getHeaderFooterSuppressionCSS();
    
    // Write the HTML content to the already opened window
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Gebäudeanalyse - ${building.address} - ${printType.toUpperCase()}</title>
        <meta charset="utf-8">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        <style>
          ${styles}
          ${printStyles}
          ${headerFooterSuppression}
        </style>
      </head>
      <body>
        ${printContainer.innerHTML}
      </body>
      </html>
    `);
    
    printWindow.document.close();
    
    // Wait for content to load, then print with enhanced options
    printWindow.onload = () => {
      const delay = this.isFirefox() ? 2000 : 1000;
      setTimeout(() => {
        this.executePrintWithOptions(printWindow);
      }, delay);
    };
    
  } catch (error) {
    console.error('Error populating print window:', error);
    alert('Fehler beim Laden der Druckvorschau. Bitte versuchen Sie es erneut.');
    if (printWindow && !printWindow.closed) {
      printWindow.close();
    }
  }
}

/**
 * Enhanced CSS to suppress headers and footers
 */
private getHeaderFooterSuppressionCSS(): string {
  return `
    /* Enhanced header/footer suppression */
    @page {
      size: A4 portrait;
      margin: 20mm;
      
      /* Try every possible way to disable headers/footers */
      @top-left-corner { content: "" !important; display: none !important; }
      @top-left { content: "" !important; display: none !important; }
      @top-center { content: "" !important; display: none !important; }
      @top-right { content: "" !important; display: none !important; }
      @top-right-corner { content: "" !important; display: none !important; }
      
      @bottom-left-corner { content: "" !important; display: none !important; }
      @bottom-left { content: "" !important; display: none !important; }
      @bottom-center { content: counter(page) !important; } /* Only page numbers */
      @bottom-right { content: "" !important; display: none !important; }
      @bottom-right-corner { content: "" !important; display: none !important; }
      
      /* Alternative approaches */
      margin-header: 0 !important;
      margin-footer: 10mm !important; /* Small space for page numbers only */
    }
    
    /* Hide any remaining header/footer elements */
    @media print {
      header, .header, #header,
      footer, .footer, #footer,
      .page-header, .page-footer,
      .print-header, .print-footer {
        display: none !important;
        visibility: hidden !important;
        height: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      
      /* Ensure page numbers are minimal and clean */
      .page-number {
        font-size: 10px !important;
        color: #666 !important;
        text-align: center !important;
        margin: 0 !important;
        padding: 5px 0 !important;
      }
    }
  `;
}

/**
 * Executes print with browser-specific optimizations
 */
private executePrintWithOptions(printWindow: Window): void {
  try {
    // Try browser-specific print options
    const browserName = this.getBrowserName();
    
    switch (browserName) {
      case 'chrome':
      case 'edge':
        // Try Chrome/Edge specific options
        this.tryChromePrintOptions(printWindow);
        break;
        
      case 'firefox':
        // Firefox specific handling
        this.tryFirefoxPrintOptions(printWindow);
        break;
        
      case 'safari':
        // Safari specific handling
        this.trySafariPrintOptions(printWindow);
        break;
        
      default:
        // Fallback to standard print
        printWindow.print();
    }
    
    // Close window after a delay
    setTimeout(() => {
      printWindow.close();
    }, 1000);
    
  } catch (error) {
    console.warn('Enhanced print options failed, using standard print:', error);
    printWindow.print();
    printWindow.close();
  }
}

/**
 * Chrome/Edge specific print options
 */
private tryChromePrintOptions(printWindow: Window): void {
  try {
    // Try to access Chrome print API if available
    if ('chrome' in window && (window as any).chrome?.printing) {
      (window as any).chrome.printing.print({
        interactive: true,
        silent: false,
        deviceName: '',
        headerFooterEnabled: false,
        shouldPrintBackgrounds: true,
        shouldPrintSelectionOnly: false
      });
    } else {
      // Fallback to standard print
      printWindow.print();
    }
  } catch (error) {
    printWindow.print();
  }
}

/**
 * Firefox specific print options
 */
private tryFirefoxPrintOptions(printWindow: Window): void {
  try {
    // Firefox doesn't support programmatic header/footer control
    // Just use standard print with our CSS
    printWindow.print();
  } catch (error) {
    printWindow.print();
  }
}

/**
 * Safari specific print options
 */
private trySafariPrintOptions(printWindow: Window): void {
  try {
    // Safari has limited programmatic control
    // Use standard print with our CSS
    printWindow.print();
  } catch (error) {
    printWindow.print();
  }
}

/**
 * Loads print-specific CSS styles based on print type
 */
private async loadPrintStylesForType(printType: 'kunde' | 'lv' | 'bank'): Promise<string> {
  try {
    // Use ALL CSS files for all print types to ensure same styling
    const cssFilesToLoad = Object.values(this.cssFiles); // All CSS files for all types
    
    // Load CSS files in parallel
    const cssPromises = cssFilesToLoad.map(url => 
      fetch(url).then(response => {
        if (!response.ok) {
          console.warn(`Could not load CSS file: ${url}`);
          return '';
        }
        return response.text();
      }).catch(error => {
        console.warn(`Error loading CSS file: ${url}`, error);
        return '';
      })
    );

    const cssContents = await Promise.all(cssPromises);
    
    // Combine all CSS content
    return cssContents.join('\n\n');
  } catch (error) {
    console.error('Error loading print styles:', error);
    // Fallback to the original inline styles if CSS files fail to load
    return this.getFallbackPrintStyles();
  }
}
private addScreenshotsToFirstPage(printContainer: HTMLElement): void {
  // Don't create a separate page - add to first page
  if (!this.screenshots || this.screenshots.length === 0) return;
  
  // Create screenshots section for first page
  const screenshotsSection = document.createElement('div');
  screenshotsSection.className = 'screenshots-first-page';
  
  // Add title
  const title = document.createElement('h2');
  title.textContent = '3D-Modell Ansichten';
  screenshotsSection.appendChild(title);
  
  // Create simple container (no flexbox, just block)
  const container = document.createElement('div');
  
  // Add screenshots (max 4) - each in its own row
  for (let i = 0; i < Math.min(this.screenshots.length, 4); i++) {
    const screenshot = this.screenshots[i];
    
    // Create screenshot container (one per row)
    const screenshotContainer = document.createElement('div');
    
    // Create image
    const img = document.createElement('img');
    img.src = screenshot.dataUrl;
    img.alt = screenshot.viewName;
    
    // Create label
    const label = document.createElement('p');
    label.textContent = screenshot.viewName;
    
    // Add image and label to container
    screenshotContainer.appendChild(img);
    screenshotContainer.appendChild(label);
    
    // Add container to main container
    container.appendChild(screenshotContainer);
  }
  
  screenshotsSection.appendChild(container);
  
  // Insert after header and building image, before other sections
  const headerElements = printContainer.querySelectorAll('.dossier-header, .building-image');
  if (headerElements.length > 0) {
    const lastHeaderElement = headerElements[headerElements.length - 1];
    lastHeaderElement.parentNode?.insertBefore(screenshotsSection, lastHeaderElement.nextSibling);
  } else {
    printContainer.insertBefore(screenshotsSection, printContainer.firstChild);
  }
}

  /**
   * Cleans up content by removing interactive elements
   */
  private cleanupContent(content: HTMLElement): void {
    // Remove interactive elements and empty content (but preserve tooltips)
    const elementsToRemove = content.querySelectorAll(
      '.edit-controls, .action-buttons, .edit-button, .cancel-button, ' +
      '.save-button, .saved-message, .add-button, .remove-icon, .image-remove-btn, ' +
      '.upload-container, .file-input, .tab-scroll-button, .tabs-wrapper, ' +
      '.add-measure-controls, .user-type-switch, .print-section, ' +
      '.financing-edit-controls, .financing-edit-button, .financing-action-buttons, ' +
      '.financing-cancel-button, .financing-save-button, .financing-saved-message, ' +
      '.target-analysis-edit-controls, .target-analysis-edit-button, .target-analysis-action-buttons, ' +
      '.target-analysis-cancel-button, .target-analysis-save-button, .target-analysis-saved-message, ' +
      '.add-measurement-controls, .add-back-dropdown, .add-back-button, .dropdown-menu'
    );
    elementsToRemove.forEach(el => el.remove());
    
    // Only remove envalpro-promise from non-overview sections
    if (!content.querySelector('.overview-section')) {
      const envalpro = content.querySelectorAll('.envalpro-promise');
      envalpro.forEach(el => el.remove());
    }
    
    // Preserve and fix tooltip positioning for print
    this.fixTooltipsForPrint(content);
    
    // Remove empty elements to reduce white space (but preserve tooltip containers)
    const emptyElements = content.querySelectorAll('div:empty:not(.tooltip-container), section:empty, p:empty');
    emptyElements.forEach(el => el.remove());
  }

  /**
   * Fixes tooltip positioning and visibility for print
   */
  private fixTooltipsForPrint(content: HTMLElement): void {
    const tooltips = content.querySelectorAll('.tooltip-container');
    
    tooltips.forEach((element) => {
      const tooltip = element as HTMLElement;
      // Make tooltip visible for print
      tooltip.style.opacity = '1';
      tooltip.style.transform = 'translateY(0)';
      tooltip.style.position = 'relative';
      tooltip.style.display = 'inline-block';
      tooltip.style.marginLeft = '10px';
      tooltip.style.marginTop = '5px';
      tooltip.style.pageBreakInside = 'avoid';
      
      // Ensure tooltip content is properly styled
      const tooltipContent = tooltip.querySelector('.tooltip-content') as HTMLElement;
      if (tooltipContent) {
        // Preserve the background color from inline styles
        const bgColor = tooltipContent.style.backgroundColor || tooltipContent.style.background;
        if (bgColor) {
          tooltipContent.style.backgroundColor = bgColor;
          tooltipContent.style.background = bgColor;
        }
        
        // Add print-specific classes
        tooltipContent.classList.add('print-tooltip');
        
        // Fix arrow color to match tooltip background
        const arrow = tooltip.querySelector('.tooltip-arrow') as HTMLElement;
        if (arrow && bgColor) {
          arrow.style.backgroundColor = bgColor;
          arrow.style.background = bgColor;
        }
      }
    });
    
    // Position tooltips near their associated chart elements
    const charts = content.querySelectorAll('.modernization-chart, .chart-container, .analysis-chart');
    charts.forEach((element) => {
      const chart = element as HTMLElement;
      const associatedTooltips = chart.querySelectorAll('.tooltip-container');
      if (associatedTooltips.length > 0) {
        // Create a tooltip wrapper
        const tooltipWrapper = document.createElement('div');
        tooltipWrapper.className = 'print-tooltips-wrapper';
        tooltipWrapper.style.marginTop = '10px';
        tooltipWrapper.style.display = 'flex';
        tooltipWrapper.style.flexWrap = 'wrap';
        tooltipWrapper.style.gap = '10px';
        tooltipWrapper.style.pageBreakInside = 'avoid';
        
        // Move tooltips to wrapper
        associatedTooltips.forEach(tooltipElement => {
          tooltipWrapper.appendChild(tooltipElement.cloneNode(true));
        });
        
        // Insert wrapper after chart
        chart.parentNode?.insertBefore(tooltipWrapper, chart.nextSibling);
      }
    });
  }

  /**
   * Optimizes content for print layout
   */
  private optimizeContentForPrint(content: HTMLElement): void {
    // Add print-specific classes for better layout
    const tables = content.querySelectorAll('table');
    tables.forEach(table => {
      table.classList.add('print-table');
      const rows = table.querySelectorAll('tr');
      if (rows.length > 20) {
        table.classList.add('print-table-large');
      }
    });

    // Handle long lists
    const lists = content.querySelectorAll('ul, ol');
    lists.forEach(list => {
      const items = list.querySelectorAll('li');
      if (items.length > 15) {
        list.classList.add('print-list-large');
      }
    });

    // Optimize grid layouts
    const grids = content.querySelectorAll('.stats-circles, .benefits-icons, .comparison-grid, .cost-grid, .analysis-items, .target-measures');
    grids.forEach(grid => {
      grid.classList.add('print-grid');
      const items = grid.children;
      if (items.length > 8) {
        grid.classList.add('print-grid-large');
      }
    });

    // Handle charts and visual elements
    const charts = content.querySelectorAll('.modernization-chart, .d3-chart-container, .chart-container');
    charts.forEach(chart => {
      chart.classList.add('print-chart');
    });

    // Handle energy rating scales
    const energyRatings = content.querySelectorAll('.rating-scale, .energy-rating');
    energyRatings.forEach(rating => {
      rating.classList.add('print-energy-rating');
    });

    // Handle comparison sections
    const comparisons = content.querySelectorAll('.comparison-grid, .eco-comparison');
    comparisons.forEach(comparison => {
      comparison.classList.add('print-comparison');
    });
  }

  /**
   * Cleans header and footer by removing address, URL, date, time elements
   */
  private cleanHeaderFooter(element: HTMLElement): void {
    // Remove common selectors for address, URL, date, time information
    const elementsToRemove = element.querySelectorAll(
      '.address, .url, .website, .date, .time, .timestamp, ' +
      '.contact-info, .location, .phone, .email, .footer-website, ' +
      '.footer-contact, .footer-address, .header-date, .header-time, ' +
      '.generated-date, .print-date, .document-date'
    );
    elementsToRemove.forEach(el => el.remove());

    // Remove text nodes containing common patterns (case insensitive)
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null
    );

    const textNodesToRemove: Node[] = [];
    let node;
    
    while (node = walker.nextNode()) {
      const text = node.textContent?.toLowerCase() || '';
      
      // Check for patterns that indicate address, URL, date, or time
      if (
        text.includes('www.') ||
        text.includes('http') ||
        text.includes('.com') ||
        text.includes('.de') ||
        text.includes('@') ||
        text.match(/\d{1,2}[.\/]\d{1,2}[.\/]\d{2,4}/) || // Date patterns
        text.match(/\d{1,2}:\d{2}/) || // Time patterns
        text.match(/\d{5}\s/) || // Postal code patterns (German)
        text.includes('straße') ||
        text.includes('strasse') ||
        text.includes('platz') ||
        text.includes('weg') ||
        text.includes('gasse') ||
        text.includes('allee')
      ) {
        textNodesToRemove.push(node);
      }
    }

    // Remove identified text nodes
    textNodesToRemove.forEach(node => {
      if (node.parentNode) {
        node.parentNode.removeChild(node);
      }
    });

    // Clean up empty parent elements after text removal
    const emptyElements = element.querySelectorAll('span:empty, div:empty, p:empty');
    emptyElements.forEach(el => el.remove());
  }

  /**
   * Detects if browser is Firefox
   */
  private isFirefox(): boolean {
    return navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
  }

  /**
   * Opens a new window with the print content
   */
  private async openPrintWindow(printContainer: HTMLElement, building: any): Promise<void> {
    // Add Firefox-specific adjustments
    if (this.isFirefox()) {
      // Add small delay for Firefox rendering
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      alert('Pop-up-Blocker verhindert das Drucken. Bitte erlauben Sie Pop-ups für diese Seite.');
      return;
    }
    
    // Get current page styles
    const styles = this.collectStyles();
    
    // Load print-specific styles
    const printStyles = await this.loadPrintStyles();
    
    // Write the HTML content
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Gebäudeanalyse - ${building.address}</title>
        <meta charset="utf-8">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        <style>
          ${styles}
          ${printStyles}
        </style>
      </head>
      <body>
        ${printContainer.innerHTML}
      </body>
      </html>
    `);
    
    printWindow.document.close();
    
    // Wait for content to load, then print
    printWindow.onload = () => {
      const delay = this.isFirefox() ? 2000 : 1000;
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, delay);
    };
  }

  /**
   * Collects current page styles
   */
  private collectStyles(): string {
    return Array.from(document.styleSheets)
      .map(styleSheet => {
        try {
          return Array.from(styleSheet.cssRules)
            .map(rule => rule.cssText)
            .join('\n');
        } catch (e) {
          // Handle cross-origin stylesheets
          return '';
        }
      })
      .join('\n');
  }

  /**
   * Loads all print-specific CSS styles from separate files
   */
  private async loadPrintStyles(): Promise<string> {
    try {
      // Load all CSS files in parallel
      const cssPromises = Object.values(this.cssFiles).map(url => 
        fetch(url).then(response => {
          if (!response.ok) {
            console.warn(`Could not load CSS file: ${url}`);
            return '';
          }
          return response.text();
        }).catch(error => {
          console.warn(`Error loading CSS file: ${url}`, error);
          return '';
        })
      );

      const cssContents = await Promise.all(cssPromises);
      
      // Combine all CSS content
      return cssContents.join('\n\n');
    } catch (error) {
      console.error('Error loading print styles:', error);
      // Fallback to the original inline styles if CSS files fail to load
      return this.getFallbackPrintStyles();
    }
  }

  /**
   * Fallback styles in case CSS files cannot be loaded
   * This is your original getPrintStyles() method as backup
   */
  private getFallbackPrintStyles(): string {
    return `
      /* Fallback print styles - minimal version */
      @page {
        size: 210mm 297mm; /* exact A4 */
        margin: 12mm; /* slightly smaller margin to avoid overflow */
        
        /* Disable browser headers/footers completely */
        @top-left-corner { content: none !important; }
        @top-left { content: none !important; }
        @top-center { content: none !important; }
        @top-right { content: none !important; }
        @top-right-corner { content: none !important; }
        @bottom-left-corner { content: none !important; }
        @bottom-left { content: none !important; }
        @bottom-center { content: counter(page) !important; } /* Only page numbers */
        @bottom-right { content: none !important; }
        @bottom-right-corner { content: none !important; }
      }

      html, body {
        width: 186mm; /* page width - margins */
        overflow: hidden;
      }

      img, table {
        max-width: 100%;
      }
      
      body {
        font-family: 'Inter', sans-serif !important;
        font-size: 10pt !important;
        line-height: 1.4 !important;
        color: #1d1d1f !important;
      }
      
      .print-section-container {
        page-break-inside: avoid;
        margin-bottom: 1rem;
      }
      
      .print-section-container.with-page-break:not(:first-child) {
        page-break-before: always;
      }
      
      .print-section-title {
        font-size: 1.5rem;
        font-weight: 700;
        color: #0071e3;
        margin-bottom: 1.5rem;
        border-bottom: 2px solid #0071e3;
        padding-bottom: 0.5rem;
      }
      
      /* Add more essential fallback styles as needed */
    `;
  }
}
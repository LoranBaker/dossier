// Enhanced PrintPdfService with 3D Model Screenshots Integration
import { Injectable, PLATFORM_ID, Inject, NgZone } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ModelScreenshot } from '@app/components/simple3d-model/simple3d-model.component';

export type DossierPrintMode = 'kunde' | 'lv' | 'bank';

interface CapturedSection {
  name: string;
  canvas: HTMLCanvasElement;
}

interface ElementCache {
  elements: Element[];
  timestamp: number;
}

@Injectable({ providedIn: 'root' })
export class PrintPdfService {
  private pageFormat = 'a4';
  private margin = 8; // mm
  private dpi = 192; // capture scale baseline (192/96 = 2x)
  private libsLoaded = false;
  private qualityStyleEl: HTMLStyleElement | null = null;
  private processedElements = new Set<Element>(); // Track processed elements
  
  // 3D Model Screenshots - same as print.service.ts
  private screenshots: ModelScreenshot[] = [];
  
  // Performance optimizations
  private elementCache = new Map<string, ElementCache>();
  private readonly CACHE_DURATION = 3000; // 3 seconds (reduced from 5)
  private isProcessing = false;

  // Hydration safety
  private isBrowser: boolean;
  private hydrationComplete = false;
  private domReady = false;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private ngZone: NgZone
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);

    if (this.isBrowser && typeof window !== 'undefined') {
      // Wait for hydration to complete
      if ((window as any).afterNextRender) {
        (window as any).afterNextRender(() => {
          this.hydrationComplete = true;
          setTimeout(() => {
            this.domReady = true;
          }, 100);
        }, { phase: (window as any).AfterRenderPhase?.Write ?? undefined });
      }

      // Enhanced fallback
      const checkDocumentReady = () => {
        if (document.readyState === 'complete' && document.body) {
          setTimeout(() => {
            this.hydrationComplete = true;
            this.domReady = true;
          }, 100);
        } else {
          document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
              this.hydrationComplete = true;
              this.domReady = true;
            }, 100);
          });
        }
      };
      
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkDocumentReady);
      } else {
        checkDocumentReady();
      }
    }
  }

  /**
   * Wait for safe DOM access (hydration complete + browser environment)
   */
  private async waitForSafeDOMAccess(): Promise<void> {
    if (!this.isBrowser) {
      throw new Error('PrintPdfService: DOM operations not available in server environment');
    }
    
    // Add additional check for Angular hydration
    if (typeof document === 'undefined' || !document.body) {
      throw new Error('PrintPdfService: Document not ready');
    }
    
    if (this.domReady) {
      return;
    }
    
    return new Promise<void>((resolve, reject) => {
      const checkReady = () => {
        if (this.domReady || (document.readyState === 'complete' && document.body)) {
          this.domReady = true;
          resolve();
        } else {
          setTimeout(checkReady, 50);
        }
      };
      
      // Add timeout to prevent infinite waiting
      setTimeout(() => {
        reject(new Error('Timeout waiting for DOM access'));
      }, 10000);
      
      checkReady();
    });
  }

  /**
   * Set screenshots from 3D model component - same interface as print.service.ts
   */
  setScreenshots(screenshots: ModelScreenshot[]): void {
    this.screenshots = screenshots;
  }

  /**
   * Get current screenshots
   */
  getScreenshots(): ModelScreenshot[] {
    return [...this.screenshots];
  }

  /**
   * Clear all screenshots
   */
  clearScreenshots(): void {
    this.screenshots = [];
  }

  // Enhanced method specifically for modernization planning components
  async printModernizationPlanning(options?: {
    fileName?: string;
    darkBackground?: boolean;
    includeScreenshots?: boolean;
  }): Promise<void> {
    try {
      await this.waitForSafeDOMAccess();
    } catch (error: any) {
      console.warn('PrintPdfService: Cannot access DOM:', error.message);
      return;
    }
    return this.ngZone.runOutsideAngular(async () => {
      // Prevent multiple simultaneous operations
      if (this.isProcessing) {
        console.warn('PrintPdfService: Already processing, skipping operation');
        return;
      }
      
      this.isProcessing = true;
      
      try {
        await this.ensureLibraries();
        
        // Clear processed elements for this print job
        this.processedElements.clear();
        this.clearExpiredCache();

        // Look for modernization planning component
        console.log('PrintPdfService: Looking for .modernization-planning component...');
        const modernizationEl = document.querySelector('.modernization-planning') as HTMLElement | null;
        
        if (!modernizationEl) {
          console.error('PrintPdfService: .modernization-planning component not found in DOM');
          return;
        }

        console.log('PrintPdfService: Found modernization component:', {
          className: modernizationEl.className,
          id: modernizationEl.id,
          offsetWidth: modernizationEl.offsetWidth,
          offsetHeight: modernizationEl.offsetHeight,
          visible: modernizationEl.offsetParent !== null
        });

        const hiddenTokens = this.prepareForCapture();

        try {
          // Add print-ready class for better styling
          modernizationEl.classList.add('print-ready');
          console.log('PrintPdfService: Added print-ready class');

          // Ensure all images are loaded
          await this.waitForImages(modernizationEl);
          console.log('PrintPdfService: Images loaded');

          // Wait a bit for the component to stabilize
          await this.scrollIntoViewAndWait(modernizationEl, 300);
          console.log('PrintPdfService: Scrolled into view');

          const canvas = await this.captureElement(modernizationEl, { 
            dark: !!options?.darkBackground 
          });

          console.log('PrintPdfService: Canvas created:', {
            width: canvas.width,
            height: canvas.height,
            isEmpty: this.isCanvasBlank(canvas)
          });

          if (!canvas || canvas.width === 0 || canvas.height === 0 || this.isCanvasBlank(canvas)) {
            console.error('PrintPdfService: Canvas is invalid or blank');
            return;
          }

          const captured: CapturedSection[] = [{
            name: 'Modernisierungsplanung',
            canvas
          }];

          // Include screenshots if requested and available
          const screenshotsToInclude = (options?.includeScreenshots && this.screenshots.length > 0) 
            ? this.screenshots 
            : undefined;

          await this.buildPdfFromCanvases(captured, {
            mode: 'kunde',
            fileName: options?.fileName || 'modernisierungsplanung.pdf',
            dark: !!options?.darkBackground,
            screenshots: screenshotsToInclude
          });

          console.log('PrintPdfService: PDF generated successfully');
        } finally {
          // Remove print-ready class
          modernizationEl.classList.remove('print-ready');
          this.restoreAfterCapture(hiddenTokens);
          this.processedElements.clear();
        }
      } finally {
        this.isProcessing = false;
      }
    });
  }

  // Capture full dossier into PDF
  async generateDossierPDF(
    mode: DossierPrintMode,
    options?: {
      rootSelector?: string;
      sectionSelectors?: string[];
      excludeSelectors?: string[];
      fileName?: string;
      darkBackground?: boolean;
      scrollPauseMs?: number;
      includeScreenshots?: boolean; // New option to include/exclude screenshots
    }
  ): Promise<void> {
    try {
      await this.waitForSafeDOMAccess();
    } catch (error: any) {
      console.warn('PrintPdfService: Cannot access DOM:', error.message);
      return;
    }
    return this.ngZone.runOutsideAngular(async () => {
      // Prevent multiple simultaneous operations
      if (this.isProcessing) {
        console.warn('PrintPdfService: Already processing, skipping operation');
        return;
      }
      
      this.isProcessing = true;
      
      try {
        await this.ensureLibraries();
        
        // Clear processed elements for this print job
        this.processedElements.clear();
        this.clearExpiredCache();

        const rootSel = options?.rootSelector || '.dossier-container';
        const root = document.querySelector(rootSel) as HTMLElement | null;
        if (!root) {
          console.warn('PrintPdfService: root not found', rootSel);
          return;
        }

        const elements = this.collectSectionElements(root, options);
        
        // If no elements found, try to find modernization component directly
        if (elements.length === 0) {
          console.log('PrintPdfService: No elements found in root, searching globally...');
          
          const modernizationEl = document.querySelector('.modernization-planning') as HTMLElement | null;
          if (modernizationEl && this.isElementVisible(modernizationEl)) {
            console.log('PrintPdfService: Found modernization component directly');
            elements.push(modernizationEl);
          }
          
          const generalInfoEl = document.querySelector('.general-info, .generalinfo, [class*="general-info"]') as HTMLElement | null;
          if (generalInfoEl && this.isElementVisible(generalInfoEl)) {
            console.log('PrintPdfService: Found general info component directly');
            elements.push(generalInfoEl);
          }
        }

        // Ensure modernization and general info components are included if they exist but weren't found
        const hasModernization = elements.some(el => 
          el.classList.contains('modernization-planning') || 
          el.querySelector('.modernization-planning')
        );
        
        const hasGeneralInfo = elements.some(el => 
          el.classList.contains('general-info') || 
          el.classList.contains('generalinfo') ||
          el.className.includes('general-info') ||
          el.querySelector('.general-info, .generalinfo, [class*="general-info"]')
        );
        
        if (!hasModernization) {
          const modernizationEl = document.querySelector('.modernization-planning') as HTMLElement | null;
          if (modernizationEl && this.isElementVisible(modernizationEl)) {
            console.log('PrintPdfService: Adding missing modernization component');
            elements.push(modernizationEl);
          }
        }
        
        if (!hasGeneralInfo) {
          const generalInfoEl = document.querySelector('.general-info, .generalinfo, [class*="general-info"]') as HTMLElement | null;
          if (generalInfoEl && this.isElementVisible(generalInfoEl)) {
            console.log('PrintPdfService: Adding missing general info component');
            elements.push(generalInfoEl);
          }
        }
        
        if (elements.length === 0) {
          console.warn('PrintPdfService: no sections found to capture');
          return;
        }

        console.log('PrintPdfService: Final elements to capture:', elements.length);

        const hiddenTokens = this.prepareForCapture();

        try {
          const captured: CapturedSection[] = [];
          
          // Process elements with small delays to prevent blocking
          for (let i = 0; i < elements.length; i++) {
            const el = elements[i];
            
            console.log(`PrintPdfService: Processing element ${i + 1}/${elements.length}:`, {
              tagName: el.tagName,
              className: el.className,
              id: el.id,
              visible: this.isElementVisible(el)
            });
            
            // Skip invisible elements
            if (!this.isElementVisible(el)) {
              console.log('PrintPdfService: Skipping invisible element');
              continue;
            }
            
            // Add print-ready class if it's a modernization planning or general info component
            const isSpecialComponent = el.classList.contains('modernization-planning') || 
                                      el.classList.contains('general-info') ||
                                      el.classList.contains('generalinfo') ||
                                      el.className.includes('general-info') ||
                                      el.className.includes('modernization');
            
            if (isSpecialComponent) {
              console.log('PrintPdfService: Processing special component');
              el.classList.add('print-ready');
              
              // Ensure element is fully rendered
              el.style.transform = 'none';
              el.style.opacity = '1';
              el.style.visibility = 'visible';
              
              await this.waitForImages(el);
              // Extra delay for complex components
              await new Promise(resolve => setTimeout(resolve, 300));
            }

            // Ensure element is in viewport and stable
            await this.scrollIntoViewAndWait(el, options?.scrollPauseMs || 400);
            
            // Additional stabilization for complex components
            if (isSpecialComponent) {
              await new Promise(resolve => setTimeout(resolve, 200));
            }
            
            const canvas = await this.captureElement(el, { dark: !!options?.darkBackground });
            
            // Check if canvas was created successfully
            if (canvas && canvas.width > 0 && canvas.height > 0 && !this.isCanvasBlank(canvas)) {
              captured.push({ name: this.deriveSectionName(el), canvas });
              console.log('PrintPdfService: Successfully captured:', this.deriveSectionName(el), {
                canvasSize: `${canvas.width}x${canvas.height}`
              });
            } else {
              console.warn('PrintPdfService: Failed to capture element:', this.deriveSectionName(el), {
                canvasExists: !!canvas,
                canvasSize: canvas ? `${canvas.width}x${canvas.height}` : 'null',
                isBlank: canvas ? this.isCanvasBlank(canvas) : 'unknown'
              });
            }

            // Remove print-ready class and restore styles
            if (isSpecialComponent) {
              el.classList.remove('print-ready');
              el.style.transform = '';
              el.style.opacity = '';
              el.style.visibility = '';
            }
            
            // Small yield to prevent blocking (every 2 elements)
            if (i % 2 === 0 && i < elements.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 10));
            }
          }

          console.log('PrintPdfService: Total captured sections:', captured.length);

          // Include screenshots if requested and available
          const screenshotsToInclude = (options?.includeScreenshots !== false && this.screenshots.length > 0) 
            ? this.screenshots 
            : undefined;

          await this.buildPdfFromCanvases(captured, {
            mode,
            fileName: options?.fileName,
            dark: !!options?.darkBackground,
            screenshots: screenshotsToInclude
          });
        } finally {
          this.restoreAfterCapture(hiddenTokens);
          this.processedElements.clear();
        }
      } finally {
        this.isProcessing = false;
      }
    });
  }

  async printDossier(mode: DossierPrintMode, options?: { 
    selector?: string; 
    sectionsSelector?: string; 
    filename?: string;
    includeScreenshots?: boolean; // New option
  }): Promise<void> {
    await this.generateDossierPDF(mode, {
      rootSelector: options?.selector || '.dossier-container',
      fileName: options?.filename,
      darkBackground: false,
      includeScreenshots: options?.includeScreenshots
    });
  }

  /** Capture each tab (activated sequentially) and export combined PDF */
  async exportDossierTabs(tabs: string[], activateTab: (tab: string) => void | Promise<void>, options?: {
    fileName?: string;
    darkBackground?: boolean;
    contentSelector?: string;
    headerSelector?: string;
    delayMs?: number;
    includeScreenshots?: boolean; // New option
  }): Promise<void> {
    try {
      await this.waitForSafeDOMAccess();
    } catch (error: any) {
      console.warn('PrintPdfService: Cannot access DOM:', error.message);
      return;
    }
    return this.ngZone.runOutsideAngular(async () => {
      // Prevent multiple simultaneous operations
      if (this.isProcessing) {
        console.warn('PrintPdfService: Already processing, skipping operation');
        return;
      }
      
      this.isProcessing = true;
      
      try {
        await this.ensureLibraries();
        const headerSel = options?.headerSelector || '.dossier-header';
        const contentSel = options?.contentSelector || '.tab-content';
        const delay = options?.delayMs ?? 350;

        const hiddenTokens = this.prepareForCapture();
        const captured: CapturedSection[] = [];

        try {
          // Capture header once
          const headerEl = document.querySelector(headerSel) as HTMLElement | null;
          if (headerEl) {
            await this.scrollIntoViewAndWait(headerEl, 100);
            const headerCanvas = await this.captureElement(headerEl, { dark: !!options?.darkBackground });
            captured.push({ name: 'Header', canvas: headerCanvas });
          }

          for (const tab of tabs) {
            await Promise.resolve(activateTab(tab));
            await new Promise(r => setTimeout(r, delay));
            const el = document.querySelector(contentSel) as HTMLElement | null;
            if (!el) continue;

            // Handle modernization planning tabs specifically
            const modernizationEl = el.querySelector('.modernization-planning') as HTMLElement | null;
            if (modernizationEl) {
              modernizationEl.classList.add('print-ready');
              await this.waitForImages(modernizationEl);
            }

            await this.scrollIntoViewAndWait(el, 50);
            const canvas = await this.captureElement(el, { dark: !!options?.darkBackground });
            captured.push({ name: tab, canvas });

            if (modernizationEl) {
              modernizationEl.classList.remove('print-ready');
            }
          }

          // Include screenshots if requested and available
          const screenshotsToInclude = (options?.includeScreenshots !== false && this.screenshots.length > 0) 
            ? this.screenshots 
            : undefined;

          await this.buildPdfFromCanvases(captured, {
            mode: 'kunde',
            fileName: options?.fileName || 'dossier-tabs.pdf',
            dark: !!options?.darkBackground,
            screenshots: screenshotsToInclude
          });
        } finally {
          this.restoreAfterCapture(hiddenTokens);
        }
      } finally {
        this.isProcessing = false;
      }
    });
  }
  

  // All other existing methods remain exactly the same...
  // [Rest of the original methods: waitForImages, ensureLibraries, loadScriptOnce, etc.]

private async buildPdfFromCanvases(
  sections: CapturedSection[],
  cfg: {
    mode: DossierPrintMode;
    fileName?: string;
    dark: boolean;
    screenshots?: ModelScreenshot[];
  }
): Promise<void> {
  // Add this at the beginning
  try {
    await this.waitForSafeDOMAccess();
  } catch (error: any) {
    console.warn('PrintPdfService: Cannot access DOM in buildPdfFromCanvases:', error.message);
    return;
  }

  const jsPDFCtor = (window as any).jsPDF;
  const pdf = new jsPDFCtor({ orientation: 'p', unit: 'mm', format: this.pageFormat });
  const fullWidth = pdf.internal.pageSize.getWidth();
  const fullHeight = pdf.internal.pageSize.getHeight();
  const pageWidth = fullWidth - this.margin * 2;
  const pageHeight = fullHeight - this.margin * 2;
  let first = true;

  // Helper to check if section is one of the special components
  const isSpecialComponent = (section: CapturedSection) => {
    const name = (section.name || '').toLowerCase();
    return (
      name.includes('summary') ||
      name.includes('target-analysis') ||
      name.includes('renovation-results-tab') ||
      name.includes('modernisierungsplanung') ||
      name.includes('modernization-planning')
    );
  };

  const tryAddCanvas = (canvas: HTMLCanvasElement) => {
    if (!canvas || canvas.width < 10 || canvas.height < 10) return false;
    if (this.isCanvasBlank(canvas)) return false;
    
    const scaledHeight = (canvas.height * pageWidth) / canvas.width;
    if (scaledHeight <= 1) return false;
    
    if (!first) pdf.addPage();
    this.paintPageBackground(pdf, cfg.dark);
    
    try {
      pdf.addImage(
        canvas.toDataURL('image/png'), 
        'PNG', 
        this.margin, 
        this.margin, 
        pageWidth, 
        scaledHeight, 
        undefined, 
        'FAST'
      );
      first = false;
      return true;
    } catch (e) {
      console.warn('Failed to add canvas to PDF:', e);
      return false;
    }
  };

  // --- Process regular sections first (including header) ---
  let headerProcessed = false;
  
  for (const section of sections) {
    const canvas = section.canvas;
    if (!canvas) continue;

    // Check if this is the header section
    const isHeader = section.name.toLowerCase().includes('header');
    
    if (isSpecialComponent(section)) {
      // Always start a new page for these components
      if (!first) pdf.addPage();
      this.paintPageBackground(pdf, cfg.dark);

      // Scale to fit exactly one page (maintain aspect ratio, fit within page)
      let drawWidth = pageWidth;
      let drawHeight = pageHeight;
      const aspect = canvas.width / canvas.height;
      if (drawWidth / drawHeight > aspect) {
        drawWidth = drawHeight * aspect;
      } else {
        drawHeight = drawWidth / aspect;
      }
      try {
        pdf.addImage(
          canvas.toDataURL('image/png'),
          'PNG',
          this.margin + (pageWidth - drawWidth) / 2,
          this.margin + (pageHeight - drawHeight) / 2,
          drawWidth,
          drawHeight,
          undefined,
          'FAST'
        );
        first = false;
      } catch (e) {
        console.warn('Failed to add special component canvas to PDF:', e);
      }
    } else {
      const scaledHeight = (canvas.height * pageWidth) / canvas.width;
      if (scaledHeight <= pageHeight) {
        tryAddCanvas(canvas);
      } else {
        const slices = this.sliceCanvasVertically(canvas, pageHeight, pageWidth)
          .filter(s => s.height > 5 && s.width > 5 && !this.isCanvasBlank(s));
        for (const slice of slices) {
          tryAddCanvas(slice);
        }
      }
    }

    // After processing the header, add screenshots
    if (isHeader && !headerProcessed && cfg.screenshots && cfg.screenshots.length > 0) {
      headerProcessed = true;
      
      // --- Keep hero screenshot on SAME page as header, below it ---
      const hero = cfg.screenshots[0];
      
      // Give header more space and add larger margin below it
      const headerHeight = pageHeight * 0.20; // Header space
      const marginBelowHeader = 15; // 15mm margin between header and screenshot
      const screenshotStartY = this.margin + headerHeight + marginBelowHeader;
      
      // Calculate maximum possible height for screenshot with proper spacing
      const maxPossibleHeight = fullHeight - screenshotStartY - this.margin - 10; // Leave 10mm at bottom
      
      // Make screenshot take full width and maximum available height
      let drawWidth = pageWidth;
      let drawHeight = maxPossibleHeight;
      let imgWidth = 0, imgHeight = 0;
      
      try {
        const image = document.createElement('img');
        image.src = hero.dataUrl;
        await new Promise((resolve, reject) => {
          image.onload = () => {
            imgWidth = image.naturalWidth;
            imgHeight = image.naturalHeight;
            resolve(null);
          };
          image.onerror = reject;
          setTimeout(() => resolve(null), 2000);
        });
      } catch (error) {
        console.warn('Error loading hero screenshot image:', error);
      }
      
      // Maintain aspect ratio but maximize size
      if (imgWidth > 0 && imgHeight > 0) {
        const aspect = imgWidth / imgHeight;
        
        let testWidth = drawHeight * aspect;
        
        if (testWidth <= pageWidth) {
          drawWidth = testWidth;
        } else {
          drawWidth = pageWidth;
          drawHeight = drawWidth / aspect;
          
          if (drawHeight < maxPossibleHeight * 0.8) {
            drawHeight = maxPossibleHeight * 0.9;
            drawWidth = drawHeight * aspect;
            
            if (drawWidth > pageWidth) {
              drawWidth = pageWidth;
            }
          }
        }
      }
      
      // Center horizontally, position below header with larger margin
      const drawX = this.margin + (pageWidth - drawWidth) / 2;
      const drawY = screenshotStartY;
      
      pdf.addImage(
        hero.dataUrl,
        'PNG',
        drawX,
        drawY,
        drawWidth,
        drawHeight,
        undefined,
        'FAST'
      );
      
      // Optional label at very bottom
      if (hero.viewName) {
        pdf.setFontSize(8);
        pdf.setTextColor(cfg.dark ? 255 : 0);
        pdf.text(
          hero.viewName, 
          drawX + drawWidth / 2, 
          fullHeight - 5,
          { align: 'center' }
        );
      }

      // --- Add ALL screenshots (including duplicate of first) on second page in vertical layout ---
      pdf.addPage();
      this.paintPageBackground(pdf, cfg.dark);

      // Add title for screenshots page
      pdf.setFontSize(16);
      pdf.setTextColor(cfg.dark ? 255 : 0);
      pdf.text('3D-Modell Ansichten', this.margin, this.margin + 10);

      // Calculate layout for vertical stacking (one per row)
      const titleHeight = 20; // Space taken by title
      const availableHeight = pageHeight - titleHeight;
      const screenshotsToShow = Math.min(cfg.screenshots.length, 4);
      const rowHeight = availableHeight / screenshotsToShow;
      const imageHeight = rowHeight * 0.85; // 85% of row height for image
      const labelHeight = rowHeight * 0.15; // 15% for label

      for (let i = 0; i < screenshotsToShow; i++) {
        const shot = cfg.screenshots[i];
        const rowStartY = this.margin + titleHeight + (i * rowHeight);
        
        // Calculate image dimensions - maintain aspect ratio within row
        let drawWidth = pageWidth;
        let drawHeight = imageHeight;
        let imgWidth = 0, imgHeight = 0;
        
        try {
          const image = document.createElement('img');
          image.src = shot.dataUrl;
          await new Promise((resolve, reject) => {
            image.onload = () => {
              imgWidth = image.naturalWidth;
              imgHeight = image.naturalHeight;
              resolve(null);
            };
            image.onerror = reject;
            setTimeout(() => resolve(null), 2000);
          });
        } catch (error) {
          console.warn('Error loading screenshot image:', error);
        }
        
        // Maintain aspect ratio within the allocated space
        if (imgWidth > 0 && imgHeight > 0) {
          const aspect = imgWidth / imgHeight;
          
          // Try to use full width first
          let testHeight = drawWidth / aspect;
          
          if (testHeight <= imageHeight) {
            // Width-based sizing fits within height limit
            drawHeight = testHeight;
          } else {
            // Height-based sizing - use max height and calculate width
            drawHeight = imageHeight;
            drawWidth = drawHeight * aspect;
            
            // If calculated width exceeds page width, scale back down
            if (drawWidth > pageWidth) {
              drawWidth = pageWidth;
              drawHeight = drawWidth / aspect;
            }
          }
        }
        
        // Center horizontally within the row
        const imageX = this.margin + (pageWidth - drawWidth) / 2;
        const imageY = rowStartY;
        
        pdf.addImage(
          shot.dataUrl,
          'PNG',
          imageX,
          imageY,
          drawWidth,
          drawHeight,
          undefined,
          'FAST'
        );
        
        // Add label below image within the row
        if (shot.viewName) {
          pdf.setFontSize(10);
          pdf.setTextColor(cfg.dark ? 255 : 0);
          pdf.text(
            shot.viewName,
            imageX + drawWidth / 2,
            imageY + drawHeight + 5,
            { align: 'center' }
          );
        }
      }

      first = false; // Mark that we've added content
    }
  }

  // --- Fallback: If no header was found but screenshots exist, add them at the beginning ---
  if (!headerProcessed && cfg.screenshots && cfg.screenshots.length > 0) {
    // Add hero screenshot on first page if no header was processed
    if (first) {
      const hero = cfg.screenshots[0];
      this.paintPageBackground(pdf, cfg.dark);

      let drawWidth = pageWidth;
      let drawHeight = pageHeight;
      let imgWidth = 0, imgHeight = 0;
      
      try {
        const image = document.createElement('img');
        image.src = hero.dataUrl;
        await new Promise((resolve, reject) => {
          image.onload = () => {
            imgWidth = image.naturalWidth;
            imgHeight = image.naturalHeight;
            resolve(null);
          };
          image.onerror = reject;
          setTimeout(() => resolve(null), 2000);
        });
      } catch (error) {
        console.warn('Error loading hero screenshot image:', error);
      }
      
      if (imgWidth > 0 && imgHeight > 0) {
        const aspect = imgWidth / imgHeight;
        if (drawWidth / drawHeight > aspect) {
          drawWidth = drawHeight * aspect;
        } else {
          drawHeight = drawWidth / aspect;
        }
      }
      
      pdf.addImage(
        hero.dataUrl,
        'PNG',
        this.margin + (pageWidth - drawWidth) / 2,
        this.margin + (pageHeight - drawHeight) / 2,
        drawWidth,
        drawHeight,
        undefined,
        'FAST'
      );
      
      if (hero.viewName) {
        pdf.setFontSize(12);
        pdf.setTextColor(cfg.dark ? 255 : 0);
        pdf.text(hero.viewName, this.margin + 2, fullHeight - this.margin - 2);
      }
      first = false;
    }

    // Add vertical screenshots layout on next page
    if (cfg.screenshots.length >= 1) {
      pdf.addPage();
      this.paintPageBackground(pdf, cfg.dark);

      pdf.setFontSize(16);
      pdf.setTextColor(cfg.dark ? 255 : 0);
      pdf.text('3D-Modell Ansichten', this.margin, this.margin + 10);

      const titleHeight = 20;
      const availableHeight = pageHeight - titleHeight;
      const screenshotsToShow = Math.min(cfg.screenshots.length, 4);
      const rowHeight = availableHeight / screenshotsToShow;
      const imageHeight = rowHeight * 0.85;

      for (let i = 0; i < screenshotsToShow; i++) {
        const shot = cfg.screenshots[i];
        const rowStartY = this.margin + titleHeight + (i * rowHeight);
        
        let drawWidth = pageWidth;
        let drawHeight = imageHeight;
        let imgWidth = 0, imgHeight = 0;
        
        try {
          const image = document.createElement('img');
          image.src = shot.dataUrl;
          await new Promise((resolve, reject) => {
            image.onload = () => {
              imgWidth = image.naturalWidth;
              imgHeight = image.naturalHeight;
              resolve(null);
            };
            image.onerror = reject;
            setTimeout(() => resolve(null), 2000);
          });
        } catch (error) {
          console.warn('Error loading screenshot image:', error);
        }
        
        if (imgWidth > 0 && imgHeight > 0) {
          const aspect = imgWidth / imgHeight;
          
          let testHeight = drawWidth / aspect;
          
          if (testHeight <= imageHeight) {
            drawHeight = testHeight;
          } else {
            drawHeight = imageHeight;
            drawWidth = drawHeight * aspect;
            
            if (drawWidth > pageWidth) {
              drawWidth = pageWidth;
              drawHeight = drawWidth / aspect;
            }
          }
        }
        
        const imageX = this.margin + (pageWidth - drawWidth) / 2;
        const imageY = rowStartY;
        
        pdf.addImage(
          shot.dataUrl,
          'PNG',
          imageX,
          imageY,
          drawWidth,
          drawHeight,
          undefined,
          'FAST'
        );
        
        if (shot.viewName) {
          pdf.setFontSize(10);
          pdf.setTextColor(cfg.dark ? 255 : 0);
          pdf.text(
            shot.viewName,
            imageX + drawWidth / 2,
            imageY + drawHeight + 5,
            { align: 'center' }
          );
        }
      }
    }
  }

  // If no pages added, add a notice
  if (first) {
    this.paintPageBackground(pdf, cfg.dark);
    pdf.setFontSize(12);
    pdf.setTextColor(cfg.dark ? 255 : 0);
    pdf.text('Keine Inhalte zum Drucken gefunden.', this.margin, 30);
  }

  pdf.save(cfg.fileName || this.buildFileName(cfg.mode));
}
  // [Rest of the existing methods remain exactly the same...]
  // Include all other private methods: getCachedElements, clearExpiredCache, waitForImages, 
  // ensureLibraries, loadScriptOnce, collectSectionElements, isElementVisible, deriveSectionName,
  // prepareForCapture, restoreAfterCapture, scrollIntoViewAndWait, captureElement, isCanvasBlank,
  // paintPageBackground, sliceCanvasVertically, buildFileName, ngOnDestroy

  // Cached element selection with performance optimization (but fallback to direct query)
  private getCachedElements(selector: string): Element[] {
    const cached = this.elementCache.get(selector);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < this.CACHE_DURATION) {
      return cached.elements;
    }
    
    const elements = Array.from(document.querySelectorAll(selector));
    this.elementCache.set(selector, {
      elements,
      timestamp: now
    });
    
    return elements;
  }

  // Clear expired cache only
  private clearExpiredCache(): void {
    const now = Date.now();
    for (const [key, cache] of this.elementCache.entries()) {
      if (now - cache.timestamp > this.CACHE_DURATION) {
        this.elementCache.delete(key);
      }
    }
  }

  // Optimized wait for images with better timeout handling
  private async waitForImages(element: HTMLElement): Promise<void> {
    const images = Array.from(element.querySelectorAll('img')) as HTMLImageElement[];
    
    // Filter out images that are already loaded
    const unloadedImages = images.filter(img => !img.complete);
    
    if (unloadedImages.length === 0) {
      // All images are loaded, minimal delay
      await new Promise(resolve => setTimeout(resolve, 100));
      return;
    }

    const imagePromises = unloadedImages.map(img => {
      return new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          resolve(); // Always resolve to prevent hanging
        }, 2500);

        img.onload = () => {
          clearTimeout(timeout);
          resolve();
        };
        img.onerror = () => {
          clearTimeout(timeout);
          resolve();
        };
      });
    });

    await Promise.all(imagePromises);
    // Additional delay for rendering
    await new Promise(resolve => setTimeout(resolve, 150));
  }

  // Dynamically load libraries (html2canvas & jsPDF)
  private async ensureLibraries(): Promise<void> {
    if (this.libsLoaded) return;

    if ((window as any).html2canvas && (window as any).jsPDF) {
      this.libsLoaded = true;
      return;
    }

    await this.loadScriptOnce('https://html2canvas.hertzen.com/dist/html2canvas.min.js');
    await this.loadScriptOnce('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');

    const ctor = (window as any).jspdf?.jsPDF || (window as any).jsPDF;
    if (ctor && !(window as any).jsPDF) (window as any).jsPDF = ctor;

    if (!(window as any).html2canvas) {
      console.error('Failed to load html2canvas from CDN');
      throw new Error('html2canvas not available');
    }
    if (!(window as any).jsPDF) {
      console.error('Failed to load jsPDF from CDN');
      throw new Error('jsPDF not available');
    }

    this.libsLoaded = true;
  }

  private loadScriptOnce(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }
      const s = document.createElement('script');
      s.src = src;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('Failed to load ' + src));
      document.head.appendChild(s);
    });
  }

  private collectSectionElements(root: HTMLElement, options?: { 
    sectionSelectors?: string[]; 
    excludeSelectors?: string[]; 
  }): HTMLElement[] {
    let list: HTMLElement[] = [];
    
    if (options?.sectionSelectors?.length) {
      options.sectionSelectors.forEach(sel => {
        list.push(...Array.from(root.querySelectorAll(sel)) as HTMLElement[]);
      });
    } else {
      list = Array.from(root.children) as HTMLElement[];
    }

    // Always include general-info and modernization-planning components if they exist
    const generalInfoElements = Array.from(document.querySelectorAll('.general-info, .generalinfo, [class*="general-info"], [class*="generalinfo"]')) as HTMLElement[];
    const modernizationElements = Array.from(document.querySelectorAll('.modernization-planning, [class*="modernization"]')) as HTMLElement[];
    
    // Add missing general info elements
    generalInfoElements.forEach(el => {
      if (!list.includes(el) && this.isElementVisible(el)) {
        list.push(el);
        console.log('PrintPdfService: Added missing general info element:', el.className);
      }
    });
    
    // Add missing modernization elements
    modernizationElements.forEach(el => {
      if (!list.includes(el) && this.isElementVisible(el)) {
        list.push(el);
        console.log('PrintPdfService: Added missing modernization element:', el.className);
      }
    });

    if (options?.excludeSelectors?.length) {
      list = list.filter(el => !options.excludeSelectors!.some(ex => el.matches(ex)));
    }

    // Simplified filtering - only remove print-section elements
    list = list.filter((el, index, array) => {
      // Remove print-section elements
      if (el.classList.contains('print-section')) return false;
      
      // Only remove exact duplicates (same node reference)
      const isDuplicate = array.findIndex(otherEl => otherEl === el) !== index;
      if (isDuplicate) return false;
      
      return true;
    });

    // Sort elements by their position in the DOM to maintain logical order
    list.sort((a, b) => {
      const position = a.compareDocumentPosition(b);
      if (position & Node.DOCUMENT_POSITION_FOLLOWING) {
        return -1;
      } else if (position & Node.DOCUMENT_POSITION_PRECEDING) {
        return 1;
      }
      return 0;
    });

    // Debug logging
    console.log('PrintPdfService: Final collected elements:', list.map(el => ({
      tagName: el.tagName,
      className: el.className,
      id: el.id,
      visible: this.isElementVisible(el)
    })));

    return list;
  }

  // Helper method to check if element is visible
  private isElementVisible(el: HTMLElement): boolean {
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && 
           el.offsetParent !== null && 
           getComputedStyle(el).visibility !== 'hidden' &&
           getComputedStyle(el).display !== 'none';
  }

  private deriveSectionName(el: HTMLElement): string {
    const h = el.querySelector('h1, h2, h3');
    if (h?.textContent) return h.textContent.trim();
    if (el.id) return el.id;
    if (el.classList.length) return el.classList[0];
    return 'section';
  }

  private prepareForCapture(): { element: HTMLElement; previous: string }[] {
    const hidden: { element: HTMLElement; previous: string }[] = [];
    
    // Hide elements that shouldn't be printed
    const toHide = document.querySelectorAll('.print-section, .no-print');
    toHide.forEach(el => {
      const elH = el as HTMLElement;
      hidden.push({ element: elH, previous: elH.style.display });
      elH.style.display = 'none';
    });

    // Hide edit related controls explicitly
    const editNodes = Array.from(document.querySelectorAll('.edit-button, .action-buttons, button, a')) as HTMLElement[];
    editNodes.forEach(node => {
      const txt = (node.innerText || '').trim().toLowerCase();
      if (node.classList.contains('edit-button') || 
          node.classList.contains('action-buttons') || 
          txt === 'bearbeiten' || 
          txt.startsWith('bearbeiten')) {
        hidden.push({ element: node, previous: node.style.display });
        node.style.display = 'none';
      }
    });

    // Hide tooltips specifically for modernization planning
    const tooltips = document.querySelectorAll('.service-tooltip, .tooltip-arrow');
    tooltips.forEach(el => {
      const elH = el as HTMLElement;
      hidden.push({ element: elH, previous: elH.style.display });
      elH.style.display = 'none';
    });

    if (!this.qualityStyleEl) {
      this.qualityStyleEl = document.createElement('style');
      this.qualityStyleEl.id = 'pdf-capture-quality-style';
      this.qualityStyleEl.textContent = `
        * { 
          animation: none !important; 
          transition: none !important; 
          backface-visibility: visible !important;
          transform-style: flat !important;
        }
        body, html { 
          -webkit-font-smoothing: antialiased; 
          -moz-osx-font-smoothing: grayscale;
        }
        canvas { 
          image-rendering: -webkit-optimize-contrast !important;
          image-rendering: optimize-contrast !important;
        }
        img { 
          image-rendering: -webkit-optimize-contrast !important;
          image-rendering: optimize-contrast !important;
        }
        .edit-button, .action-buttons { 
          display: none !important; 
        }
        .service-tooltip, .tooltip-arrow { 
          display: none !important; 
          visibility: hidden !important; 
          opacity: 0 !important; 
        }
        .modernization-planning.print-ready, .general-info.print-ready, .generalinfo.print-ready {
          background: #ffffff !important;
          min-height: auto !important;
          transform: none !important;
          opacity: 1 !important;
          visibility: visible !important;
          position: static !important;
          z-index: auto !important;
        }
        .modernization-planning.print-ready *, .general-info.print-ready *, .generalinfo.print-ready * {
          transform: none !important;
          backface-visibility: visible !important;
          -webkit-backface-visibility: visible !important;
          opacity: 1 !important;
          visibility: visible !important;
        }
        .modernization-planning.print-ready .service-circle {
          border: 3px solid #0071e3 !important;
          transform: none !important;
        }
        .modernization-planning.print-ready .center-house-icon {
          z-index: 100 !important;
          position: absolute !important;
          transform: translate(-50%, -50%) !important;
        }
        .modernization-planning.print-ready img {
          transform: none !important;
        }
      `;
      document.head.appendChild(this.qualityStyleEl);
    }
    
    window.scrollTo(0, 0);
    return hidden;
  }

  private restoreAfterCapture(hidden: { element: HTMLElement; previous: string }[]): void {
    hidden.forEach(item => item.element.style.display = item.previous);
    if (this.qualityStyleEl) {
      this.qualityStyleEl.remove();
      this.qualityStyleEl = null;
    }
  }

  private async scrollIntoViewAndWait(el: HTMLElement, delay: number): Promise<void> {
    el.scrollIntoView({ behavior: 'auto', block: 'start' });
    await new Promise(r => setTimeout(r, delay));
  }

  private async captureElement(el: HTMLElement, opts?: { dark: boolean }): Promise<HTMLCanvasElement> {
    // Add this check
    if (!this.isBrowser || typeof document === 'undefined') {
      throw new Error('Cannot capture element in non-browser environment');
    }
    
    const h2c = (window as any).html2canvas;
    
    // Higher scale to prevent blur - dynamic based on element size
    const elementWidth = el.offsetWidth;
    const scale = elementWidth < 800 ? 2.5 : elementWidth < 1200 ? 2.2 : 2.0;
    
    // Ensure fonts loaded before capture
    if ((document as any).fonts?.ready) {
      try { 
        await (document as any).fonts.ready; 
      } catch { 
        /* ignore */ 
      }
    }

    // Additional delay to ensure rendering is complete
    await new Promise(resolve => setTimeout(resolve, 200));

    const canvas: HTMLCanvasElement = await h2c(el, {
      scale,
      useCORS: true,
      allowTaint: false,
      backgroundColor: opts?.dark ? '#1e1e1e' : '#ffffff',
      logging: false,
      removeContainer: true,
      imageTimeout: 10000, // Increased timeout
      pixelRatio: window.devicePixelRatio || 1, // Use device pixel ratio
      quality: 1, // Maximum quality
      width: el.scrollWidth,
      height: el.scrollHeight,
      scrollX: 0,
      scrollY: 0,
      // Better handling of fonts and text
      letterRendering: true,
      // Improved element handling
      ignoreElements: (element: Element) => {
        // Skip problematic elements
        return element.classList.contains('service-tooltip') ||
               element.classList.contains('tooltip-arrow') ||
               element.classList.contains('no-print') ||
               element.tagName === 'SCRIPT' ||
               element.tagName === 'STYLE';
      },
      onclone: (clonedDoc: Document) => {
        // Ensure all styles are properly cloned
        const clonedElement = clonedDoc.querySelector('.modernization-planning, .general-info') as HTMLElement;
        if (clonedElement) {
          // Force visibility and positioning
          clonedElement.style.visibility = 'visible';
          clonedElement.style.opacity = '1';
          clonedElement.style.transform = 'none';
          clonedElement.style.position = 'static';
        }
      }
    });
    return canvas;
  }

  private isCanvasBlank(canvas: HTMLCanvasElement): boolean {
    try {
      const sampleSize = 15;
      const temp = document.createElement('canvas');
      temp.width = sampleSize;
      temp.height = sampleSize;
      const tctx = temp.getContext('2d');
      if (!tctx) return false;
      
      tctx.drawImage(canvas, 0, 0, sampleSize, sampleSize);
      const data = tctx.getImageData(0, 0, sampleSize, sampleSize).data;
      
      let sum = 0; 
      let sumSq = 0; 
      const n = sampleSize * sampleSize;
      
      for (let i = 0; i < data.length; i += 4) {
        const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        sum += lum; 
        sumSq += lum * lum;
      }
      
      const mean = sum / n;
      const variance = (sumSq / n) - (mean * mean);
      
      // Very low variance & high mean => almost white
      return variance < 5 && mean > 240;
    } catch {
      return false;
    }
  }

  private paintPageBackground(pdf: any, dark: boolean) {
    if (!dark) return;
    const w = pdf.internal.pageSize.getWidth();
    const h = pdf.internal.pageSize.getHeight();
    pdf.setFillColor(30, 30, 30);
    pdf.rect(0, 0, w, h, 'F');
  }

  private sliceCanvasVertically(canvas: HTMLCanvasElement, pageHeightMm: number, pageWidthMm: number): HTMLCanvasElement[] {
    const slices: HTMLCanvasElement[] = [];
    const pxPerMm = canvas.width / pageWidthMm;
    const pagePixelHeight = Math.floor(pageHeightMm * pxPerMm);

    if (pagePixelHeight <= 0) return slices;

    let y = 0;
    while (y < canvas.height) {
      const remaining = canvas.height - y;
      const sliceH = Math.min(pagePixelHeight, remaining);
      if (sliceH < 5) break;
      
      const sliceCanvas = document.createElement('canvas');
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = sliceH;
      const ctx = sliceCanvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(canvas, 0, y, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
      }
      slices.push(sliceCanvas);
      y += sliceH;
    }
    return slices;
  }

  private buildFileName(mode: DossierPrintMode): string {
    const date = new Date().toISOString().substring(0, 10);
    return `dossier-${mode}-${date}.pdf`;
  }

  // Cleanup method for preventing memory leaks
  ngOnDestroy(): void {
    this.elementCache.clear();
    if (this.qualityStyleEl) {
      this.qualityStyleEl.remove();
      this.qualityStyleEl = null;
    }
    this.processedElements.clear();
    this.isProcessing = false;
  }
}
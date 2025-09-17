// filepath: c:\Users\loran\enval-pro-dossier\dossier\src\app\services\print-pdf.service.ts
import { Injectable } from '@angular/core';

export type DossierPrintMode = 'kunde' | 'lv' | 'bank';

interface CapturedSection {
  name: string;
  canvas: HTMLCanvasElement;
}

@Injectable({ providedIn: 'root' })
export class PrintPdfService {
  private pageFormat = 'a4';
  private margin = 8; // mm
  private dpi = 192; // capture scale baseline (192/96 = 2x)
  private libsLoaded = false;
  private qualityStyleEl: HTMLStyleElement | null = null; // NEW: hold injected style

  constructor() {}

  // Capture full dossier into PDF
  async generateDossierPDF(mode: DossierPrintMode, options?: {
    rootSelector?: string;
    sectionSelectors?: string[];
    excludeSelectors?: string[];
    fileName?: string;
    darkBackground?: boolean;
    scrollPauseMs?: number;
  }): Promise<void> {
    await this.ensureLibraries();

    const rootSel = options?.rootSelector || '.dossier-container';
    const root = document.querySelector(rootSel) as HTMLElement | null;
    if (!root) {
      console.warn('PrintPdfService: root not found', rootSel);
      return;
    }

    const elements = this.collectSectionElements(root, options);
    if (elements.length === 0) {
      console.warn('PrintPdfService: no sections found to capture');
      return;
    }

    const hiddenTokens = this.prepareForCapture();

    try {
      const captured: CapturedSection[] = [];
      for (const el of elements) {
        await this.scrollIntoViewAndWait(el, options?.scrollPauseMs || 300);
        const canvas = await this.captureElement(el, { dark: !!options?.darkBackground });
        captured.push({ name: this.deriveSectionName(el), canvas });
      }

      await this.buildPdfFromCanvases(captured, {
        mode,
        fileName: options?.fileName,
        dark: !!options?.darkBackground
      });
    } finally {
      this.restoreAfterCapture(hiddenTokens);
    }
  }

  async printDossier(mode: DossierPrintMode, options?: { selector?: string; sectionsSelector?: string; filename?: string; }): Promise<void> {
    await this.generateDossierPDF(mode, {
      rootSelector: options?.selector || '.dossier-container',
      fileName: options?.filename,
      darkBackground: false
    });
  }

  /** Capture each tab (activated sequentially) and export combined PDF */
  async exportDossierTabs(tabs: string[], activateTab: (tab: string) => void | Promise<void>, options?: {
    fileName?: string;
    darkBackground?: boolean;
    contentSelector?: string; // selector to capture per tab
    headerSelector?: string;  // optional header to prepend
    delayMs?: number;         // wait after tab switch
  }): Promise<void> {
    await this.ensureLibraries();
    const headerSel = options?.headerSelector || '.dossier-header';
    const contentSel = options?.contentSelector || '.tab-content';
    const delay = options?.delayMs ?? 400;

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
        await this.scrollIntoViewAndWait(el, 50);
        const canvas = await this.captureElement(el, { dark: !!options?.darkBackground });
        captured.push({ name: tab, canvas });
      }

      await this.buildPdfFromCanvases(captured, {
        mode: 'kunde',
        fileName: options?.fileName || 'dossier-tabs.pdf',
        dark: !!options?.darkBackground
      });
    } finally {
      this.restoreAfterCapture(hiddenTokens);
    }
  }

  // Dynamically load libraries (html2canvas & jsPDF)
  private async ensureLibraries(): Promise<void> {
    if (this.libsLoaded) return;

    // If already present (manually added elsewhere), mark loaded
    if ((window as any).html2canvas && (window as any).jsPDF) {
      this.libsLoaded = true;
      return;
    }

    // Always load from CDN to avoid build-time module resolution issues
    await this.loadScriptOnce('https://html2canvas.hertzen.com/dist/html2canvas.min.js');
    await this.loadScriptOnce('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');

    // Map jsPDF UMD export if necessary
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

  private collectSectionElements(root: HTMLElement, options?: { sectionSelectors?: string[]; excludeSelectors?: string[]; }): HTMLElement[] {
    let list: HTMLElement[] = [];
    if (options?.sectionSelectors?.length) {
      options.sectionSelectors.forEach(sel => {
        list.push(...Array.from(root.querySelectorAll(sel)) as HTMLElement[]);
      });
    } else {
      list = Array.from(root.children) as HTMLElement[];
    }

    if (options?.excludeSelectors?.length) {
      list = list.filter(el => !options.excludeSelectors!.some(ex => el.matches(ex)));
    }

    list = list.filter(el => !el.classList.contains('print-section'));
    return list;
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
      if (node.classList.contains('edit-button') || node.classList.contains('action-buttons') || txt === 'bearbeiten' || txt.startsWith('bearbeiten')) {
        hidden.push({ element: node, previous: node.style.display });
        node.style.display = 'none';
      }
    });

    if (!this.qualityStyleEl) {
      this.qualityStyleEl = document.createElement('style');
      this.qualityStyleEl.id = 'pdf-capture-quality-style';
      this.qualityStyleEl.textContent = `
        * { animation: none !important; transition: none !important; }
        body, html { -webkit-font-smoothing: antialiased; }
        canvas { image-rendering: optimizeQuality; }
        /* Ensure edit UI hidden even if dynamically re-added */
        .edit-button, .action-buttons { display: none !important; }
      `;
      document.head.appendChild(this.qualityStyleEl);
    }
    window.scrollTo(0, 0);
    return hidden;
  }

  private restoreAfterCapture(hidden: { element: HTMLElement; previous: string }[]): void {
    hidden.forEach(item => item.element.style.display = item.previous);
    // NEW: remove injected style
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
    const h2c = (window as any).html2canvas;
    // NEW: dynamic high-resolution scale (cap at 3 to control memory)
    const deviceScale = (window.devicePixelRatio || 1);
    const scale = Math.min(3, deviceScale * 2); // previously this.dpi/96 (~2)
    // Ensure fonts loaded before capture for sharper text
    if ((document as any).fonts?.ready) {
      try { await (document as any).fonts.ready; } catch { /* ignore */ }
    }
    const canvas: HTMLCanvasElement = await h2c(el, {
      scale,
      useCORS: true,
      backgroundColor: opts?.dark ? '#1e1e1e' : '#ffffff',
      logging: false,
      removeContainer: true
    });
    return canvas;
  }

  private async buildPdfFromCanvases(sections: CapturedSection[], cfg: { mode: DossierPrintMode; fileName?: string; dark: boolean }): Promise<void> {
    const jsPDFCtor = (window as any).jsPDF;
    const pdf = new jsPDFCtor({ orientation: 'p', unit: 'mm', format: this.pageFormat });
    const fullWidth = pdf.internal.pageSize.getWidth();
    const fullHeight = pdf.internal.pageSize.getHeight();
    const pageWidth = fullWidth - this.margin * 2;
    const pageHeight = fullHeight - this.margin * 2;
    let first = true;

    const tryAddCanvas = (canvas: HTMLCanvasElement) => {
      if (!canvas || canvas.width < 10 || canvas.height < 10) return false;
      if (this.isCanvasBlank(canvas)) return false; // skip visually blank
      const scaledHeight = (canvas.height * pageWidth) / canvas.width;
      if (scaledHeight <= 1) return false;
      if (!first) pdf.addPage();
      this.paintPageBackground(pdf, cfg.dark);
      try {
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', this.margin, this.margin, pageWidth, scaledHeight, undefined, 'FAST');
        first = false;
        return true;
      } catch (e) {
        // If adding fails, remove the page we just added (if not first) by discarding & recreating last? Simpler: ignore failure.
        return false;
      }
    };

    for (const section of sections) {
      const canvas = section.canvas;
      if (!canvas) continue;
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

    // If still no pages added (all blank), add a simple notice page
    if (first) {
      this.paintPageBackground(pdf, cfg.dark);
      pdf.setFontSize(12);
      pdf.text('Keine Inhalte zum Drucken gefunden.', this.margin, 30);
    }

    pdf.save(cfg.fileName || this.buildFileName(cfg.mode));
  }

  // Simple blank detection: downscale to 20x20 and check variance
  private isCanvasBlank(canvas: HTMLCanvasElement): boolean {
    try {
      const sampleSize = 20;
      const temp = document.createElement('canvas');
      temp.width = sampleSize;
      temp.height = sampleSize;
      const tctx = temp.getContext('2d');
      if (!tctx) return false;
      tctx.drawImage(canvas, 0, 0, sampleSize, sampleSize);
      const data = tctx.getImageData(0, 0, sampleSize, sampleSize).data;
      let sum = 0; let sumSq = 0; const n = sampleSize * sampleSize;
      for (let i = 0; i < data.length; i += 4) {
        // luminance approx
        const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        sum += lum; sumSq += lum * lum;
      }
      const mean = sum / n;
      const variance = (sumSq / n) - (mean * mean);
      // very low variance & high mean => almost white
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
      if (sliceH < 5) break; // avoid near-empty tail producing blank page
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
}

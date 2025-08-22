// simple3d-model.component.ts - ENHANCED WITH COLLAPSIBLE SCREENSHOT FUNCTIONALITY
import {
  Component,
  Input,
  Output,
  EventEmitter,
  AfterViewInit,
  OnChanges,
  SimpleChanges,
  OnDestroy,
  ViewChild,
  ElementRef,
  Inject,
  PLATFORM_ID
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { Building3DService } from '../../services/building-3d.service';

export interface ModelScreenshot {
  id: string;
  dataUrl: string;
  timestamp: Date;
  viewName: string;
  cameraPosition: { x: number; y: number; z: number };
  cameraTarget: { x: number; y: number; z: number };
}

@Component({
  selector: 'app-simple3d-model',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="model-container">
      <!-- Loading State -->
      <div *ngIf="isLoading" class="loading-state">
        <div class="spinner"></div>
        <p>3D-Modell wird geladen...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="hasError && !isLoading" class="error-state">
        <div class="error-icon">⚠️</div>
        <p>{{ errorMessage }}</p>
        <button (click)="retry()" class="retry-btn">Erneut versuchen</button>
      </div>

      <!-- No Model State -->
      <div *ngIf="!hasModel && !isLoading && !hasError" class="no-model-state">
        <div class="no-model-icon">🏢</div>
        <p>Kein 3D-Modell verfügbar</p>
        <small>Für diese Adresse ist kein 3D-Modell verfügbar</small>
      </div>

      <!-- 3D Canvas - Full Width -->
      <div 
        #canvas 
        class="canvas-container"
        [style.display]="isLoading || hasError || !hasModel ? 'none' : 'block'"
      ></div>

      <!-- Screenshot Toggle Button - Always show when model is loaded -->
      <div *ngIf="hasModel && !isLoading && !hasError && !isScreenshotPanelOpen" class="screenshot-toggle">
        <button 
          class="toggle-btn"
          (click)="toggleScreenshotPanel()"
          title="Screenshot-Panel öffnen">
          <span class="toggle-icon">📸</span>
          <span class="toggle-text">Screenshots</span>
          <span class="screenshot-count" *ngIf="screenshots.length > 0">{{ screenshots.length }}</span>
        </button>
      </div>

      <!-- Screenshot Controls Panel -->
      <div 
        *ngIf="hasModel && !isLoading && !hasError && isScreenshotPanelOpen" 
        class="screenshot-controls">
        
        <!-- Panel Header with Close Button -->
        <div class="panel-header">
          <h4 class="panel-title">📸 Ansichten erfassen</h4>
          <button 
            class="close-btn"
            (click)="toggleScreenshotPanel()"
            title="Panel schließen">
            ✕
          </button>
        </div>
        
        <div class="screenshot-section">
          <div class="screenshot-buttons">
            <button 
              class="screenshot-btn preset-btn"
              (click)="capturePresetView('front')"
              [disabled]="isCapturing"
              title="Frontansicht erfassen">
              🏠 Vorne
            </button>
            <button 
              class="screenshot-btn preset-btn"
              (click)="capturePresetView('back')"
              [disabled]="isCapturing"
              title="Rückansicht erfassen">
              🔄 Hinten
            </button>
            <button 
              class="screenshot-btn preset-btn"
              (click)="capturePresetView('left')"
              [disabled]="isCapturing"
              title="Linke Seite erfassen">
              ⬅️ Links
            </button>
            <button 
              class="screenshot-btn preset-btn"
              (click)="capturePresetView('right')"
              [disabled]="isCapturing"
              title="Rechte Seite erfassen">
              ➡️ Rechts
            </button>
            <button 
              class="screenshot-btn custom-btn"
              (click)="captureCurrentView()"
              [disabled]="isCapturing"
              title="Aktuelle Ansicht erfassen">
              📷 Aktuelle Ansicht
            </button>
          </div>
          
          <!-- Screenshot Status -->
          <div *ngIf="isCapturing" class="capture-status">
            <div class="capture-spinner"></div>
            <span>Erfasse Ansicht...</span>
          </div>
        </div>

        <!-- Captured Screenshots Grid -->
        <div *ngIf="screenshots.length > 0" class="screenshots-grid">
          <div class="screenshots-content">
            <h5 class="screenshots-title">Erfasste Ansichten ({{ screenshots.length }}/4)</h5>
            <div class="screenshots-list">
              <div 
                *ngFor="let screenshot of screenshots; let i = index" 
                class="screenshot-item"
                [class.selected]="selectedScreenshot?.id === screenshot.id">
                <div class="screenshot-preview">
                  <img 
                    [src]="screenshot.dataUrl" 
                    [alt]="screenshot.viewName"
                    class="screenshot-image"
                    (click)="selectScreenshot(screenshot)">
                  <div class="screenshot-overlay">
                    <button 
                      class="overlay-btn view-btn"
                      (click)="restoreView(screenshot)"
                      title="Ansicht wiederherstellen">
                      👁️
                    </button>
                    <button 
                      class="overlay-btn delete-btn"
                      (click)="deleteScreenshot(screenshot.id)"
                      title="Ansicht löschen">
                      🗑️
                    </button>
                  </div>
                </div>
                <div class="screenshot-info">
                  <span class="screenshot-name">{{ screenshot.viewName }}</span>
                  <span class="screenshot-time">{{ formatTime(screenshot.timestamp) }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Action Buttons -->
          <div class="screenshot-actions">
            <button 
              class="action-btn clear-btn"
              (click)="clearAllScreenshots()"
              [disabled]="screenshots.length === 0">
              🗑️ Alle löschen
            </button>
            <button 
              class="action-btn send-btn"
              (click)="sendScreenshotsToParent()"
              [disabled]="screenshots.length === 0">
              📤 Für Druck übernehmen ({{ screenshots.length }})
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block !important;
      width: 100% !important;
      height: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
      max-width: none !important;
      box-sizing: border-box !important;
    }

    .model-container {
      position: relative;
      width: 100% !important;
      height: 100% !important;
      min-height: 500px;
      border-radius: 0 !important;
      overflow: hidden;
      background: linear-gradient(135deg, #f5f9ff 0%, #e8f2ff 100%);
      margin: 0 !important;
      padding: 0 !important;
      max-width: none !important;
      box-sizing: border-box !important;
    }

    .canvas-container {
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      width: 100% !important;
      height: 100% !important;
      min-height: 500px;
      cursor: grab;
      margin: 0 !important;
      padding: 0 !important;
      max-width: none !important;
      box-sizing: border-box !important;
    }

    .canvas-container canvas {
      width: 100% !important;
      height: 100% !important;
      display: block !important;
      margin: 0 !important;
      padding: 0 !important;
      max-width: none !important;
    }

    .canvas-container:active {
      cursor: grabbing;
    }

    .loading-state,
    .error-state,
    .no-model-state {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 20px;
      z-index: 10;
      background: rgba(245, 249, 255, 0.95);
      backdrop-filter: blur(10px);
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(59, 130, 246, 0.3);
      border-top: 3px solid #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 16px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .error-icon,
    .no-model-icon {
      font-size: 48px;
      margin-bottom: 12px;
      opacity: 0.6;
    }

    .loading-state p,
    .error-state p,
    .no-model-state p {
      margin: 0 0 8px 0;
      font-size: 16px;
      font-weight: 500;
      color: #374151;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }

    .no-model-state small {
      color: #6b7280;
      font-size: 14px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }

    .retry-btn {
      margin-top: 12px;
      padding: 8px 16px;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s ease;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
    }

    .retry-btn:hover {
      background: #2563eb;
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
    }

    /* Screenshot Toggle Button */
    .screenshot-toggle {
      position: absolute;
      top: 20px;
      right: 20px;
      z-index: 90;
    }

    .toggle-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(0, 113, 227, 0.2);
      border-radius: 12px;
      color: #0071e3;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
      position: relative;
    }

    .toggle-btn:hover {
      background: rgba(0, 113, 227, 0.05);
      border-color: #0071e3;
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
    }

    .toggle-btn.active {
      background: #0071e3;
      color: white;
      border-color: #0071e3;
    }

    .toggle-btn.active:hover {
      background: #005bb5;
    }

    .toggle-icon {
      font-size: 16px;
    }

    .toggle-text {
      font-size: 13px;
    }

    .screenshot-count {
      background: #ff3b30;
      color: white;
      font-size: 10px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 10px;
      min-width: 16px;
      text-align: center;
      line-height: 1.2;
    }

    .toggle-btn.active .screenshot-count {
      background: rgba(255, 255, 255, 0.3);
    }

    /* Screenshot Controls Panel */
    .screenshot-controls {
      position: absolute;
      top: 20px;
      right: 20px;
      bottom: 20px;
      width: 320px;
      max-height: calc(100vh - 40px);
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border-radius: 16px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
      z-index: 100;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      overflow-y: auto;
      overflow-x: hidden;
      
      /* Animation */
      transform: translateX(100%);
      opacity: 0;
      animation: slideIn 0.3s ease-out forwards;
      
      /* Scrollbar styling */
      scrollbar-width: auto;
      scrollbar-color: #0071e3 rgba(0, 0, 0, 0.1);
    }

    @keyframes slideIn {
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    .screenshot-controls::-webkit-scrollbar {
      width: 8px;
      background: rgba(0, 0, 0, 0.1);
    }

    .screenshot-controls::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0.05);
      border-radius: 4px;
    }

    .screenshot-controls::-webkit-scrollbar-thumb {
      background: #0071e3;
      border-radius: 4px;
      border: 1px solid rgba(255, 255, 255, 0.3);
    }

    .screenshot-controls::-webkit-scrollbar-thumb:hover {
      background: #005bb5;
    }

    /* Panel Header */
    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.1);
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(10px);
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .panel-title {
      margin: 0;
      font-size: 15px;
      font-weight: 600;
      color: #1d1d1f;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .close-btn {
      width: 28px;
      height: 28px;
      border: none;
      border-radius: 6px;
      background: rgba(0, 0, 0, 0.1);
      color: #666;
      cursor: pointer;
      font-size: 12px;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }

    .close-btn:hover {
      background: #ff3b30;
      color: white;
    }

    .screenshot-section {
      padding: 16px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    }

    .screenshot-buttons {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-bottom: 12px;
    }

    .screenshot-btn {
      padding: 10px 12px;
      border: none;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      min-height: 40px;
    }

    .preset-btn {
      background: #f0f7ff;
      color: #0071e3;
      border: 1px solid #0071e3;
    }

    .preset-btn:hover:not(:disabled) {
      background: #0071e3;
      color: white;
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0, 113, 227, 0.3);
    }

    .custom-btn {
      background: #34c759;
      color: white;
      grid-column: 1 / -1;
      border: 1px solid #34c759;
    }

    .custom-btn:hover:not(:disabled) {
      background: #30a46c;
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(52, 199, 89, 0.3);
    }

    .screenshot-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }

    .capture-status {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
      background: #f0f7ff;
      border-radius: 8px;
      color: #0071e3;
      font-size: 12px;
      font-weight: 500;
    }

    .capture-spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(0, 113, 227, 0.3);
      border-top: 2px solid #0071e3;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    /* Screenshots Grid */
    .screenshots-grid {
      padding: 0;
    }

    .screenshots-content {
      padding: 16px;
    }

    .screenshots-title {
      margin: 0 0 12px 0;
      font-size: 13px;
      font-weight: 600;
      color: #1d1d1f;
    }

    .screenshots-list {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-bottom: 16px;
    }

    .screenshot-item {
      position: relative;
      border-radius: 8px;
      overflow: hidden;
      border: 2px solid transparent;
      transition: all 0.2s ease;
    }

    .screenshot-item.selected {
      border-color: #0071e3;
      box-shadow: 0 0 0 2px rgba(0, 113, 227, 0.2);
    }

    .screenshot-preview {
      position: relative;
      aspect-ratio: 4/3;
      overflow: hidden;
      border-radius: 6px;
      cursor: pointer;
    }

    .screenshot-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.2s ease;
    }

    .screenshot-preview:hover .screenshot-image {
      transform: scale(1.05);
    }

    .screenshot-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      opacity: 0;
      transition: opacity 0.2s ease;
    }

    .screenshot-preview:hover .screenshot-overlay {
      opacity: 1;
    }

    .overlay-btn {
      width: 32px;
      height: 32px;
      border: none;
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.9);
      color: #1d1d1f;
      cursor: pointer;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }

    .overlay-btn:hover {
      background: white;
      transform: scale(1.1);
    }

    .delete-btn:hover {
      background: #ff453a;
      color: white;
    }

    .screenshot-info {
      padding: 8px 4px 0;
      text-align: center;
    }

    .screenshot-name {
      display: block;
      font-size: 11px;
      font-weight: 600;
      color: #1d1d1f;
      margin-bottom: 2px;
    }

    .screenshot-time {
      display: block;
      font-size: 10px;
      color: #86868b;
    }

    /* Action Buttons */
    .screenshot-actions {
      display: flex;
      gap: 8px;
      padding: 12px 16px;
      border-top: 1px solid rgba(0, 0, 0, 0.1);
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      position: sticky;
      bottom: 0;
    }

    .action-btn {
      flex: 1;
      padding: 10px 12px;
      border: none;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }

    .clear-btn {
      background: #f5f5f7;
      color: #86868b;
      border: 1px solid #d1d1d6;
    }

    .clear-btn:hover:not(:disabled) {
      background: #ff453a;
      color: white;
      border-color: #ff453a;
    }

    .send-btn {
      background: #0071e3;
      color: white;
      border: 1px solid #0071e3;
    }

    .send-btn:hover:not(:disabled) {
      background: #0056b3;
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0, 113, 227, 0.3);
    }

    .action-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }

    /* Responsive Adjustments */
    @media (max-width: 768px) {
      .screenshot-toggle {
        top: 15px;
        right: 15px;
      }

      .toggle-btn {
        padding: 10px 12px;
        font-size: 12px;
      }

      .screenshot-controls {
        position: fixed;
        top: auto;
        bottom: 20px;
        right: 20px;
        left: 20px;
        width: auto;
        max-height: 70vh;
      }

      .screenshots-list {
        grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
      }
    }

    /* Small mobile screens */
    @media (max-width: 480px) {
      .screenshot-controls {
        max-height: 75vh;
      }
      
      .screenshot-buttons {
        grid-template-columns: 1fr;
        gap: 6px;
      }
      
      .custom-btn {
        grid-column: 1;
      }
    }

    /* Print Styles */
    @media print {
      .screenshot-toggle,
      .screenshot-controls {
        display: none !important;
      }
    }
  `]
})
export class Simple3DModelComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('canvas', { static: false }) canvas!: ElementRef<HTMLDivElement>;
  @Input() address: string = '';
  @Input() buildingId: string | null = null;
  
  // Screenshot functionality
  @Output() screenshotsChanged = new EventEmitter<ModelScreenshot[]>();

  isLoading = false;
  hasError = false;
  hasModel = false;
  errorMessage = '';

  // Screenshot properties
  screenshots: ModelScreenshot[] = [];
  selectedScreenshot: ModelScreenshot | null = null;
  isCapturing = false;
  isScreenshotPanelOpen = false;

  private scene?: THREE.Scene;
  private camera?: THREE.PerspectiveCamera;
  private renderer?: THREE.WebGLRenderer;
  private controls?: OrbitControls;
  private animationId?: number;
  private modelObject?: THREE.Object3D;
  private lastFrameTime: number = 0;

  // Environment enhancement properties
  private terrain?: THREE.Group;
  private sky?: Sky;
  private environmentLights: THREE.Light[] = [];

  constructor(
    private building3DService: Building3DService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        this.initScene();
        setTimeout(() => {
          this.loadModel();
        }, 0);
      }, 100);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (isPlatformBrowser(this.platformId)) {
      if (changes['address'] || changes['buildingId']) {
        setTimeout(() => {
          this.loadModel();
        }, 0);
      }
    }
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  retry(): void {
    this.hasError = false;
    this.errorMessage = '';
    setTimeout(() => {
      this.loadModel();
    }, 0);
  }

  // Panel toggle method
  toggleScreenshotPanel(): void {
    this.isScreenshotPanelOpen = !this.isScreenshotPanelOpen;
  }

  // Screenshot Methods
  async capturePresetView(view: 'front' | 'back' | 'left' | 'right'): Promise<void> {
    if (!this.camera || !this.controls || !this.modelObject) return;

    this.isCapturing = true;

    try {
      // Calculate model bounds for positioning
      const boundingBox = new THREE.Box3().setFromObject(this.modelObject);
      const size = new THREE.Vector3();
      boundingBox.getSize(size);
      const center = new THREE.Vector3();
      boundingBox.getCenter(center);

      const distance = Math.max(size.x, size.y, size.z) * 2;

      // Set camera position based on view
      switch (view) {
        case 'front':
          this.camera.position.set(0, center.y, distance);
          break;
        case 'back':
          this.camera.position.set(0, center.y, -distance);
          break;
        case 'left':
          this.camera.position.set(-distance, center.y, 0);
          break;
        case 'right':
          this.camera.position.set(distance, center.y, 0);
          break;
      }

      this.camera.lookAt(center);
      this.controls.target.copy(center);
      this.controls.update();

      // Wait for camera to settle
      await new Promise(resolve => setTimeout(resolve, 200));

      // Capture screenshot
      const viewNames = {
        front: 'Frontansicht',
        back: 'Rückansicht', 
        left: 'Linke Seite',
        right: 'Rechte Seite'
      };

      await this.captureScreenshot(viewNames[view]);

    } finally {
      this.isCapturing = false;
    }
  }

  async captureCurrentView(): Promise<void> {
    if (!this.camera || !this.controls) return;

    this.isCapturing = true;

    try {
      // Wait a moment for any ongoing animations to settle
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await this.captureScreenshot('Benutzerdefinierte Ansicht');
    } finally {
      this.isCapturing = false;
    }
  }

  private async captureScreenshot(viewName: string): Promise<void> {
    if (!this.renderer || !this.camera || !this.scene) return;

    try {
      // Render the scene
      this.renderer.render(this.scene, this.camera);

      // Get canvas data
      const canvas = this.renderer.domElement;
      const dataUrl = canvas.toDataURL('image/png', 0.9);

      // Store camera position and target
      const cameraPosition = {
        x: this.camera.position.x,
        y: this.camera.position.y,
        z: this.camera.position.z
      };

      const cameraTarget = {
        x: this.controls?.target.x || 0,
        y: this.controls?.target.y || 0,
        z: this.controls?.target.z || 0
      };

      // Create screenshot object
      const screenshot: ModelScreenshot = {
        id: `screenshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        dataUrl,
        timestamp: new Date(),
        viewName,
        cameraPosition,
        cameraTarget
      };

      // Add to screenshots array (max 4)
      this.screenshots.push(screenshot);
      if (this.screenshots.length > 4) {
        this.screenshots.shift(); // Remove oldest if more than 4
      }

      // Emit changes
      this.screenshotsChanged.emit([...this.screenshots]);

    } catch (error) {
      console.error('Error capturing screenshot:', error);
    }
  }

  restoreView(screenshot: ModelScreenshot): void {
    if (!this.camera || !this.controls) return;

    // Restore camera position and target
    this.camera.position.set(
      screenshot.cameraPosition.x,
      screenshot.cameraPosition.y,
      screenshot.cameraPosition.z
    );

    this.controls.target.set(
      screenshot.cameraTarget.x,
      screenshot.cameraTarget.y,
      screenshot.cameraTarget.z
    );

    this.controls.update();
  }

  selectScreenshot(screenshot: ModelScreenshot): void {
    this.selectedScreenshot = this.selectedScreenshot?.id === screenshot.id ? null : screenshot;
  }

  deleteScreenshot(screenshotId: string): void {
    this.screenshots = this.screenshots.filter(s => s.id !== screenshotId);
    if (this.selectedScreenshot?.id === screenshotId) {
      this.selectedScreenshot = null;
    }
    this.screenshotsChanged.emit([...this.screenshots]);
  }

  clearAllScreenshots(): void {
    this.screenshots = [];
    this.selectedScreenshot = null;
    this.screenshotsChanged.emit([]);
  }

  sendScreenshotsToParent(): void {
    this.screenshotsChanged.emit([...this.screenshots]);
  }

  formatTime(timestamp: Date): string {
    return timestamp.toLocaleTimeString('de-DE', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  // ... (rest of the existing methods remain the same)
  private initScene(): void {
    if (!this.canvas) {
      return;
    }

    const container = this.canvas.nativeElement;
    let width = container.clientWidth;
    let height = container.clientHeight;
    
    if (width === 0 || width < window.innerWidth * 0.8) {
      width = window.innerWidth;
      height = Math.max(500, window.innerHeight * 0.6);
      container.style.width = width + 'px';
      container.style.height = height + 'px';
    }

    if (width === 0 || height === 0) {
      width = window.innerWidth;
      height = 500;
      container.style.width = width + 'px';
      container.style.height = height + 'px';
    }

    try {
      // Enhanced scene setup
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0xf5f9ff);
      this.scene.fog = new THREE.FogExp2(0xf5f9ff, 0.005);

      // Enhanced camera
      this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 10000);
      this.camera.position.set(15, 15, 15);

      // Enhanced renderer
      this.renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: true // Important for screenshots
      });
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(window.devicePixelRatio);
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.2;
      
      this.renderer.domElement.style.width = '100%';
      this.renderer.domElement.style.height = '100%';
      this.renderer.domElement.style.display = 'block';
      
      container.appendChild(this.renderer.domElement);

      // Enhanced controls
      this.controls = new OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.2;
      this.controls.rotateSpeed = 0.7;
      this.controls.zoomSpeed = 0.7;
      this.controls.panSpeed = 0.7;
      this.controls.enableZoom = true;
      this.controls.minDistance = 0.5;
      this.controls.maxDistance = 100;

      // Handle context loss
      this.renderer.domElement.addEventListener('webglcontextlost', (event) => {
        console.warn('WebGL context lost. Trying to restore...');
        event.preventDefault();
        this.recreateRenderer();
      }, false);

      // Resize handler
      if (isPlatformBrowser(this.platformId)) {
        window.addEventListener('resize', () => this.onResize());
      }

      // Create enhanced environment
      this.createEnvironment();

      // Start animation loop
      this.lastFrameTime = performance.now();
      this.animate();

    } catch (error) {
      this.hasError = true;
      this.errorMessage = 'Fehler beim Initialisieren des 3D-Viewers';
    }
  }

  // ... (all other existing methods remain exactly the same)
  private createEnvironment(): void {
    if (!this.scene || !this.camera) return;
    
    // Create premium lighting
    this.addPremiumLighting();
    
    // Create terrain
    this.createTerrain();
    
    // Create sky
    this.createSky();
  }

  private addPremiumLighting(): void {
    if (!this.scene) return;
    
    // Remove existing lights
    for (const light of this.environmentLights) {
      this.scene.remove(light);
    }
    this.environmentLights = [];
    
    // Primary directional light (sun)
    const mainLight = new THREE.DirectionalLight(0xffffff, 1.5);
    mainLight.position.set(50, 100, 75);
    mainLight.castShadow = true;
    
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 500;
    mainLight.shadow.bias = -0.0001;
    
    const shadowSize = 100;
    mainLight.shadow.camera.left = -shadowSize;
    mainLight.shadow.camera.bottom = -shadowSize;
    mainLight.shadow.camera.right = shadowSize;
    mainLight.shadow.camera.top = shadowSize;
    
    this.scene.add(mainLight);
    this.environmentLights.push(mainLight);
    
    // Ambient hemisphere light
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x3333ff, 0.6);
    this.scene.add(hemiLight);
    this.environmentLights.push(hemiLight);
    
    // Fill lights
    const fillLight1 = new THREE.DirectionalLight(0xffffff, 0.5);
    fillLight1.position.set(-50, 50, -75);
    this.scene.add(fillLight1);
    this.environmentLights.push(fillLight1);
    
    const fillLight2 = new THREE.DirectionalLight(0xffffee, 0.3);
    fillLight2.position.set(100, 25, -100);
    this.scene.add(fillLight2);
    this.environmentLights.push(fillLight2);
    
    // Ground bounce light
    const bounceLight = new THREE.DirectionalLight(0xccffcc, 0.2);
    bounceLight.position.set(0, -10, 0);
    bounceLight.target.position.set(0, 0, 0);
    this.scene.add(bounceLight);
    this.scene.add(bounceLight.target);
    this.environmentLights.push(bounceLight);
  }

  private createTerrain(): void {
    if (!this.scene) return;
    
    if (this.terrain) {
      this.scene.remove(this.terrain);
    }
    
    this.terrain = new THREE.Group();
    this.terrain.name = "terrain";
    
    const gridSize = this.modelObject ? 
      new THREE.Box3().setFromObject(this.modelObject).getSize(new THREE.Vector3()).length() * 3 : 
      300;
    
    const groundSize = gridSize;
    const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize, 32, 32);
    
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0xeee9d9,
      roughness: 0.88,
      metalness: 0.02,
      side: THREE.DoubleSide,
    });
    
    // Add procedural texture
    const textureSize = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = textureSize;
    canvas.height = textureSize;
    const context = canvas.getContext('2d')!;
    
    context.fillStyle = '#edebe0';
    context.fillRect(0, 0, textureSize, textureSize);
    
    for (let i = 0; i < 50000; i++) {
      const x = Math.random() * textureSize;
      const y = Math.random() * textureSize;
      const size = Math.random() * 3 + 1;
      const opacity = Math.random() * 0.07;
      
      context.fillStyle = `rgba(0, 0, 0, ${opacity})`;
      context.fillRect(x, y, size, size);
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(20, 20);
    
    groundMaterial.map = texture;
    
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.02;
    ground.receiveShadow = true;
    ground.name = "groundPlane";
    
    this.terrain.add(ground);
    
    // Add water feature
    this.addWaterFeature(groundSize * 0.3);
    
    this.scene.add(this.terrain);
  }

  private addWaterFeature(size: number): void {
    if (!this.terrain) return;
    
    const waterPosition = new THREE.Vector3(size * 0.5, -0.05, size * 0.5);
    
    const waterGeometry = new THREE.PlaneGeometry(size * 0.4, size * 0.3);
    const waterMaterial = new THREE.MeshPhongMaterial({
      color: 0x0055aa,
      shininess: 100,
      transparent: true,
      opacity: 0.8,
    });
    
    const water = new THREE.Mesh(waterGeometry, waterMaterial);
    water.rotation.x = -Math.PI / 2;
    water.position.copy(waterPosition);
    water.name = "waterFeature";
    
    this.terrain.add(water);
  }

  private createSky(): void {
    if (!this.scene) return;
    
    if (this.sky) {
      this.scene.remove(this.sky);
    }
    
    this.sky = new Sky();
    this.sky.scale.setScalar(10000);
    
    const uniforms = this.sky.material.uniforms;
    uniforms['turbidity'].value = 10;
    uniforms['rayleigh'].value = 2;
    uniforms['mieCoefficient'].value = 0.005;
    uniforms['mieDirectionalG'].value = 0.8;
    
    const phi = THREE.MathUtils.degToRad(60);
    const theta = THREE.MathUtils.degToRad(135);
    
    const sunPosition = new THREE.Vector3();
    sunPosition.setFromSphericalCoords(1, phi, theta);
    uniforms['sunPosition'].value.copy(sunPosition);
    
    this.scene.add(this.sky);
  }

  private recreateRenderer(): void {
    if (!this.canvas) return;
    
    const container = this.canvas.nativeElement;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;
    
    if (this.renderer) {
      container.removeChild(this.renderer.domElement);
      this.renderer.dispose();
    }
    
    try {
      this.renderer = new THREE.WebGLRenderer({ 
        antialias: true, 
        alpha: true,
        powerPreference: 'default',
        preserveDrawingBuffer: true
      });
      this.renderer.setSize(width, height);
      container.appendChild(this.renderer.domElement);
      
      if (this.camera) {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.2;
        this.controls.rotateSpeed = 0.7;
        this.controls.zoomSpeed = 0.7;
        this.controls.panSpeed = 0.7;
        this.controls.enableZoom = true;
        this.controls.minDistance = 0.5;
        this.controls.maxDistance = 100;
      }
    } catch (e) {
      console.error('Failed to recreate renderer:', e);
    }
  }

  private onResize(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (!this.canvas || !this.camera || !this.renderer) return;

    const container = this.canvas.nativeElement;
    const width = window.innerWidth;
    const height = Math.max(500, container.clientHeight);

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
  }

  private async loadModel(): Promise<void> {
    if (!this.scene) {
      return;
    }

    setTimeout(() => {
      this.isLoading = true;
      this.hasError = false;
      this.hasModel = false;
      this.errorMessage = '';
    }, 0);

    try {
      let targetBuildingId: string | null = this.buildingId;

      if (!targetBuildingId && this.address) {
        const result = await this.building3DService.getBuildingIdByAddress(this.address).toPromise();
        targetBuildingId = result || null;
      }

      if (!targetBuildingId) {
        setTimeout(() => {
          this.isLoading = false;
          this.hasModel = false;
        }, 0);
        return;
      }

      const model = await this.building3DService.getBuilding3DModel(targetBuildingId).toPromise();

      if (model) {
        this.parseAndAddModel(model.objData);
        setTimeout(() => {
          this.hasModel = true;
        }, 0);
      } else {
        setTimeout(() => {
          this.hasModel = false;
        }, 0);
      }

    } catch (error) {
      setTimeout(() => {
        this.hasError = true;
        this.errorMessage = 'Fehler beim Laden des 3D-Modells';
      }, 0);
    } finally {
      setTimeout(() => {
        this.isLoading = false;
      }, 0);
    }
  }

  private parseAndAddModel(objData: string): void {
    if (!this.scene || !this.camera || !this.controls) {
      return;
    }

    try {
      // Clear existing models
      const existingModels = this.scene.children.filter((child: THREE.Object3D) => child.userData['isModel']);
      existingModels.forEach((model: THREE.Object3D) => this.scene!.remove(model));

      // Parse OBJ
      const loader = new OBJLoader();
      const objRoot = loader.parse(objData);

      if (objRoot.children.length === 0) {
        throw new Error('Empty OBJ model');
      }

      // Create a new group for the corrected model
      const rootGroup = new THREE.Group();

      // Correct orientation (Z-up to Y-up)
      objRoot.traverse((child: THREE.Object3D) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.rotateX(-Math.PI / 2);
          child.geometry.computeBoundingBox();
          child.geometry.computeBoundingSphere();
          child.position.set(0, 0, 0);
          child.rotation.set(0, 0, 0);
          child.scale.set(1, 1, 1);
        }
      });

      // Calculate bounding box and center model
      const correctedBoundingBox = new THREE.Box3().setFromObject(objRoot);
      const correctedCenter = correctedBoundingBox.getCenter(new THREE.Vector3());

      // Center the model and place it on the ground
      objRoot.traverse((child: THREE.Object3D) => {
        if (child instanceof THREE.Mesh && child.geometry) {
          const position = child.geometry.getAttribute('position');
          if (position) {
            for (let i = 0; i < position.count; i++) {
              const x = position.getX(i) - correctedCenter.x;
              const y = position.getY(i) - correctedBoundingBox.min.y;
              const z = position.getZ(i) - correctedCenter.z;
              position.setXYZ(i, x, y, z);
            }
            position.needsUpdate = true;
            child.geometry.computeBoundingBox();
            child.geometry.computeBoundingSphere();
          }
        }
      });

      rootGroup.rotation.set(0, 0, 0);
      rootGroup.add(objRoot);

      // Apply enhanced PBR materials
      const meshes: THREE.Mesh[] = [];
      objRoot.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          meshes.push(child);
        }
      });

      if (meshes.length === 0) {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
        const cube = new THREE.Mesh(geometry, material);
        rootGroup.add(cube);
      } else {
        // Apply different materials to different parts
        const materials = [
          // Glass material
          new THREE.MeshPhysicalMaterial({
            color: 0xbedcff,
            metalness: 0.1,
            roughness: 0.05,
            transparent: true,
            opacity: 0.6,
            clearcoat: 1.0,
            clearcoatRoughness: 0.1
          }),
          // Concrete material
          new THREE.MeshStandardMaterial({
            color: 0xf0f0f0,
            metalness: 0.1,
            roughness: 0.7,
          }),
          // Metal material
          new THREE.MeshStandardMaterial({
            color: 0xaaaaaa,
            metalness: 0.8,
            roughness: 0.2,
          })
        ];
        
        for (let i = 0; i < meshes.length; i++) {
          const mesh = meshes[i];
          const materialIndex = i % materials.length;
          mesh.material = materials[materialIndex];
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          
          // Add subtle edge lines for architectural look
          const edges = new THREE.EdgesGeometry(mesh.geometry, 25);
          const lineMaterial = new THREE.LineBasicMaterial({ 
            color: 0x333333,
            opacity: 0.5,
            transparent: true,
            linewidth: 1
          });
          const edgeLines = new THREE.LineSegments(edges, lineMaterial);
          mesh.add(edgeLines);
        }
      }

      // Mark as model and add to scene
      rootGroup.userData['isModel'] = true;
      this.modelObject = rootGroup;
      this.scene.add(rootGroup);

      // Position camera for optimal view
      const finalBoundingBox = new THREE.Box3().setFromObject(rootGroup);
      const finalSize = new THREE.Vector3();
      finalBoundingBox.getSize(finalSize);
      
      const distance = Math.max(finalSize.x, finalSize.y, finalSize.z) * 3;
      this.camera.position.set(distance, distance * 0.7, distance);
      this.camera.lookAt(0, finalSize.y/2, 0);
      
      this.controls.target.set(0, finalSize.y/2, 0);
      this.controls.update();

      // Recreate environment with model-based sizing
      this.createEnvironment();

    } catch (error) {
      setTimeout(() => {
        this.hasError = true;
        this.errorMessage = 'Fehler beim Verarbeiten des 3D-Modells';
      }, 0);
    }
  }

  private animate = (): void => {
    if (!this.renderer || !this.scene || !this.camera) return;

    this.animationId = requestAnimationFrame(this.animate);
    
    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastFrameTime) / 1000;
    this.lastFrameTime = currentTime;
    
    if (deltaTime < 0.1) {
      this.controls?.update();
    }
    
    // Add subtle water animation if present
    if (this.terrain) {
      const water = this.terrain.getObjectByName("waterFeature") as THREE.Mesh;
      if (water && water.material instanceof THREE.MeshPhongMaterial) {
        const time = currentTime * 0.001;
        const r = 0.0;
        const g = 0.2 + Math.sin(time * 0.3) * 0.05;
        const b = 0.5 + Math.sin(time * 0.5) * 0.1;
        water.material.color.setRGB(r, g, b);
      }
    }
    
    this.renderer.render(this.scene, this.camera);
  };

  private cleanup(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    
    if (this.renderer) {
      this.renderer.dispose();
    }
    
    if (this.scene) {
      this.scene.clear();
    }
    
    if (isPlatformBrowser(this.platformId)) {
      window.removeEventListener('resize', this.onResize);
    }
  }
}
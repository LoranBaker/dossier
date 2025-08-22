export interface ModelScreenshot {
  id: string;
  dataUrl: string;
  timestamp: Date;
  viewName: string;
  cameraPosition: { x: number; y: number; z: number };
  cameraTarget: { x: number; y: number; z: number };
}

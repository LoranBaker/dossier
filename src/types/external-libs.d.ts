// Ambient declarations for external libs used via dynamic import or CDN
// Prevent TypeScript compile errors if packages not installed yet.

declare module 'html2canvas' {
  const html2canvas: any;
  export default html2canvas;
}

declare module 'jspdf' {
  export const jsPDF: any;
  export default jsPDF;
}

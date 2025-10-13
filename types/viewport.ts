/**
 * Viewport types for canvas pan/zoom functionality
 */

export interface ViewportState {
  // Current zoom level (1 = 100%, 0.1 = 10%, 4 = 400%)
  zoom: number;
  // Pan offset in pixels
  panX: number;
  panY: number;
}

export interface ViewportTransform {
  // Fabric.js viewport transform matrix [a, b, c, d, e, f]
  // a: horizontal scaling
  // b: horizontal skewing
  // c: vertical skewing
  // d: vertical scaling
  // e: horizontal translation (pan X)
  // f: vertical translation (pan Y)
  matrix: [number, number, number, number, number, number];
}

export interface ViewportBounds {
  minZoom: number;
  maxZoom: number;
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

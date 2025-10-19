/**
 * Constants for shapes, canvas, and viewport
 */

// Default shape properties
export const DEFAULT_SHAPE = {
  WIDTH: 100,
  HEIGHT: 100,
  FILL_COLOR: "#A0A0A0", // Darker gray (default color for all shapes)
} as const;

// Default text properties
export const DEFAULT_TEXT = {
  TEXT: "Type here...",
  FONT_SIZE: 24,
  FONT_FAMILY: "Inter, Arial, sans-serif",
  FILL_COLOR: "#000000", // Black text for light background
} as const;

// Canvas dimensions
export const CANVAS = {
  VIRTUAL_WIDTH: 5000,
  VIRTUAL_HEIGHT: 5000,
  BACKGROUND_COLOR: "#E5E5E5", // Figma-style gray
} as const;

// Zoom constraints
export const ZOOM = {
  MIN: 0.1, // 10%
  MAX: 4.0, // 400%
  DEFAULT: 1.0, // 100%
  STEP: 0.1, // 10% increment for UI controls
  WHEEL_SENSITIVITY: 0.99, // Mouse wheel zoom sensitivity (increased from 0.999)
} as const;

// Viewport persistence key
export const VIEWPORT_STORAGE_KEY = "collab-canvas-viewport";

// Performance
export const PERFORMANCE = {
  TARGET_FPS: 60,
  CURSOR_THROTTLE_MS: 50,
} as const;

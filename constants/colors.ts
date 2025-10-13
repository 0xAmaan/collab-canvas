/**
 * Color constants for shapes, cursors, and selection
 */

// Shape color palette (blue, purple, red)
export const SHAPE_COLORS = {
  BLUE: "#3b82f6", // Tailwind blue-500
  PURPLE: "#a855f7", // Tailwind purple-500
  RED: "#ef4444", // Tailwind red-500
} as const;

// Cursor color palette (same as shapes for consistency)
export const CURSOR_COLORS = {
  BLUE: "#3b82f6", // Tailwind blue-500
  PURPLE: "#a855f7", // Tailwind purple-500
  RED: "#ef4444", // Tailwind red-500
} as const;

// Selection colors
export const SELECTION_COLORS = {
  BORDER: "#2563eb", // Tailwind blue-600 (darker for contrast)
  BACKGROUND: "rgba(59, 130, 246, 0.1)", // Blue with 10% opacity
  HANDLE: "#ffffff", // White handles
  HANDLE_BORDER: "#2563eb", // Blue border for handles
} as const;

// Color arrays for easy iteration
export const SHAPE_COLOR_ARRAY = [
  SHAPE_COLORS.BLUE,
  SHAPE_COLORS.PURPLE,
  SHAPE_COLORS.RED,
] as const;

export const CURSOR_COLOR_ARRAY = [
  CURSOR_COLORS.BLUE,
  CURSOR_COLORS.PURPLE,
  CURSOR_COLORS.RED,
] as const;

// Default colors
export const DEFAULT_COLORS = {
  SHAPE: SHAPE_COLORS.BLUE,
  CURSOR: CURSOR_COLORS.BLUE,
  CANVAS_BACKGROUND: "#f9fafb", // Tailwind gray-50
} as const;

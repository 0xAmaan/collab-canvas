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
} as const;

// Color picker preset palette (matches Phase 1 requirements)
export const PRESET_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#f59e0b", // amber
  "#eab308", // yellow
  "#84cc16", // lime
  "#22c55e", // green
  "#14b8a6", // teal
  "#06b6d4", // cyan
  "#3b82f6", // blue (default)
  "#8b5cf6", // violet
  "#a855f7", // purple
  "#ec4899", // pink
  "#ffffff", // white
  "#000000", // black
] as const;

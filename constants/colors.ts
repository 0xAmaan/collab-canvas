/**
 * Color constants for selection and color picker
 */

// Selection colors
export const SELECTION_COLORS = {
  BORDER: "#2563eb", // Tailwind blue-600 (darker for contrast)
  BACKGROUND: "rgba(59, 130, 246, 0.1)", // Blue with 10% opacity
  HANDLE: "#ffffff", // White handles
  HANDLE_BORDER: "#2563eb", // Blue border for handles
} as const;

// Color picker preset palette
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

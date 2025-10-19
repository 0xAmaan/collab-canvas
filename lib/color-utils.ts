/**
 * Color utilities for assigning colors to shapes and cursors
 */

// Simplified 3-color palette (blue, purple, red) for MVP
const COLOR_PALETTE = [
  "#3b82f6", // Blue (Tailwind blue-500)
  "#a855f7", // Purple (Tailwind purple-500)
  "#ef4444", // Red (Tailwind red-500)
] as const;

/**
 * Get a color from the palette based on an index
 * Cycles through the 3-color palette
 */
export const getColorByIndex = (index: number): string => {
  return COLOR_PALETTE[index % COLOR_PALETTE.length];
};

/**
 * Get a color for a user based on their user ID
 * Uses a simple hash function to consistently assign colors
 */
export const getUserColor = (userId: string): string => {
  // Simple hash function to convert string to number
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Make it positive and get index in palette
  const index = Math.abs(hash) % COLOR_PALETTE.length;
  return COLOR_PALETTE[index];
};

/**
 * Get the next color in the palette
 */
export const getNextColor = (currentColor: string): string => {
  const currentIndex = COLOR_PALETTE.indexOf(currentColor as any);
  if (currentIndex === -1) {
    return COLOR_PALETTE[0];
  }
  return COLOR_PALETTE[(currentIndex + 1) % COLOR_PALETTE.length];
};

/**
 * Get all available colors
 */
export const getAllColors = (): readonly string[] => {
  return COLOR_PALETTE;
};

/**
 * Check if a color is in the palette
 */
export const isValidColor = (color: string): boolean => {
  return COLOR_PALETTE.includes(color as any);
};

/**
 * Get a random color from the palette
 */
export const getRandomColor = (): string => {
  const index = Math.floor(Math.random() * COLOR_PALETTE.length);
  return COLOR_PALETTE[index];
};

/**
 * Viewport utility functions for coordinate transformations and bounds calculations
 */

import { ZOOM, CANVAS } from "@/constants/shapes";
import type { ViewportState, ViewportBounds, Point } from "@/types/viewport";

/**
 * Clamp a zoom level within allowed bounds
 */
export const clampZoom = (zoom: number): number => {
  return Math.max(ZOOM.MIN, Math.min(ZOOM.MAX, zoom));
};

/**
 * Get viewport bounds based on canvas dimensions
 */
export const getViewportBounds = (): ViewportBounds => {
  return {
    minZoom: ZOOM.MIN,
    maxZoom: ZOOM.MAX,
    width: CANVAS.VIRTUAL_WIDTH,
    height: CANVAS.VIRTUAL_HEIGHT,
  };
};

/**
 * Calculate new zoom level from wheel delta
 */
export const calculateZoomFromWheel = (
  currentZoom: number,
  deltaY: number,
): number => {
  const newZoom = currentZoom * Math.pow(ZOOM.WHEEL_SENSITIVITY, deltaY);
  return clampZoom(newZoom);
};

/**
 * Format zoom as percentage string
 */
export const formatZoomPercentage = (zoom: number): string => {
  return `${Math.round(zoom * 100)}%`;
};

/**
 * Parse viewport state from localStorage
 */
export const parseStoredViewport = (
  stored: string | null,
): ViewportState | null => {
  if (!stored) return null;

  try {
    const parsed = JSON.parse(stored);
    if (
      typeof parsed.zoom === "number" &&
      typeof parsed.panX === "number" &&
      typeof parsed.panY === "number"
    ) {
      return {
        zoom: clampZoom(parsed.zoom),
        panX: parsed.panX,
        panY: parsed.panY,
      };
    }
  } catch {
    return null;
  }

  return null;
};

/**
 * Convert viewport state to storage format
 */
export const serializeViewport = (state: ViewportState): string => {
  return JSON.stringify(state);
};

/**
 * Calculate distance between two points
 */
export const distance = (p1: Point, p2: Point): number => {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Limit panning to keep canvas within bounds
 * This prevents infinite panning into empty space
 */
export const constrainPan = (
  panX: number,
  panY: number,
  zoom: number,
  canvasWidth: number,
  canvasHeight: number,
  virtualWidth: number = CANVAS.VIRTUAL_WIDTH,
  virtualHeight: number = CANVAS.VIRTUAL_HEIGHT,
): { x: number; y: number } => {
  // If zoomed out enough to see the whole canvas, center it
  const minZoomToFit = Math.max(
    canvasWidth / virtualWidth,
    canvasHeight / virtualHeight,
  );

  if (zoom <= minZoomToFit) {
    return {
      x: (canvasWidth - virtualWidth * zoom) / 2,
      y: (canvasHeight - virtualHeight * zoom) / 2,
    };
  }

  // Otherwise, constrain panning to keep content visible
  let x = panX;
  let y = panY;

  // Don't pan past the left/top edges
  if (x > 0) x = 0;
  if (y > 0) y = 0;

  // Don't pan past the right/bottom edges
  const maxX = canvasWidth - virtualWidth * zoom;
  const maxY = canvasHeight - virtualHeight * zoom;

  if (x < maxX) x = maxX;
  if (y < maxY) y = maxY;

  return { x, y };
};

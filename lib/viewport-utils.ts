/**
 * Viewport utility functions for coordinate transformations and bounds calculations
 */

import { ZOOM, CANVAS } from "@/constants/shapes";
import type { ViewportState, ViewportBounds, Point } from "@/types/viewport";
import type { Shape } from "@/types/shapes";

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

/**
 * Get the center point of a shape
 */
const getShapeCenter = (shape: Shape): Point => {
  if (shape.type === "line") {
    // For lines, use the midpoint between endpoints
    return {
      x: (shape.x1 + shape.x2) / 2,
      y: (shape.y1 + shape.y2) / 2,
    };
  }

  if (shape.type === "text") {
    // For text shapes, use the x, y position (they don't have width/height)
    return {
      x: shape.x,
      y: shape.y,
    };
  }

  // For all other shapes, use center of bounding box
  return {
    x: shape.x + shape.width / 2,
    y: shape.y + shape.height / 2,
  };
};

/**
 * Calculate the point with highest density of shapes using grid-based algorithm
 * Returns (1000, 1000) if no shapes exist
 */
export const calculateHighestDensityPoint = (shapes: Shape[]): Point => {
  // Return default position if no shapes or shapes is undefined
  if (!shapes || shapes.length === 0) {
    return { x: 1000, y: 1000 };
  }

  // Define grid cell size
  const CELL_SIZE = 200;

  // Find bounds of all shapes to create appropriate grid
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  shapes.forEach((shape) => {
    const center = getShapeCenter(shape);
    minX = Math.min(minX, center.x);
    minY = Math.min(minY, center.y);
    maxX = Math.max(maxX, center.x);
    maxY = Math.max(maxY, center.y);
  });

  // Create grid and count shapes in each cell
  const cellCounts = new Map<string, number>();
  const cellCenters = new Map<string, Point>();

  shapes.forEach((shape) => {
    const center = getShapeCenter(shape);

    // Determine which cell this shape belongs to
    const cellX = Math.floor(center.x / CELL_SIZE);
    const cellY = Math.floor(center.y / CELL_SIZE);
    const cellKey = `${cellX},${cellY}`;

    // Increment count for this cell
    cellCounts.set(cellKey, (cellCounts.get(cellKey) || 0) + 1);

    // Store cell center (if not already stored)
    if (!cellCenters.has(cellKey)) {
      cellCenters.set(cellKey, {
        x: cellX * CELL_SIZE + CELL_SIZE / 2,
        y: cellY * CELL_SIZE + CELL_SIZE / 2,
      });
    }
  });

  // Find the cell with the highest count
  let maxCount = 0;
  let densestCellKey = "";

  cellCounts.forEach((count, cellKey) => {
    if (count > maxCount) {
      maxCount = count;
      densestCellKey = cellKey;
    }
  });

  // Return the center of the densest cell
  return cellCenters.get(densestCellKey) || { x: 1000, y: 1000 };
};

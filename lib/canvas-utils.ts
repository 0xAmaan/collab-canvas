/**
 * Canvas utility functions
 * Note: Fabric.js handles most coordinate transformations automatically
 */

import { Point as FabricPoint } from "fabric";
import type { Canvas as FabricCanvas, TMat2D } from "fabric";
import type { Point } from "@/types/viewport";

/**
 * Get the current viewport transform from Fabric canvas
 */
export const getViewportTransform = (canvas: FabricCanvas): TMat2D => {
  return canvas.viewportTransform || [1, 0, 0, 1, 0, 0];
};

/**
 * Set viewport transform on Fabric canvas
 */
export const setViewportTransform = (
  canvas: FabricCanvas,
  transform: TMat2D,
): void => {
  canvas.setViewportTransform(transform);
  canvas.requestRenderAll();
};

/**
 * Get current zoom level from canvas
 */
export const getZoom = (canvas: FabricCanvas): number => {
  return canvas.getZoom();
};

/**
 * Set zoom level on canvas
 */
export const setZoom = (canvas: FabricCanvas, zoom: number): void => {
  canvas.setZoom(zoom);
  canvas.requestRenderAll();
};

/**
 * Zoom to a specific point on the canvas
 */
export const zoomToPoint = (
  canvas: FabricCanvas,
  point: Point,
  zoom: number,
): void => {
  // Create a Fabric Point instance
  const fabricPoint = new FabricPoint(point.x, point.y);
  canvas.zoomToPoint(fabricPoint, zoom);
  canvas.requestRenderAll();
};

/**
 * Get canvas coordinates from mouse event
 * Fabric.js handles viewport transformation automatically
 */
export const getCanvasPointer = (
  canvas: FabricCanvas,
  event: MouseEvent | TouchEvent,
): Point => {
  const pointer = canvas.getPointer(event);
  return {
    x: pointer.x,
    y: pointer.y,
  };
};

/**
 * Pan the canvas viewport by a delta
 */
export const relativePan = (
  canvas: FabricCanvas,
  deltaX: number,
  deltaY: number,
): void => {
  const vpt = canvas.viewportTransform;
  if (vpt) {
    vpt[4] += deltaX;
    vpt[5] += deltaY;
    canvas.setViewportTransform(vpt);
    canvas.requestRenderAll();
  }
};

/**
 * Reset viewport to default (no pan, 100% zoom)
 */
export const resetViewport = (canvas: FabricCanvas): void => {
  canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
  canvas.requestRenderAll();
};

/**
 * Check if canvas is ready for interaction
 */
export const isCanvasReady = (
  canvas: FabricCanvas | null,
): canvas is FabricCanvas => {
  return canvas !== null && canvas !== undefined;
};

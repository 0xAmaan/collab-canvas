/**
 * Shape component - utility functions for creating and managing Fabric.js shape objects
 * This is not a React component but a module for shape operations with Fabric.js
 */

import { Rect, FabricObject } from "fabric";
import type { Shape } from "@/types/shapes";
import { SELECTION_COLORS } from "@/constants/colors";

/**
 * Create a Fabric.js Rect object from a Shape definition
 */
export function createFabricRect(shape: Shape): Rect {
  const rect = new Rect({
    left: shape.x,
    top: shape.y,
    width: shape.width,
    height: shape.height,
    angle: shape.angle ?? 0, // Rotation angle
    fill: shape.fillColor,
    strokeWidth: 0,
    // Store shape ID in the object for reference
    data: { shapeId: shape._id },
    selectable: true,
    hasControls: true, // Enable corner controls for resizing
    hasBorders: true,
    borderColor: SELECTION_COLORS.BORDER,
    cornerColor: SELECTION_COLORS.HANDLE,
    cornerStrokeColor: SELECTION_COLORS.HANDLE_BORDER,
    cornerSize: 10,
    transparentCorners: false,
    cornerStyle: "circle" as const,
    borderScaleFactor: 2,
    padding: 0,
    // Performance optimizations: Enable object caching
    objectCaching: true,
    statefullCache: true,
    noScaleCache: false,
  });

  return rect;
}

/**
 * Update a Fabric.js object with new shape data
 */
export function updateFabricRect(fabricObj: FabricObject, shape: Shape): void {
  fabricObj.set({
    left: shape.x,
    top: shape.y,
    width: shape.width,
    height: shape.height,
    angle: shape.angle ?? 0,
    fill: shape.fillColor,
  });
}

/**
 * Get shape data from a Fabric.js object
 */
export function getShapeFromFabricObject(
  fabricObj: FabricObject,
  userId: string,
): Shape | null {
  if (!(fabricObj instanceof Rect)) return null;

  // Access custom data using get method
  const data = fabricObj.get("data") as { shapeId?: string } | undefined;

  return {
    _id: data?.shapeId || "",
    type: "rectangle",
    x: fabricObj.left || 0,
    y: fabricObj.top || 0,
    width: fabricObj.width || 0,
    height: fabricObj.height || 0,
    fillColor: (fabricObj.fill as string) || "#3b82f6",
    createdBy: userId,
    createdAt: Date.now(),
    lastModified: Date.now(),
    lastModifiedBy: userId,
  };
}

/**
 * Apply selection styling to a Fabric.js object
 */
export function applySelectionStyle(fabricObj: FabricObject): void {
  fabricObj.set({
    borderColor: SELECTION_COLORS.BORDER,
    cornerColor: SELECTION_COLORS.HANDLE,
    cornerStrokeColor: SELECTION_COLORS.HANDLE_BORDER,
    cornerSize: 8,
    transparentCorners: false,
    borderScaleFactor: 2,
  });
}

/**
 * Remove selection styling from a Fabric.js object
 */
export function removeSelectionStyle(fabricObj: FabricObject): void {
  fabricObj.set({
    strokeWidth: 0,
  });
}

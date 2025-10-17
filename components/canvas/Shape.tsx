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

  // Recalculate control coordinates after position/size changes
  // This ensures selection handles stay properly positioned
  fabricObj.setCoords();
}


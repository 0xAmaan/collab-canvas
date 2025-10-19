import type { Canvas as FabricCanvas, FabricObject } from "fabric";
import type { Shape } from "@/types/shapes";

/**
 * Extracts shape IDs from selected Fabric objects
 * Handles both single selection and multi-select (ActiveSelection)
 */
export const getSelectedShapeIds = (
  activeObject: FabricObject | null | undefined,
): string[] => {
  if (!activeObject) return [];

  const shapeIds: string[] = [];

  // Multi-select
  if (activeObject.type === "activeSelection") {
    const objects = (activeObject as any)._objects || [];
    for (const obj of objects) {
      const data = obj.get("data") as { shapeId?: string } | undefined;
      if (data?.shapeId) {
        shapeIds.push(data.shapeId);
      }
    }
  } else {
    // Single selection
    const data = activeObject.get("data") as { shapeId?: string } | undefined;
    if (data?.shapeId) {
      shapeIds.push(data.shapeId);
    }
  }

  return shapeIds;
};

/**
 * Gets full Shape objects from selected Fabric objects
 */
export const getSelectedShapes = (
  activeObject: FabricObject | null | undefined,
  allShapes: Shape[],
): Shape[] => {
  const shapeIds = getSelectedShapeIds(activeObject);
  return shapeIds
    .map((id) => allShapes.find((s) => s._id === id))
    .filter((shape): shape is Shape => !!shape);
};

/**
 * Gets the active selection from canvas
 */
export const getActiveSelection = (
  canvas: FabricCanvas | null,
): FabricObject | null => {
  return canvas?.getActiveObject() || null;
};

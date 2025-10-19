/**
 * Layer utilities for z-index management and layer naming
 */

import type { Shape } from "@/types/shapes";

/**
 * Generate a display name for a shape based on its type and position
 * Example: "Rectangle 1", "Circle 2", "Text 3"
 */
export function generateLayerName(shape: Shape, allShapes: Shape[]): string {
  // Sort shapes by zIndex to get proper ordering
  const sortedShapes = [...allShapes].sort(
    (a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0),
  );

  // Count shapes of the same type that appear before this shape
  let count = 0;
  for (const s of sortedShapes) {
    if (s.type === shape.type) {
      count++;
    }
    if (s._id === shape._id) {
      break;
    }
  }

  // Capitalize first letter of type
  const typeName = shape.type.charAt(0).toUpperCase() + shape.type.slice(1);

  return `${typeName} ${count}`;
}

/**
 * Calculate new z-indices after dragging a layer from oldIndex to newIndex
 * Returns array of updates to apply
 */
export function calculateNewZIndices(
  shapes: Shape[],
  oldIndex: number,
  newIndex: number,
): Array<{ id: string; zIndex: number }> {
  // Create a copy of shapes array sorted by current zIndex
  const sortedShapes = [...shapes].sort(
    (a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0),
  );

  // Move the shape from oldIndex to newIndex
  const [movedShape] = sortedShapes.splice(oldIndex, 1);
  sortedShapes.splice(newIndex, 0, movedShape);

  // Reassign z-indices sequentially (0, 1, 2, ...)
  return sortedShapes.map((shape, index) => ({
    id: shape._id,
    zIndex: index,
  }));
}

/**
 * Get icon name for a shape type
 */
export function getShapeIcon(type: Shape["type"]): string {
  switch (type) {
    case "rectangle":
      return "square";
    case "circle":
      return "circle";
    case "ellipse":
      return "circle";
    case "line":
      return "minus";
    case "text":
      return "type";
    case "path":
      return "pen-tool";
    case "polygon":
      return "hexagon";
    default:
      return "square";
  }
}

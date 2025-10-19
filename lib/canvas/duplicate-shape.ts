import type { Shape } from "@/types/shapes";

const OFFSET = 10; // Duplicate offset in pixels

/**
 * Duplicates a shape with position offset
 * Handles all shape types with type-specific property copying
 */
export const duplicateShape = (
  shape: Shape,
  userId: string,
  offset = OFFSET,
): Omit<Shape, "_id"> => {
  const baseShape = {
    createdBy: userId,
    createdAt: Date.now(),
    lastModified: Date.now(),
    lastModifiedBy: userId,
    fillColor: shape.fillColor,
    angle: shape.angle,
  };

  // Line shapes have different coordinate system (x1, y1, x2, y2)
  if (shape.type === "line") {
    return {
      ...baseShape,
      type: "line" as const,
      x1: (shape.x1 ?? 0) + offset,
      y1: (shape.y1 ?? 0) + offset,
      x2: (shape.x2 ?? 0) + offset,
      y2: (shape.y2 ?? 0) + offset,
      strokeWidth: shape.strokeWidth,
      strokeColor: shape.strokeColor,
    } as Omit<Shape, "_id">;
  }

  // Path shapes have pathData
  if (shape.type === "path") {
    return {
      ...baseShape,
      type: "path" as const,
      x: shape.x + offset,
      y: shape.y + offset,
      width: shape.width,
      height: shape.height,
      pathData: shape.pathData,
      stroke: shape.stroke,
      strokeWidth: shape.strokeWidth,
    } as Omit<Shape, "_id">;
  }

  // Polygon shapes have points array
  if (shape.type === "polygon") {
    return {
      ...baseShape,
      type: "polygon" as const,
      x: shape.x + offset,
      y: shape.y + offset,
      width: shape.width,
      height: shape.height,
      points: shape.points,
    } as Omit<Shape, "_id">;
  }

  // Text shapes have text-specific properties
  if (shape.type === "text") {
    return {
      ...baseShape,
      type: "text" as const,
      x: shape.x + offset,
      y: shape.y + offset,
      text: shape.text,
      fontSize: shape.fontSize,
      fontFamily: shape.fontFamily,
    } as Omit<Shape, "_id">;
  }

  // Standard shapes (rectangle, circle, ellipse) - share same structure
  // All have x, y, width, height, angle, fillColor
  return {
    ...baseShape,
    type: shape.type as "rectangle" | "circle" | "ellipse",
    x: (shape as any).x + offset,
    y: (shape as any).y + offset,
    width: (shape as any).width,
    height: (shape as any).height,
  } as Omit<Shape, "_id">;
};

/**
 * Batch duplicate multiple shapes
 */
export const duplicateShapes = (
  shapes: Shape[],
  userId: string,
  offset = OFFSET,
): Array<Omit<Shape, "_id">> => {
  return shapes.map((shape) => duplicateShape(shape, userId, offset));
};

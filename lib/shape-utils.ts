/**
 * Utility functions for shape manipulation
 */

import type { Shape, ShapePosition } from "@/types/shapes";

/**
 * Generate a unique shape ID (temporary for local state)
 * In production, Convex will generate the actual ID
 */
export function generateShapeId(): string {
  return `shape_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Check if a point is inside a shape's bounds
 */
export function isPointInShape(
  point: { x: number; y: number },
  shape: Shape,
): boolean {
  return (
    point.x >= shape.x &&
    point.x <= shape.x + shape.width &&
    point.y >= shape.y &&
    point.y <= shape.y + shape.height
  );
}

/**
 * Calculate shape bounds after transformation
 */
export function getShapeBounds(shape: Shape): {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
} {
  return {
    left: shape.x,
    top: shape.y,
    right: shape.x + shape.width,
    bottom: shape.y + shape.height,
    width: shape.width,
    height: shape.height,
  };
}

/**
 * Check if two shapes overlap
 */
export function shapesOverlap(shape1: Shape, shape2: Shape): boolean {
  const bounds1 = getShapeBounds(shape1);
  const bounds2 = getShapeBounds(shape2);

  return !(
    bounds1.right < bounds2.left ||
    bounds1.left > bounds2.right ||
    bounds1.bottom < bounds2.top ||
    bounds1.top > bounds2.bottom
  );
}

/**
 * Move shape to new position
 */
export function moveShape(shape: Shape, newPosition: ShapePosition): Shape {
  return {
    ...shape,
    x: newPosition.x,
    y: newPosition.y,
    lastModified: Date.now(),
  };
}

/**
 * Calculate distance between two points
 */
export function distance(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

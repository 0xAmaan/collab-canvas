/**
 * Shape types matching Convex schema
 */

export interface ShapeBase {
  _id: string;
  type: "rectangle";
  x: number;
  y: number;
  width: number;
  height: number;
  angle?: number; // Rotation angle in degrees (0-360)
  fillColor: string;
  createdBy: string;
  createdAt: number;
  lastModified: number;
  lastModifiedBy: string;
}

export type Shape = ShapeBase;

export interface RectangleProperties {
  width: number;
  height: number;
  fillColor: string;
}

export interface ShapePosition {
  x: number;
  y: number;
}

export interface ShapeDimensions {
  width: number;
  height: number;
}

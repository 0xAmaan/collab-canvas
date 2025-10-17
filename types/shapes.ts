/**
 * Shape types matching Convex schema
 */

export type ShapeType = "rectangle" | "circle" | "ellipse" | "line" | "text";

// Base interface with common fields
interface ShapeBase {
  _id: string;
  fillColor: string;
  angle?: number;
  createdBy: string;
  createdAt: number;
  lastModified: number;
  lastModifiedBy: string;
}

export interface RectangleShape extends ShapeBase {
  type: "rectangle";
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CircleShape extends ShapeBase {
  type: "circle";
  x: number;
  y: number;
  width: number; // Diameter
  height: number; // Diameter (same as width for circles)
}

export interface EllipseShape extends ShapeBase {
  type: "ellipse";
  x: number;
  y: number;
  width: number; // Horizontal diameter
  height: number; // Vertical diameter
}

export interface LineShape extends ShapeBase {
  type: "line";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  strokeWidth?: number;
  strokeColor?: string;
}

export interface TextShape extends ShapeBase {
  type: "text";
  x: number;
  y: number;
  text: string;
  fontSize: number;
  fontFamily: string;
}

export type Shape =
  | RectangleShape
  | CircleShape
  | EllipseShape
  | LineShape
  | TextShape;

// Utility types
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

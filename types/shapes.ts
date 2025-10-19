/**
 * Shape types matching Convex schema
 */

export type ShapeType =
  | "rectangle"
  | "circle"
  | "ellipse"
  | "line"
  | "text"
  | "path"
  | "polygon";

// Base interface with common fields
interface ShapeBase {
  _id: string;
  fill: string;
  angle?: number;
  zIndex?: number; // Rendering order (higher = front)
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

export interface PathShape extends ShapeBase {
  type: "path";
  pathData: string; // SVG path array as JSON string
  stroke: string;
  strokeWidth: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PolygonShape extends ShapeBase {
  type: "polygon";
  points: { x: number; y: number }[];
  x: number;
  y: number;
  width: number;
  height: number;
}

export type Shape =
  | RectangleShape
  | CircleShape
  | EllipseShape
  | LineShape
  | TextShape
  | PathShape
  | PolygonShape;

/**
 * AI Canvas Agent Type Definitions
 */

import type { Shape } from "@/types/shapes";

/**
 * Status of AI command execution
 */
export type AIStatus = "idle" | "thinking" | "success" | "error";

/**
 * Request payload sent to AI API
 */
export interface AICommandRequest {
  command: string;
  shapes: Shape[];
  selectedShapeIds?: string[]; // IDs of currently selected shapes
  viewportCenter?: { x: number; y: number }; // Current viewport center for positioning
}

/**
 * Response from AI API
 */
export interface AICommandResponse {
  success: boolean;
  message: string;
  commands: ShapeCommand[];
}

/**
 * Base command interface
 */
interface BaseCommand {
  type: string;
}

/**
 * Create rectangle command
 */
export interface CreateRectangleCommand extends BaseCommand {
  type: "create_rectangle";
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  count?: number; // Number of rectangles to create (1-500)
  spacing?: number; // Spacing between shapes in grid
}

/**
 * Create circle command
 */
export interface CreateCircleCommand extends BaseCommand {
  type: "create_circle";
  x: number;
  y: number;
  radius: number;
  fill: string;
  count?: number; // Number of circles to create (1-500)
  spacing?: number; // Spacing between shapes in grid
}

/**
 * Create text command
 */
export interface CreateTextCommand extends BaseCommand {
  type: "create_text";
  x: number;
  y: number;
  text: string;
  fontSize: number;
  fill: string;
}

/**
 * Create ellipse command
 */
export interface CreateEllipseCommand extends BaseCommand {
  type: "create_ellipse";
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  count?: number; // Number of ellipses to create (1-500)
  spacing?: number; // Spacing between shapes in grid
}

/**
 * Create line command
 */
export interface CreateLineCommand extends BaseCommand {
  type: "create_line";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  strokeWidth?: number;
  strokeColor: string;
}

/**
 * Create polygon command
 */
export interface CreatePolygonCommand extends BaseCommand {
  type: "create_polygon";
  x: number;
  y: number;
  sides: number; // 3=triangle, 6=hexagon, etc.
  radius: number;
  fill: string;
}

/**
 * Update shape command
 */
export interface UpdateShapeCommand extends BaseCommand {
  type: "update_shape";
  selector: string;
  x?: number;
  y?: number;
  fill?: string;
  width?: number;
  height?: number;
}

/**
 * Arrange shapes command
 */
export interface ArrangeShapesCommand extends BaseCommand {
  type: "arrange_shapes";
  selector: string;
  layout: "horizontal_row" | "vertical_column";
  spacing?: number;
}

/**
 * Resize shape command (relative sizing)
 */
export interface ResizeShapeCommand extends BaseCommand {
  type: "resize_shape";
  selector?: string;
  widthDelta?: number; // Change in width (e.g., +100, -50)
  heightDelta?: number; // Change in height (e.g., +50, -25)
  scale?: number; // Multiplier (e.g., 2 for "twice as big", 0.5 for "half size")
}

/**
 * Delete shape command
 */
export interface DeleteShapeCommand extends BaseCommand {
  type: "delete_shape";
  selector?: string;
}

/**
 * Duplicate shape command
 */
export interface DuplicateShapeCommand extends BaseCommand {
  type: "duplicate_shape";
  selector?: string;
  offsetX?: number; // X offset for duplicate (default: 10)
  offsetY?: number; // Y offset for duplicate (default: 10)
}

/**
 * Rotate shape command
 */
export interface RotateShapeCommand extends BaseCommand {
  type: "rotate_shape";
  selector?: string;
  angle: number; // Rotation angle in degrees (can be absolute or relative)
  relative?: boolean; // If true, add to current angle; if false, set absolute
}

/**
 * Union type of all possible shape commands
 */
export type ShapeCommand =
  | CreateRectangleCommand
  | CreateCircleCommand
  | CreateTextCommand
  | CreateEllipseCommand
  | CreateLineCommand
  | CreatePolygonCommand
  | UpdateShapeCommand
  | ArrangeShapesCommand
  | ResizeShapeCommand
  | DeleteShapeCommand
  | DuplicateShapeCommand
  | RotateShapeCommand;

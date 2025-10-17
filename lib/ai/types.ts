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
 * Union type of all possible shape commands
 */
export type ShapeCommand =
  | CreateRectangleCommand
  | CreateCircleCommand
  | CreateTextCommand
  | UpdateShapeCommand
  | ArrangeShapesCommand;

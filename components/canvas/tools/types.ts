import type { Canvas as FabricCanvas, FabricObject } from "fabric";
import type { CanvasState, Point } from "../state/CanvasState";
import type { Shape } from "@/types/shapes";
import type { Command } from "@/lib/commands/types";

/**
 * Tool context - passed to all tool hooks
 * Contains shared dependencies and state
 */
export interface ToolContext {
  // Fabric.js canvas instance
  canvas: FabricCanvas;

  // Centralized state management
  state: CanvasState;

  // User information
  userId: string;
  userName: string;

  // Real-time shape data from Convex
  shapes: Shape[];

  // Shape mutations
  createShape: (data: any) => Promise<string>;
  moveShape: (id: string, x: number, y: number) => Promise<void>;
  updateShape: (id: string, updates: any) => Promise<void>;
  deleteShape: (id: string) => Promise<void>;

  // History for undo/redo
  history: {
    execute: (command: Command) => Promise<void>;
    undo: () => Promise<void>;
    redo: () => Promise<void>;
    canUndo: boolean;
    canRedo: boolean;
    clear: () => void;
  };

  // Cursor position updates for multiplayer
  updateCursorPosition: (x: number, y: number) => void;

  // Selected color for drawing tools
  selectedColor?: string;
}

/**
 * Tool handlers - what each tool hook returns
 * Canvas.tsx delegates events to these handlers
 */
export interface ToolHandlers {
  /**
   * Called when mouse button is pressed
   * @param e - Original mouse event
   * @param pointer - Canvas coordinates of the click
   * @param target - Fabric object clicked (if any)
   */
  onMouseDown: (
    e: MouseEvent,
    pointer: Point,
    target: FabricObject | null,
  ) => void;

  /**
   * Called when mouse moves
   * @param e - Original mouse event
   * @param pointer - Canvas coordinates of the pointer
   */
  onMouseMove: (e: MouseEvent, pointer: Point) => void;

  /**
   * Called when mouse button is released
   * @param e - Original mouse event
   * @param pointer - Canvas coordinates of the pointer
   */
  onMouseUp: (e: MouseEvent, pointer: Point) => void;

  /**
   * Called when this tool becomes active
   * Use this to set up tool-specific state (cursor, canvas settings, etc.)
   */
  onActivate: () => void;

  /**
   * Called when this tool is deactivated (switching to another tool)
   * Use this to clean up tool-specific state
   */
  onDeactivate: () => void;

  /**
   * Get the cursor style for this tool (when not hovering over objects)
   */
  getCursor: () => string;

  /**
   * Get the cursor style when hovering over objects
   */
  getHoverCursor: () => string;
}

/**
 * Tool type - matches the toolbar button values
 */
export type Tool =
  | "select"
  | "hand"
  | "rectangle"
  | "circle"
  | "ellipse"
  | "line"
  | "text"
  | "polygon"
  | "pencil";

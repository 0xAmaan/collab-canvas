/**
 * Canvas-related types
 */

import type { Canvas as FabricCanvas } from "fabric";

export type ToolMode = "select" | "rectangle";

export interface CanvasState {
  tool: ToolMode;
  selectedShapeId: string | null;
  isDragging: boolean;
  isPanning: boolean;
}

export interface CanvasProps {
  width: number;
  height: number;
  onReady?: (canvas: FabricCanvas) => void;
}

export interface CanvasContextValue {
  canvas: FabricCanvas | null;
  tool: ToolMode;
  setTool: (tool: ToolMode) => void;
  selectedShapeId: string | null;
  setSelectedShapeId: (id: string | null) => void;
}

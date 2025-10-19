import type {
  FabricObject,
  IText,
  Circle,
  Ellipse,
  Line,
  Rect,
  Polygon,
} from "fabric";

/**
 * Point type for coordinates
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Shape type from our schema
 */
export type ShapeType =
  | "rectangle"
  | "circle"
  | "ellipse"
  | "line"
  | "text"
  | "polygon"
  | "path";

/**
 * Centralized state management for Canvas
 * Replaces 16+ scattered refs with a single, typed state object
 *
 * Why mutable class instead of React state:
 * - Simpler: Direct mutation instead of setState boilerplate
 * - Better performance: Doesn't trigger re-renders
 * - Perfect for internal tracking state (creation modes, panning, etc.)
 * - Matches current pattern (we use refs, not useState)
 */
export class CanvasState {
  // Interaction state - panning
  isPanning = false;
  lastPanPosition: Point = { x: 0, y: 0 };
  isDraggingShape = false;

  // Creation state (replaces 12 separate refs!)
  creation: {
    isActive: boolean;
    type: ShapeType | null;
    tempObject: FabricObject | null;
    startPoint: Point | null;
    points: Point[]; // For polygon multi-click
  } = {
    isActive: false,
    type: null,
    tempObject: null,
    startPoint: null,
    points: [],
  };

  // Duplication state (Alt+drag)
  duplication: {
    isActive: boolean;
    originalShape: any | null; // Shape type from Convex
  } = {
    isActive: false,
    originalShape: null,
  };

  // Text editing state
  textEditing: {
    isActive: boolean;
    textObject: IText | null;
    updateTimer: NodeJS.Timeout | null;
  } = {
    isActive: false,
    textObject: null,
    updateTimer: null,
  };

  // Polygon creation preview objects
  polygonPreview: {
    polygon: Polygon | null;
    line: Line | null;
  } = {
    polygon: null,
    line: null,
  };

  // Tracking state
  savingShapeIds = new Set<string>();
  hoveredObject: FabricObject | null = null;
  lastMoveUpdate = 0;

  // Helper methods to reset states

  /**
   * Reset creation state
   */
  resetCreation(): void {
    this.creation = {
      isActive: false,
      type: null,
      tempObject: null,
      startPoint: null,
      points: [],
    };
  }

  /**
   * Reset duplication state
   */
  resetDuplication(): void {
    this.duplication = {
      isActive: false,
      originalShape: null,
    };
  }

  /**
   * Reset text editing state
   */
  resetTextEditing(): void {
    if (this.textEditing.updateTimer) {
      clearTimeout(this.textEditing.updateTimer);
    }
    this.textEditing = {
      isActive: false,
      textObject: null,
      updateTimer: null,
    };
  }

  /**
   * Reset polygon preview state
   */
  resetPolygonPreview(): void {
    this.polygonPreview = {
      polygon: null,
      line: null,
    };
  }

  /**
   * Reset all states (useful when switching tools)
   */
  resetAll(): void {
    this.isPanning = false;
    this.isDraggingShape = false;
    this.resetCreation();
    this.resetDuplication();
    this.resetTextEditing();
    this.resetPolygonPreview();
    this.hoveredObject = null;
  }
}

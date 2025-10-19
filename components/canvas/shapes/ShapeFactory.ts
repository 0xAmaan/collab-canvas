import {
  Circle,
  Ellipse,
  type Canvas as FabricCanvas,
  type FabricObject,
  IText,
  Line,
  Polygon,
  Rect,
} from "fabric";
import { DEFAULT_TEXT } from "@/constants/shapes";
import { finalizeShape } from "@/lib/canvas/shape-finalizers";
import type { Command } from "@/lib/commands/types";
import type { Point, ShapeType } from "@/components/canvas/state/CanvasState";
import { SHAPE_CONFIGS } from "@/components/canvas/shapes/shape-configs";

/**
 * Factory class for creating and managing shapes
 * Eliminates 90% duplication in shape creation/finalization
 */
export class ShapeFactory {
  /**
   * Create a new shape of the specified type
   */
  createShape(
    type: ShapeType,
    startPoint: Point,
    fill: string,
  ): FabricObject | null {
    const config = SHAPE_CONFIGS[type];

    switch (type) {
      case "rectangle": {
        return new Rect({
          ...config.defaultProps,
          left: startPoint.x,
          top: startPoint.y,
          width: 0,
          height: 0,
          fill: fill,
          selectable: false,
          evented: false,
        });
      }

      case "circle": {
        return new Circle({
          ...config.defaultProps,
          left: startPoint.x,
          top: startPoint.y,
          radius: 0,
          fill: fill,
          selectable: false,
          evented: false,
        });
      }

      case "ellipse": {
        return new Ellipse({
          ...config.defaultProps,
          left: startPoint.x,
          top: startPoint.y,
          rx: 0,
          ry: 0,
          fill: fill,
          selectable: false,
          evented: false,
        });
      }

      case "line": {
        return new Line(
          [startPoint.x, startPoint.y, startPoint.x, startPoint.y],
          {
            ...config.defaultProps,
            selectable: false,
            evented: false,
          },
        );
      }

      case "text": {
        return new IText(DEFAULT_TEXT.TEXT, {
          ...config.defaultProps,
          left: startPoint.x,
          top: startPoint.y,
        });
      }

      case "polygon":
      case "path":
        // Polygon and path are created differently (multi-click, free draw)
        // They don't use this factory method
        return null;

      default:
        console.warn(`Unknown shape type: ${type}`);
        return null;
    }
  }

  /**
   * Update shape size during drag (creation)
   */
  updateShapeSize(
    object: FabricObject,
    type: ShapeType,
    startPoint: Point,
    currentPoint: Point,
  ): void {
    const config = SHAPE_CONFIGS[type];

    if (config.updateSize) {
      config.updateSize(object, startPoint, currentPoint);
    }
  }

  /**
   * Check if shape meets minimum size requirements
   */
  meetsMinimumSize(object: FabricObject, type: ShapeType): boolean {
    const config = SHAPE_CONFIGS[type];
    const minSize = config.minSize;

    if (!minSize) return true;

    // Check based on shape type
    switch (type) {
      case "rectangle": {
        const rect = object as Rect;
        const width = rect.width || 0;
        const height = rect.height || 0;
        return width >= (minSize.width || 0) && height >= (minSize.height || 0);
      }

      case "circle": {
        const circle = object as Circle;
        const radius = circle.radius || 0;
        return radius >= (minSize.radius || 0);
      }

      case "ellipse": {
        const ellipse = object as Ellipse;
        const rx = ellipse.rx || 0;
        const ry = ellipse.ry || 0;
        return rx >= (minSize.width || 0) && ry >= (minSize.height || 0);
      }

      case "line": {
        const line = object as Line;
        const x1 = line.x1 || 0;
        const y1 = line.y1 || 0;
        const x2 = line.x2 || 0;
        const y2 = line.y2 || 0;
        const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        return length >= (minSize.length || 0);
      }

      default:
        return true;
    }
  }

  /**
   * Finalize shape creation - save to Convex
   * Returns the shape ID or null if failed
   */
  async finalizeShape(
    canvas: FabricCanvas,
    object: FabricObject,
    type: ShapeType,
    userId: string,
    createShape: (data: any) => Promise<string>,
    deleteShape: (id: string) => Promise<void>,
    history: {
      execute: (command: Command) => Promise<void>;
      undo: () => Promise<void>;
      redo: () => Promise<void>;
      canUndo: boolean;
      canRedo: boolean;
      clear: () => void;
    },
  ): Promise<string | null> {
    const config = SHAPE_CONFIGS[type];

    return finalizeShape({
      canvas,
      object,
      shapeType: type,
      extractShapeData: (obj) => config.extractData(obj, userId),
      userId,
      createShape,
      deleteShape,
      history,
    });
  }

  /**
   * Create a polygon from points
   */
  createPolygon(points: Point[], fill: string): Polygon {
    const config = SHAPE_CONFIGS.polygon;

    return new Polygon(points, {
      ...config.defaultProps,
      fill: fill,
    });
  }
}

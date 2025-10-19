import type { Circle, Ellipse, IText, Line, Path, Polygon, Rect } from "fabric";
import { SELECTION_COLORS } from "@/constants/colors";
import { DEFAULT_SHAPE, DEFAULT_TEXT } from "@/constants/shapes";
import type { Point, ShapeType } from "@/components/canvas/state/CanvasState";

/**
 * Configuration for each shape type
 * Defines default properties, minimum size, and data extraction logic
 */
export interface ShapeConfig<T = any> {
  /** Default Fabric.js properties for this shape */
  defaultProps: Record<string, any>;

  /** Minimum size requirements (optional) */
  minSize?: {
    width?: number;
    height?: number;
    radius?: number;
    length?: number;
  };

  /** Extract shape data from Fabric object for saving to Convex */
  extractData: (obj: T, userId: string) => any;

  /** Update shape size during drag (for creation) */
  updateSize?: (obj: T, startPoint: Point, currentPoint: Point) => void;
}

/**
 * Base selection styling shared across all shapes
 */
const BASE_SELECTION_STYLE = {
  hasControls: true,
  hasBorders: true,
  borderColor: SELECTION_COLORS.BORDER,
  cornerColor: SELECTION_COLORS.HANDLE,
  cornerStrokeColor: SELECTION_COLORS.HANDLE_BORDER,
  cornerSize: 10,
  transparentCorners: false,
  cornerStyle: "circle" as const,
  borderScaleFactor: 2,
  padding: 0,
};

/**
 * Shape configurations for all supported shape types
 */
export const SHAPE_CONFIGS: Record<ShapeType, ShapeConfig> = {
  rectangle: {
    defaultProps: {
      fill: DEFAULT_SHAPE.FILL_COLOR,
      strokeWidth: 2,
      stroke: SELECTION_COLORS.BORDER,
      ...BASE_SELECTION_STYLE,
    },
    minSize: {
      width: 5,
      height: 5,
    },
    extractData: (rect: Rect, userId: string) => ({
      type: "rectangle" as const,
      x: rect.left || 0,
      y: rect.top || 0,
      width: rect.width || DEFAULT_SHAPE.WIDTH,
      height: rect.height || DEFAULT_SHAPE.HEIGHT,
      fill: DEFAULT_SHAPE.FILL_COLOR,
      createdBy: userId,
      createdAt: Date.now(),
      lastModified: Date.now(),
      lastModifiedBy: userId,
    }),
    updateSize: (rect: Rect, startPoint: Point, currentPoint: Point) => {
      const width = currentPoint.x - startPoint.x;
      const height = currentPoint.y - startPoint.y;

      // Handle negative dimensions for dragging in any direction
      if (width < 0) {
        rect.set({ left: currentPoint.x, width: Math.abs(width) });
      } else {
        rect.set({ left: startPoint.x, width: width });
      }

      if (height < 0) {
        rect.set({ top: currentPoint.y, height: Math.abs(height) });
      } else {
        rect.set({ top: startPoint.y, height: height });
      }
    },
  },

  circle: {
    defaultProps: {
      fill: DEFAULT_SHAPE.FILL_COLOR,
      strokeWidth: 2,
      stroke: SELECTION_COLORS.BORDER,
      ...BASE_SELECTION_STYLE,
    },
    minSize: {
      radius: 3,
    },
    extractData: (circle: Circle, userId: string) => {
      const diameter = (circle.radius || 0) * 2;
      return {
        type: "circle" as const,
        x: circle.left || 0,
        y: circle.top || 0,
        width: diameter,
        height: diameter,
        fill: DEFAULT_SHAPE.FILL_COLOR,
        createdBy: userId,
        createdAt: Date.now(),
        lastModified: Date.now(),
        lastModifiedBy: userId,
      };
    },
    updateSize: (circle: Circle, startPoint: Point, currentPoint: Point) => {
      // Calculate radius (use max distance for locked aspect ratio)
      const dx = currentPoint.x - startPoint.x;
      const dy = currentPoint.y - startPoint.y;
      const radius = Math.sqrt(dx * dx + dy * dy) / 2;

      // Update circle position to center between start and current point
      circle.set({
        left: Math.min(startPoint.x, currentPoint.x),
        top: Math.min(startPoint.y, currentPoint.y),
        radius: radius,
      });
    },
  },

  ellipse: {
    defaultProps: {
      fill: DEFAULT_SHAPE.FILL_COLOR,
      strokeWidth: 2,
      stroke: SELECTION_COLORS.BORDER,
      ...BASE_SELECTION_STYLE,
    },
    minSize: {
      width: 3,
      height: 3,
    },
    extractData: (ellipse: Ellipse, userId: string) => ({
      type: "ellipse" as const,
      x: ellipse.left || 0,
      y: ellipse.top || 0,
      width: (ellipse.rx || 0) * 2,
      height: (ellipse.ry || 0) * 2,
      fill: DEFAULT_SHAPE.FILL_COLOR,
      createdBy: userId,
      createdAt: Date.now(),
      lastModified: Date.now(),
      lastModifiedBy: userId,
    }),
    updateSize: (ellipse: Ellipse, startPoint: Point, currentPoint: Point) => {
      // Calculate radii (independent width/height)
      const width = Math.abs(currentPoint.x - startPoint.x);
      const height = Math.abs(currentPoint.y - startPoint.y);

      ellipse.set({
        left: Math.min(startPoint.x, currentPoint.x),
        top: Math.min(startPoint.y, currentPoint.y),
        rx: width / 2,
        ry: height / 2,
      });
    },
  },

  line: {
    defaultProps: {
      fill: undefined,
      stroke: DEFAULT_SHAPE.FILL_COLOR,
      strokeWidth: 2,
      ...BASE_SELECTION_STYLE,
    },
    minSize: {
      length: 5,
    },
    extractData: (line: Line, userId: string) => ({
      type: "line" as const,
      x1: line.x1 || 0,
      y1: line.y1 || 0,
      x2: line.x2 || 0,
      y2: line.y2 || 0,
      fill: DEFAULT_SHAPE.FILL_COLOR,
      createdBy: userId,
      createdAt: Date.now(),
      lastModified: Date.now(),
      lastModifiedBy: userId,
    }),
    updateSize: (line: Line, _startPoint: Point, currentPoint: Point) => {
      // Update line endpoint
      line.set({
        x2: currentPoint.x,
        y2: currentPoint.y,
      });
    },
  },

  text: {
    defaultProps: {
      fontSize: DEFAULT_TEXT.FONT_SIZE,
      fontFamily: DEFAULT_TEXT.FONT_FAMILY,
      fill: DEFAULT_TEXT.FILL_COLOR,
      selectable: true,
      evented: true,
      editable: true,
      ...BASE_SELECTION_STYLE,
    },
    extractData: (text: IText, userId: string) => {
      const textContent = text.text || "";
      return {
        type: "text" as const,
        x: text.left || 0,
        y: text.top || 0,
        text: textContent,
        fontSize: text.fontSize || DEFAULT_TEXT.FONT_SIZE,
        fontFamily: text.fontFamily || DEFAULT_TEXT.FONT_FAMILY,
        fill: (text.fill as string) || DEFAULT_TEXT.FILL_COLOR,
        createdBy: userId,
        createdAt: Date.now(),
        lastModified: Date.now(),
        lastModifiedBy: userId,
      };
    },
  },

  polygon: {
    defaultProps: {
      fill: DEFAULT_SHAPE.FILL_COLOR,
      stroke: undefined,
      strokeWidth: 0,
      selectable: true,
      evented: true,
      ...BASE_SELECTION_STYLE,
    },
    extractData: (polygon: Polygon, userId: string) => {
      // Get points from polygon (Fabric.js stores them)
      const points = polygon.points || [];
      return {
        type: "polygon" as const,
        points: points.map((p) => ({ x: p.x, y: p.y })),
        fill: (polygon.fill as string) || DEFAULT_SHAPE.FILL_COLOR,
        x: polygon.left || 0,
        y: polygon.top || 0,
        width: polygon.width || 0,
        height: polygon.height || 0,
        createdBy: userId,
        createdAt: Date.now(),
        lastModified: Date.now(),
        lastModifiedBy: userId,
      };
    },
  },

  path: {
    defaultProps: {
      fill: null, // Paths are stroke-only
      stroke: DEFAULT_SHAPE.FILL_COLOR,
      strokeWidth: 2,
      selectable: true,
      evented: true,
      ...BASE_SELECTION_STYLE,
    },
    extractData: (path: Path, userId: string) => {
      // Get path data for serialization
      const pathData = JSON.stringify(path.path);

      return {
        type: "path" as const,
        pathData,
        stroke: (path.stroke as string) || DEFAULT_SHAPE.FILL_COLOR,
        strokeWidth: (path.strokeWidth as number) || 2,
        x: path.left || 0,
        y: path.top || 0,
        width: path.width || 0,
        height: path.height || 0,
        fill: (path.stroke as string) || DEFAULT_SHAPE.FILL_COLOR, // Store stroke as fill for metadata
        createdBy: userId,
        createdAt: Date.now(),
        lastModified: Date.now(),
        lastModifiedBy: userId,
      };
    },
  },
};

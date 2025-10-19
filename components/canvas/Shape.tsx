/**
 * Shape component - utility functions for creating and managing Fabric.js shape objects
 * This is not a React component but a module for shape operations with Fabric.js
 */

import {
  Rect,
  Circle,
  Ellipse,
  Line,
  IText,
  Polygon,
  FabricObject,
  Path,
} from "fabric";
import type { Shape } from "@/types/shapes";
import { SELECTION_COLORS } from "@/constants/colors";
import { DEFAULT_TEXT } from "@/constants/shapes";

// Common styling configuration for all shapes
const commonShapeConfig = {
  selectable: true,
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
  objectCaching: true,
  statefullCache: true,
  noScaleCache: false,
};

/**
 * Create a Fabric.js object from a Shape definition
 * Supports: rectangle, circle, ellipse, line, text
 */
export function createFabricShape(shape: Shape): FabricObject {
  const baseConfig = {
    ...commonShapeConfig,
    angle: shape.angle ?? 0,
    fill: shape.type === "path" ? undefined : shape.fillColor, // Paths should never have fill
    data: { shapeId: shape._id },
  };

  switch (shape.type) {
    case "rectangle":
      return new Rect({
        ...baseConfig,
        left: shape.x,
        top: shape.y,
        width: shape.width,
        height: shape.height,
        strokeWidth: 0,
      });

    case "circle":
      return new Circle({
        ...baseConfig,
        left: shape.x,
        top: shape.y,
        radius: shape.width / 2, // Use width as diameter
        strokeWidth: 0,
      });

    case "ellipse":
      return new Ellipse({
        ...baseConfig,
        left: shape.x,
        top: shape.y,
        rx: shape.width / 2, // Horizontal radius
        ry: shape.height / 2, // Vertical radius
        strokeWidth: 0,
      });

    case "line":
      return new Line([shape.x1, shape.y1, shape.x2, shape.y2], {
        ...baseConfig,
        fill: undefined,
        stroke: shape.fillColor, // Lines use stroke, not fill
        strokeWidth: 2,
      });

    case "text":
      return new IText(shape.text || DEFAULT_TEXT.TEXT, {
        ...baseConfig,
        left: shape.x,
        top: shape.y,
        fontSize: shape.fontSize || DEFAULT_TEXT.FONT_SIZE,
        fontFamily: shape.fontFamily || DEFAULT_TEXT.FONT_FAMILY,
        fill: shape.fillColor,
        editable: true,
        selectable: true,
        strokeWidth: 0,
      });

    case "path":
      try {
        const pathData = JSON.parse(shape.pathData);

        console.log("🔷 [CREATE PATH] baseConfig.fill:", baseConfig.fill);
        console.log("🔷 [CREATE PATH] shape.fillColor:", shape.fillColor);

        // baseConfig already has fill: undefined for paths, so we can use it directly
        const pathObj = new Path(pathData, {
          ...baseConfig,
          left: shape.x,
          top: shape.y,
          stroke: shape.stroke,
          strokeWidth: shape.strokeWidth,
        });

        console.log(
          "🔷 [CREATE PATH] pathObj.fill IMMEDIATELY after creation:",
          pathObj.fill,
        );

        return pathObj;
      } catch (error) {
        console.error(
          "❌ [RECONSTRUCT PATH] Failed to parse path data:",
          error,
          shape,
        );
        // Fallback to a simple line if path data is invalid
        return new Line([0, 0, 100, 100], {
          ...baseConfig,
          fill: undefined,
          stroke: shape.stroke || "#000000",
          strokeWidth: shape.strokeWidth || 2,
        });
      }

    case "polygon":
      return new Polygon(shape.points, {
        ...baseConfig,
        left: shape.x,
        top: shape.y,
        fill: shape.fillColor,
        stroke: "#000000",
        strokeWidth: 1,
      });

    default:
      // Fallback to rectangle
      return new Rect({
        ...baseConfig,
        left: (shape as any).x ?? 0,
        top: (shape as any).y ?? 0,
        width: (shape as any).width ?? 100,
        height: (shape as any).height ?? 100,
        strokeWidth: 0,
      });
  }
}

/**
 * Update a Fabric.js object with new shape data
 */
export function updateFabricShape(fabricObj: FabricObject, shape: Shape): void {
  const updates: any = {
    angle: shape.angle ?? 0,
    fill: shape.fillColor,
  };

  switch (shape.type) {
    case "rectangle":
      updates.left = shape.x;
      updates.top = shape.y;
      updates.width = shape.width;
      updates.height = shape.height;
      break;

    case "circle":
      updates.left = shape.x;
      updates.top = shape.y;
      updates.radius = shape.width / 2;
      break;

    case "ellipse":
      updates.left = shape.x;
      updates.top = shape.y;
      updates.rx = shape.width / 2;
      updates.ry = shape.height / 2;
      break;

    case "line":
      const line = fabricObj as Line;
      line.set({
        x1: shape.x1,
        y1: shape.y1,
        x2: shape.x2,
        y2: shape.y2,
        stroke: shape.fillColor, // Lines use stroke
      });
      break;

    case "text":
      const text = fabricObj as IText;
      text.set({
        left: shape.x,
        top: shape.y,
        text: shape.text || DEFAULT_TEXT.TEXT,
        fontSize: shape.fontSize || DEFAULT_TEXT.FONT_SIZE,
        fontFamily: shape.fontFamily || DEFAULT_TEXT.FONT_FAMILY,
        fill: shape.fillColor,
      });
      break;

    case "path":
      try {
        const pathData = JSON.parse(shape.pathData);
        const path = fabricObj as Path;
        path.set({
          path: pathData,
          left: shape.x,
          top: shape.y,
          stroke: shape.stroke,
          strokeWidth: shape.strokeWidth,
          fill: undefined, // Remove fill completely for paths
        });
      } catch (error) {
        console.error("Failed to update path data:", error);
      }
      break;

    case "polygon":
      const polygon = fabricObj as Polygon;
      polygon.set({
        points: shape.points,
        left: shape.x,
        top: shape.y,
        fill: shape.fillColor,
      });
      break;
  }

  fabricObj.set(updates);
  fabricObj.setCoords();
}

// Legacy exports for backward compatibility
export const createFabricRect = createFabricShape;
export const updateFabricRect = updateFabricShape;

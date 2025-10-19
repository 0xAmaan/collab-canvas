import type {
  FabricObject,
  Rect,
  Circle,
  Ellipse,
  Line,
  IText,
  Polygon,
} from "fabric";

export type ShapeValidator<T extends FabricObject> = (obj: T) => boolean;

/**
 * Validators for each shape type
 * Returns true if shape meets minimum size/content requirements
 */
export const shapeValidators = {
  rectangle: (rect: Rect): boolean => {
    return (rect.width || 0) >= 5 && (rect.height || 0) >= 5;
  },

  circle: (circle: Circle): boolean => {
    return (circle.radius || 0) >= 3;
  },

  ellipse: (ellipse: Ellipse): boolean => {
    return (ellipse.rx || 0) >= 3 && (ellipse.ry || 0) >= 3;
  },

  line: (line: Line): boolean => {
    const x1 = line.x1 || 0;
    const y1 = line.y1 || 0;
    const x2 = line.x2 || 0;
    const y2 = line.y2 || 0;
    const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    return length >= 5;
  },

  text: (text: IText): boolean => {
    const textContent = text.text || "";
    return !!textContent && textContent !== "Type here";
  },

  polygon: (polygon: Polygon): boolean => {
    const points = (polygon.points as any[]) || [];
    return points.length >= 3;
  },

  // Path validator - always return true for pencil drawings
  path: (): boolean => {
    return true;
  },
};

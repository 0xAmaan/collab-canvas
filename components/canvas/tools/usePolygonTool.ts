import type { Point } from "../state/CanvasState";
import type { ToolContext, ToolHandlers } from "./types";
import { Polygon, Line } from "fabric";
import { SELECTION_COLORS } from "@/constants/colors";
import { DEFAULT_SHAPE } from "@/constants/shapes";
import { finalizeShape } from "@/lib/canvas/shape-finalizers";

/**
 * Polygon Tool Factory
 *
 * Creates a polygon tool handler for multi-click polygon creation.
 * Features:
 * - Click to add points (vertices)
 * - Visual preview of polygon shape (dashed outline)
 * - Visual preview line from last point to cursor
 * - Enter key to complete polygon (minimum 3 points)
 * - Escape key to cancel polygon creation
 * - Undo/redo support via history
 */
export const createPolygonTool = (context: ToolContext): ToolHandlers => {
  const {
    canvas,
    state,
    userId,
    createShape,
    deleteShape,
    history,
    selectedColor,
  } = context;

  // Track if we're actively creating a polygon
  let isCreating = false;

  const onMouseDown = (_e: MouseEvent, pointer: Point, target: any) => {
    // Only add points if clicking on empty canvas (not on existing object)
    if (target) return;

    const newPoint = { x: pointer.x, y: pointer.y };
    state.creation.points.push(newPoint);

    // Start polygon creation mode
    if (!isCreating) {
      isCreating = true;
      state.creation.isActive = true;
      state.creation.type = "polygon";
    }

    // Update preview polygon if we have at least 2 points
    if (state.creation.points.length >= 2) {
      // Remove old preview
      if (state.polygonPreview.polygon) {
        canvas.remove(state.polygonPreview.polygon);
      }

      // Create new preview polygon (dashed outline)
      const poly = new Polygon(state.creation.points, {
        fill: "transparent",
        stroke: selectedColor || DEFAULT_SHAPE.FILL_COLOR,
        strokeWidth: 2,
        strokeDashArray: [5, 5],
        selectable: false,
        evented: false,
      });

      canvas.add(poly);
      state.polygonPreview.polygon = poly;
    }

    canvas.renderAll();
  };

  const onMouseMove = (_e: MouseEvent, pointer: Point) => {
    // Show preview line from last point to cursor
    if (isCreating && state.creation.points.length > 0) {
      const lastPoint = state.creation.points[state.creation.points.length - 1];

      // Remove old preview line
      if (state.polygonPreview.line) {
        canvas.remove(state.polygonPreview.line);
      }

      // Create new preview line
      const line = new Line([lastPoint.x, lastPoint.y, pointer.x, pointer.y], {
        stroke: selectedColor || DEFAULT_SHAPE.FILL_COLOR,
        strokeWidth: 1,
        strokeDashArray: [5, 5],
        selectable: false,
        evented: false,
      });

      canvas.add(line);
      state.polygonPreview.line = line;
      canvas.renderAll();
    }
  };

  const onMouseUp = (_e: MouseEvent, _pointer: Point) => {
    // Nothing needed for polygon tool mouse up
  };

  const onActivate = () => {
    // Set crosshair cursor
    canvas.defaultCursor = "crosshair";
    canvas.hoverCursor = "crosshair";
    canvas.setCursor("crosshair");

    // Disable multi-select box
    canvas.selection = false;

    // Make objects selectable (so we can still interact with existing shapes if needed)
    canvas.getObjects().forEach((obj) => {
      obj.selectable = true;
      obj.evented = true;
    });

    // Setup keyboard events
    setupKeyboardEvents();

    canvas.requestRenderAll();
  };

  const onDeactivate = () => {
    // Clean up any active polygon creation
    cleanupPolygonCreation();

    // Remove keyboard events
    cleanupKeyboardEvents();

    // Reset cursor
    canvas.defaultCursor = "default";
    canvas.hoverCursor = "move";
    canvas.setCursor("default");

    canvas.requestRenderAll();
  };

  // Finalize polygon creation (save to Convex)
  const finalizePolygon = async (points: Point[]) => {
    if (points.length < 3) {
      alert("Need at least 3 points to create a polygon");
      return null;
    }

    // Create final polygon
    const polygon = new Polygon(points, {
      fill: selectedColor || DEFAULT_SHAPE.FILL_COLOR,
      stroke: undefined, // No stroke - just fill
      strokeWidth: 0,
      selectable: true,
      evented: true,
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
    });

    canvas.add(polygon);

    // Force Fabric to calculate polygon bounds
    polygon.setCoords();
    canvas.renderAll();

    const shapeId = await finalizeShape({
      canvas: canvas,
      object: polygon,
      shapeType: "polygon",
      extractShapeData: (obj: any) => ({
        points: points,
        fill: selectedColor || DEFAULT_SHAPE.FILL_COLOR,
        x: obj.left || 0,
        y: obj.top || 0,
        width: obj.width || 100, // Fallback if width not calculated
        height: obj.height || 100, // Fallback if height not calculated
      }),
      userId,
      createShape: createShape,
      deleteShape: deleteShape,
      history: history,
    });

    canvas.renderAll();

    return shapeId;
  };

  // Clean up polygon creation state
  const cleanupPolygonCreation = () => {
    // Remove preview elements
    if (state.polygonPreview.polygon) {
      canvas.remove(state.polygonPreview.polygon);
    }
    if (state.polygonPreview.line) {
      canvas.remove(state.polygonPreview.line);
    }

    // Reset state
    isCreating = false;
    state.resetCreation();
    state.resetPolygonPreview();

    canvas.renderAll();
  };

  // Setup keyboard event listeners
  const setupKeyboardEvents = () => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Enter key - complete polygon
      if (e.key === "Enter" && isCreating) {
        e.preventDefault();

        // Clean up preview elements
        if (state.polygonPreview.polygon) {
          canvas.remove(state.polygonPreview.polygon);
        }
        if (state.polygonPreview.line) {
          canvas.remove(state.polygonPreview.line);
        }

        // Finalize the polygon
        finalizePolygon(state.creation.points);

        // Reset state
        isCreating = false;
        state.resetCreation();
        state.resetPolygonPreview();

        canvas.renderAll();
      }

      // Escape key - cancel polygon
      if (e.key === "Escape" && isCreating) {
        e.preventDefault();
        cleanupPolygonCreation();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    // Store handler on canvas for cleanup
    (canvas as any).__polygonToolKeyHandler = handleKeyDown;
  };

  // Cleanup keyboard event listeners
  const cleanupKeyboardEvents = () => {
    const handler = (canvas as any).__polygonToolKeyHandler;
    if (handler) {
      window.removeEventListener("keydown", handler);
      delete (canvas as any).__polygonToolKeyHandler;
    }
  };

  return {
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onActivate,
    onDeactivate,
    getCursor: () => "crosshair",
    getHoverCursor: () => "crosshair",
  };
};

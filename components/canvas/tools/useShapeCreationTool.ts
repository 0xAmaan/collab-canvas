import type { Point, ShapeType } from "../state/CanvasState";
import type { ToolContext, ToolHandlers } from "./types";
import { ShapeFactory } from "../shapes/ShapeFactory";
import { DEFAULT_SHAPE } from "@/constants/shapes";

/**
 * Shape Creation Tool Factory
 *
 * Creates a generic shape creation tool for rectangle, circle, ellipse, and line.
 * Features:
 * - Click and drag to create shapes
 * - Visual preview with border during creation
 * - Minimum size validation
 * - Automatic selection after creation
 * - Undo/redo support via history
 */
export const createShapeCreationTool = (
  context: ToolContext,
  shapeType: "rectangle" | "circle" | "ellipse" | "line",
): ToolHandlers => {
  const { canvas, state, userId, createShape, deleteShape, history } = context;
  const factory = new ShapeFactory();

  const onMouseDown = (_e: MouseEvent, pointer: Point, target: any) => {
    // Only create shape if clicking on empty canvas (not on existing object)
    if (target) return;

    // Start shape creation
    state.creation.isActive = true;
    state.creation.type = shapeType;
    state.creation.startPoint = pointer;

    // Create temporary shape object using factory
    const tempObject = factory.createShape(
      shapeType,
      pointer,
      DEFAULT_SHAPE.FILL_COLOR,
    );

    if (tempObject) {
      state.creation.tempObject = tempObject;
      canvas.add(tempObject);
      canvas.renderAll();
    }
  };

  const onMouseMove = (_e: MouseEvent, pointer: Point) => {
    // Only update if we're actively creating a shape
    if (
      !state.creation.isActive ||
      !state.creation.tempObject ||
      !state.creation.startPoint
    ) {
      return;
    }

    // Update shape size using factory
    factory.updateShapeSize(
      state.creation.tempObject,
      shapeType,
      state.creation.startPoint,
      pointer,
    );

    canvas.renderAll();
  };

  const onMouseUp = async (_e: MouseEvent, _pointer: Point) => {
    // Only finalize if we're actively creating a shape
    if (!state.creation.isActive || !state.creation.tempObject) {
      return;
    }

    const createdObject = state.creation.tempObject;

    // Check if shape meets minimum size requirements
    const meetsMinSize = factory.meetsMinimumSize(createdObject, shapeType);

    if (!meetsMinSize) {
      // Too small - remove it (likely an accidental click)
      canvas.remove(createdObject);
      state.resetCreation();
      canvas.renderAll();
      return;
    }

    // Remove stroke and make it selectable
    if (shapeType === "line") {
      // Lines keep their stroke
      createdObject.set({
        selectable: true,
        evented: true,
      });
    } else {
      // Other shapes remove creation stroke
      createdObject.set({
        stroke: undefined,
        strokeWidth: 0,
        selectable: true,
        evented: true,
      });
    }

    // Enable selection mode on the canvas
    canvas.selection = true;

    // Select the newly created shape immediately (visual feedback)
    canvas.setActiveObject(createdObject);
    canvas.renderAll();

    // Reset creation state
    state.resetCreation();

    // Finalize the shape (async - saves to Convex with undo/redo support)
    await factory.finalizeShape(
      canvas,
      createdObject,
      shapeType,
      userId,
      createShape,
      deleteShape,
      history,
    );
  };

  const onActivate = () => {
    // Set crosshair cursor for shape creation
    canvas.defaultCursor = "crosshair";
    canvas.hoverCursor = "crosshair";
    canvas.setCursor("crosshair");

    // Disable selection during shape creation
    canvas.selection = false;

    // Make objects selectable (so we can still interact with existing shapes if needed)
    canvas.getObjects().forEach((obj) => {
      obj.selectable = true;
      obj.evented = true;
    });

    canvas.requestRenderAll();
  };

  const onDeactivate = () => {
    // Clean up any active creation state
    if (state.creation.tempObject) {
      canvas.remove(state.creation.tempObject);
    }
    state.resetCreation();

    // Reset cursor
    canvas.defaultCursor = "default";
    canvas.hoverCursor = "move";
    canvas.setCursor("default");

    canvas.requestRenderAll();
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

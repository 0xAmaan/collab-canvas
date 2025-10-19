import type { Point } from "../state/CanvasState";
import type { ToolContext, ToolHandlers } from "./types";

/**
 * Select Tool Factory
 *
 * Creates a select tool handler with the following features:
 * - Regular selection and dragging of shapes
 * - Multi-select (drag selection box)
 */
export const createSelectTool = (context: ToolContext): ToolHandlers => {
  const { canvas, state } = context;

  const onMouseDown = (_e: MouseEvent, _pointer: Point, target: any) => {
    // If clicking on an object, we're dragging a shape
    if (target) {
      state.isDraggingShape = true;
      return;
    }

    // If clicking empty space, let Fabric.js handle selection box
    // Fabric.js will automatically draw a selection rectangle when dragging
    // This enables multi-select by dragging over multiple objects
  };

  const onMouseMove = (_e: MouseEvent, _pointer: Point) => {
    // Nothing special needed for select mode mouse move
    // Fabric.js handles the dragging and selection box automatically
  };

  const onMouseUp = (_e: MouseEvent, _pointer: Point) => {
    state.isDraggingShape = false;
  };

  const onActivate = () => {
    // Enable selection mode
    canvas.selection = true;
    canvas.defaultCursor = "default";
    canvas.hoverCursor = "move";

    // Make all objects selectable
    canvas.getObjects().forEach((obj) => {
      obj.selectable = true;
      obj.evented = true;
    });

    canvas.requestRenderAll();
  };

  const onDeactivate = () => {
    // Clean up any active state
    canvas.selection = false;
    state.resetAll();

    // Clear hover effect if any
    if (state.hoveredObject) {
      state.hoveredObject.set({
        strokeWidth: 0,
        stroke: undefined,
      });
      state.hoveredObject = null;
    }

    canvas.requestRenderAll();
  };

  return {
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onActivate,
    getCursor: () => "default",
    getHoverCursor: () => "move",
    onDeactivate,
  };
};

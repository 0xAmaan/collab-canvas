import type { Point } from "../state/CanvasState";
import type { ToolContext, ToolHandlers } from "./types";

/**
 * Hand Tool Factory
 *
 * Creates a hand tool handler for panning the canvas.
 * Features:
 * - Click and drag to pan the canvas
 * - Cursor changes: grab → grabbing → grab
 * - Disables object selection while active
 */
export const createHandTool = (context: ToolContext): ToolHandlers => {
  const { canvas, state } = context;

  const onMouseDown = (e: MouseEvent, _pointer: Point, _target: any) => {
    // Enable panning
    state.isPanning = true;
    canvas.selection = false;

    // Save initial mouse position
    state.lastPanPosition = { x: e.clientX, y: e.clientY };

    // Update cursor to show we're actively panning
    canvas.setCursor("grabbing");
  };

  const onMouseMove = (e: MouseEvent, _pointer: Point) => {
    // Only pan if we're actively dragging
    if (!state.isPanning) return;

    const vpt = canvas.viewportTransform;

    if (vpt) {
      // Calculate delta from last position
      const deltaX = e.clientX - state.lastPanPosition.x;
      const deltaY = e.clientY - state.lastPanPosition.y;

      // Update viewport transform (panning)
      vpt[4] += deltaX;
      vpt[5] += deltaY;

      // Update control coordinates for selected objects during pan
      const activeObject = canvas.getActiveObject();
      if (activeObject) {
        activeObject.setCoords();
      }

      canvas.requestRenderAll();

      // Update last position for next move event
      state.lastPanPosition = { x: e.clientX, y: e.clientY };
    }
  };

  const onMouseUp = (_e: MouseEvent, _pointer: Point) => {
    if (state.isPanning) {
      const vpt = canvas.viewportTransform;
      if (vpt) {
        canvas.setViewportTransform(vpt);
      }

      // Disable panning
      state.isPanning = false;

      // Reset cursor back to grab (ready to pan again)
      canvas.setCursor("grab");
    }
  };

  const onActivate = () => {
    // Clear any active selection first
    if (canvas.getActiveObject()) {
      canvas.discardActiveObject();
    }

    // Set grab cursor
    canvas.defaultCursor = "grab";
    canvas.hoverCursor = "grab";
    canvas.setCursor("grab");

    // Disable selection
    canvas.selection = false;

    // Make all objects non-selectable and non-interactive in hand mode
    canvas.getObjects().forEach((obj) => {
      obj.selectable = false;
      obj.evented = false;
    });

    canvas.requestRenderAll();
  };

  const onDeactivate = () => {
    // Reset panning state
    state.isPanning = false;
    state.lastPanPosition = { x: 0, y: 0 };

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
    getCursor: () => "grab",
    getHoverCursor: () => "grab",
  };
};

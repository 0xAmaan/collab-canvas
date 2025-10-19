import type { ToolHandlers, ToolContext } from "./types";
import { PencilBrush, Path } from "fabric";
import { CreateShapeCommand } from "@/lib/commands/CreateShapeCommand";

/**
 * Pencil Tool Factory
 *
 * Creates a pencil tool handler for free drawing.
 * Features:
 * - Free drawing with Fabric.js PencilBrush
 * - Stroke-only paths (no fill)
 * - Custom brush finalization to prevent visual artifacts
 * - Auto-save paths to Convex with undo/redo support
 */
export const createPencilTool = (context: ToolContext): ToolHandlers => {
  const {
    canvas,
    state,
    userId,
    selectedColor,
    createShape,
    deleteShape,
    history,
  } = context;

  let pathCreatedHandler: ((e: any) => Promise<void>) | null = null;
  let beforePathCreatedHandler: ((e: any) => void) | null = null;

  const onMouseDown = (_e: MouseEvent, _pointer: any, _target: any) => {
    // Nothing needed - PencilBrush handles mouse down
  };

  const onMouseMove = (_e: MouseEvent, _pointer: any) => {
    // Nothing needed - PencilBrush handles mouse move
  };

  const onMouseUp = (_e: MouseEvent, _pointer: any) => {
    // Nothing needed - PencilBrush handles mouse up
  };

  const onActivate = () => {
    // Enable free drawing mode with PencilBrush
    const brush = new PencilBrush(canvas);
    brush.color = selectedColor || "#000000";
    brush.width = 2;

    canvas.freeDrawingBrush = brush;
    canvas.isDrawingMode = true;

    canvas.defaultCursor = "crosshair";
    canvas.hoverCursor = "crosshair";

    // Setup path creation events (handles fill fix)
    setupPathEvents();

    canvas.requestRenderAll();
  };

  const onDeactivate = () => {
    // Disable free drawing mode
    canvas.isDrawingMode = false;

    // Cleanup event handlers
    cleanupPathEvents();

    // Reset cursor
    canvas.defaultCursor = "default";
    canvas.hoverCursor = "move";
    canvas.setCursor("default");

    canvas.requestRenderAll();
  };

  // Setup path creation event listeners
  const setupPathEvents = () => {
    // Ensure fill is disabled before path is added to canvas
    beforePathCreatedHandler = (e: any) => {
      if (e.path) {
        e.path.fill = null;
        e.path.set({ fill: null });
        // Override _renderFill to prevent any fill rendering
        (e.path as any)._renderFill = function () {};
      }
    };

    // Handle path creation - save to Convex
    pathCreatedHandler = async (e: any) => {
      const path = e.path;
      if (!path) {
        console.error("Failed to create path: no path in event");
        return;
      }

      // Ensure path is stroke-only (no fill)
      path.fill = null;
      path.set({ fill: null });
      path.dirty = true;

      // Generate a temporary ID to track this path while it's being saved
      const tempId = `temp_path_${Date.now()}`;

      try {
        // Tag the path immediately with temp ID to prevent sync removal
        path.set({
          data: { shapeId: tempId },
        });

        // Mark as being saved to prevent removal during sync
        state.savingShapeIds.add(tempId);

        // Get path data for serialization
        const pathData = JSON.stringify(path.path);

        // Create shape data object
        const shapeData = {
          type: "path" as const,
          pathData,
          stroke: (path.stroke as string) || selectedColor || "#000000",
          strokeWidth: (path.strokeWidth as number) || 2,
          x: path.left || 0,
          y: path.top || 0,
          width: path.width || 0,
          height: path.height || 0,
          fill: selectedColor || "#000000", // Store color for metadata (NOT used for rendering)
          createdBy: userId,
          createdAt: Date.now(),
          lastModified: Date.now(),
          lastModifiedBy: userId,
        };

        const command = new CreateShapeCommand(
          shapeData,
          createShape,
          deleteShape,
        );

        await history.execute(command);

        // Get the real shapeId from the command
        const shapeId = command.getShapeId();

        // Remove temp ID from saving set
        state.savingShapeIds.delete(tempId);

        if (shapeId) {
          // Update with real ID
          path.set("data", { shapeId });

          // Add real ID to saving set briefly to prevent sync conflicts
          state.savingShapeIds.add(shapeId);

          setTimeout(() => {
            state.savingShapeIds.delete(shapeId);
          }, 500);
        }

        canvas.renderAll();
      } catch (error) {
        console.error("❌ [PATH CREATED] Failed to create path:", error);
        // Remove from saving set on error
        state.savingShapeIds.delete(tempId);
      }
    };

    canvas.on("before:path:created", beforePathCreatedHandler);
    canvas.on("path:created", pathCreatedHandler);
  };

  // Cleanup path creation event listeners
  const cleanupPathEvents = () => {
    if (beforePathCreatedHandler) {
      canvas.off("before:path:created", beforePathCreatedHandler);
      beforePathCreatedHandler = null;
    }
    if (pathCreatedHandler) {
      canvas.off("path:created", pathCreatedHandler);
      pathCreatedHandler = null;
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

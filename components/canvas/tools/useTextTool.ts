import type { Point } from "../state/CanvasState";
import type { ToolContext, ToolHandlers } from "./types";
import { IText } from "fabric";
import { SELECTION_COLORS } from "@/constants/colors";
import { DEFAULT_TEXT } from "@/constants/shapes";
import { finalizeShape } from "@/lib/canvas/shape-finalizers";

/**
 * Text Tool Factory
 *
 * Creates a text tool handler for creating and editing text objects.
 * Features:
 * - Click to place new text
 * - Auto-enter edit mode on creation
 * - Double-click existing text to edit
 * - Auto-save on edit exit (throttled)
 * - Undo/redo support via history
 */
export const createTextTool = (context: ToolContext): ToolHandlers => {
  const {
    canvas,
    state,
    userId,
    createShape,
    deleteShape,
    history,
    updateShape,
  } = context;

  // Track text editing state locally in tool
  let textUpdateTimer: NodeJS.Timeout | null = null;

  const onMouseDown = (_e: MouseEvent, pointer: Point, target: any) => {
    // Double-click existing text to edit
    if (target && target.type === "i-text") {
      const text = target as IText;
      text.enterEditing();
      text.selectAll();
      state.textEditing.isActive = true;
      state.textEditing.textObject = text;
      return;
    }

    // Click empty space to create new text
    if (!target) {
      const text = new IText(DEFAULT_TEXT.TEXT, {
        left: pointer.x,
        top: pointer.y,
        fontSize: DEFAULT_TEXT.FONT_SIZE,
        fontFamily: DEFAULT_TEXT.FONT_FAMILY,
        fill: DEFAULT_TEXT.FILL_COLOR,
        selectable: true,
        evented: true,
        editable: true,
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

      canvas.add(text);
      canvas.setActiveObject(text);

      // Enter edit mode immediately
      text.enterEditing();
      text.selectAll();

      state.textEditing.isActive = true;
      state.textEditing.textObject = text;

      canvas.renderAll();
    }
  };

  const onMouseMove = (_e: MouseEvent, _pointer: Point) => {
    // Nothing needed for text tool mouse move
  };

  const onMouseUp = (_e: MouseEvent, _pointer: Point) => {
    // Nothing needed for text tool mouse up
  };

  const onActivate = () => {
    // Set text cursor
    canvas.defaultCursor = "text";
    canvas.hoverCursor = "text";
    canvas.setCursor("text");

    // Disable multi-select box (but keep objects selectable for double-click edit)
    canvas.selection = false;

    // Make all objects selectable and evented (so we can double-click to edit)
    canvas.getObjects().forEach((obj) => {
      obj.selectable = true;
      obj.evented = true;
    });

    // Setup text editing events
    setupTextEvents();

    canvas.requestRenderAll();
  };

  const onDeactivate = () => {
    // Clean up text editing state
    if (state.textEditing.textObject) {
      state.textEditing.textObject.exitEditing();
    }
    state.resetTextEditing();

    // Clear any pending text update timer
    if (textUpdateTimer) {
      clearTimeout(textUpdateTimer);
      textUpdateTimer = null;
    }

    // Remove text editing events
    cleanupTextEvents();

    // Reset cursor
    canvas.defaultCursor = "default";
    canvas.hoverCursor = "move";
    canvas.setCursor("default");

    canvas.requestRenderAll();
  };

  // Finalize text creation (save to Convex)
  const finalizeText = async (text: IText) => {
    return finalizeShape({
      canvas: canvas,
      object: text,
      shapeType: "text",
      extractShapeData: (obj: any) => {
        const textContent = obj.text || "";
        return {
          x: obj.left || 0,
          y: obj.top || 0,
          text: textContent,
          fontSize: obj.fontSize || DEFAULT_TEXT.FONT_SIZE,
          fontFamily: obj.fontFamily || DEFAULT_TEXT.FONT_FAMILY,
          fillColor: (obj.fill as string) || DEFAULT_TEXT.FILL_COLOR,
        };
      },
      userId,
      createShape: createShape,
      deleteShape: deleteShape,
      history: history,
    });
  };

  // Setup text editing event listeners
  const setupTextEvents = () => {
    // Handle text changes - throttled to 200ms
    const handleTextChanged = (opt: any) => {
      if (!opt.target || opt.target.type !== "i-text") return;

      const text = opt.target as IText;
      const data = text.get("data") as { shapeId?: string } | undefined;
      const shapeId = data?.shapeId;

      if (!shapeId) return;

      // Throttle text updates to 200ms to prevent mutation spam
      if (textUpdateTimer) {
        clearTimeout(textUpdateTimer);
      }

      textUpdateTimer = setTimeout(async () => {
        try {
          await updateShape(shapeId, {
            text: text.text || "",
            width: text.width || 100,
            height: text.height || 40,
          });
        } catch (error) {
          console.error("Failed to update text:", error);
        }
      }, 200);
    };

    // Handle text editing exit
    const handleTextEditingExited = async (opt: any) => {
      if (!opt.target || opt.target.type !== "i-text") return;

      const text = opt.target as IText;
      const data = text.get("data") as { shapeId?: string } | undefined;

      // If text has no shapeId, it's a new text that needs to be finalized
      if (!data?.shapeId) {
        await finalizeText(text);
      }

      state.textEditing.isActive = false;
      state.textEditing.textObject = null;
    };

    canvas.on("text:changed", handleTextChanged);
    canvas.on("text:editing:exited", handleTextEditingExited);

    // Store handlers on canvas for cleanup
    (canvas as any).__textToolHandlers = {
      handleTextChanged,
      handleTextEditingExited,
    };
  };

  // Cleanup text editing event listeners
  const cleanupTextEvents = () => {
    const handlers = (canvas as any).__textToolHandlers;
    if (handlers) {
      canvas.off("text:changed", handlers.handleTextChanged);
      canvas.off("text:editing:exited", handlers.handleTextEditingExited);
      delete (canvas as any).__textToolHandlers;
    }
  };

  return {
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onActivate,
    onDeactivate,
    getCursor: () => "text",
    getHoverCursor: () => "text",
  };
};

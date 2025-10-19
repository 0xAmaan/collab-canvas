"use client";

/**
 * Main Canvas component using Fabric.js
 * Handles pan/zoom functionality, shape creation, selection, and dragging
 */

import { CANVAS, DEFAULT_SHAPE } from "@/constants/shapes";
import { useShapes } from "@/hooks/useShapes";
import { zoomToPoint } from "@/lib/canvas-utils";
import { duplicateShapes } from "@/lib/canvas/duplicate-shape";
import { getSelectedShapes } from "@/lib/canvas/selection-utils";
import { CreateShapeCommand } from "@/lib/commands/CreateShapeCommand";
import { DeleteShapeCommand } from "@/lib/commands/DeleteShapeCommand";
import type { Command } from "@/lib/commands/types";
import { UpdateShapeCommand } from "@/lib/commands/UpdateShapeCommand";
import { calculateZoomFromWheel } from "@/lib/viewport-utils";
import { Canvas as FabricCanvas, FabricObject } from "fabric";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Tool } from "@/components/toolbar/BottomToolbar";
import { configureSelectionStyle } from "@/components/canvas/SelectionBox";
import { createFabricRect, updateFabricRect } from "@/components/canvas/Shape";
import { CanvasState } from "@/components/canvas/state/CanvasState";
import { createSelectTool } from "@/components/canvas/tools/useSelectTool";
import { createHandTool } from "@/components/canvas/tools/useHandTool";
import { createShapeCreationTool } from "@/components/canvas/tools/useShapeCreationTool";
import { createTextTool } from "@/components/canvas/tools/useTextTool";
import { createPolygonTool } from "@/components/canvas/tools/usePolygonTool";
import { createPencilTool } from "@/components/canvas/tools/usePencilTool";
import type {
  ToolContext,
  ToolHandlers,
} from "@/components/canvas/tools/types";

interface CanvasProps {
  onCanvasReady?: (canvas: FabricCanvas) => void;
  activeTool: Tool;
  userId?: string;
  userName?: string;
  onDeleteSelected?: (handler: () => void) => void;
  onDuplicateSelected?: (handler: () => void) => void;
  updateCursorPosition: (x: number, y: number) => void;
  history: {
    execute: (command: Command) => Promise<void>;
    undo: () => Promise<void>;
    redo: () => Promise<void>;
    canUndo: boolean;
    canRedo: boolean;
    clear: () => void;
  };
}

export const Canvas = ({
  onCanvasReady,
  activeTool,
  userId = "anonymous",
  userName = "Anonymous",
  onDeleteSelected,
  onDuplicateSelected,
  updateCursorPosition,
  history,
}: CanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<FabricCanvas | null>(null);
  const activeToolRef = useRef<Tool>(activeTool);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [isMounted, setIsMounted] = useState(false);

  // Real-time shape state from Convex
  const {
    shapes,
    createShape: createShapeInConvex,
    moveShape: moveShapeInConvex,
    updateShape: updateShapeInConvex,
    deleteShape: deleteShapeInConvex,
  } = useShapes();

  // Track last move update time for throttling real-time movement
  const lastMoveUpdateRef = useRef<number>(0);

  // Track shapes currently being saved to prevent sync conflicts
  const savingShapesRef = useRef<Set<string>>(new Set());

  // Track hovered object for selection preview
  const hoveredObjectRef = useRef<FabricObject | null>(null);

  // Track current selected color for drawing tools
  const [selectedColor, setSelectedColor] = useState(DEFAULT_SHAPE.FILL_COLOR);

  // NEW: Centralized canvas state (replaces 16+ refs)
  const canvasState = useRef(new CanvasState()).current;

  // NEW: Tool handlers (initialized lazily, stored in ref)
  const selectToolRef = useRef<ToolHandlers | null>(null);
  const handToolRef = useRef<ToolHandlers | null>(null);
  const rectangleToolRef = useRef<ToolHandlers | null>(null);
  const circleToolRef = useRef<ToolHandlers | null>(null);
  const ellipseToolRef = useRef<ToolHandlers | null>(null);
  const lineToolRef = useRef<ToolHandlers | null>(null);
  const textToolRef = useRef<ToolHandlers | null>(null);
  const polygonToolRef = useRef<ToolHandlers | null>(null);
  const pencilToolRef = useRef<ToolHandlers | null>(null);

  // Set mounted state
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Initialize canvas dimensions
  useEffect(() => {
    const container = canvasRef.current?.parentElement;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDimensions({ width, height });
        }
      }
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // NOTE: finalizeText and finalizePolygon now handled by their respective tools

  // Store history and shapes in refs to avoid recreating callbacks
  const historyRef = useRef(history);
  const shapesRef = useRef(shapes);

  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  useEffect(() => {
    shapesRef.current = shapes;
  }, [shapes]);

  // Handle deletion of selected shape(s) - supports multi-select
  const handleDeleteSelected = useCallback(async () => {
    const activeObject = fabricCanvasRef.current?.getActiveObject();
    const shapesToDelete = getSelectedShapes(activeObject, shapesRef.current);

    for (const shape of shapesToDelete) {
      const command = new DeleteShapeCommand(
        shape,
        createShapeInConvex,
        deleteShapeInConvex,
      );
      await historyRef.current.execute(command);
    }
  }, [createShapeInConvex, deleteShapeInConvex]);

  // Handle duplication of selected shape(s) (Cmd+D) - supports all shape types and multi-select
  const handleDuplicateSelected = useCallback(async () => {
    const activeObject = fabricCanvasRef.current?.getActiveObject();
    const shapesToDuplicate = getSelectedShapes(
      activeObject,
      shapesRef.current,
    );

    // Duplicate all shapes using utility function
    const duplicatedShapes = duplicateShapes(shapesToDuplicate, userId);

    // Create each duplicated shape
    for (const duplicateData of duplicatedShapes) {
      const command = new CreateShapeCommand(
        duplicateData,
        createShapeInConvex,
        deleteShapeInConvex,
      );
      await historyRef.current.execute(command);
    }
  }, [userId, createShapeInConvex, deleteShapeInConvex]);

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const selectionConfig = configureSelectionStyle();

    // Create Fabric canvas instance
    const fabricCanvas = new FabricCanvas(canvasRef.current, {
      width: dimensions.width,
      height: dimensions.height,
      backgroundColor: CANVAS.BACKGROUND_COLOR,
      selection: activeTool === "select", // Enable selection only in select mode
      renderOnAddRemove: true,
      ...selectionConfig,
    });

    fabricCanvasRef.current = fabricCanvas;

    // NEW: Initialize tools now that canvas is created
    const toolContext: ToolContext = {
      canvas: fabricCanvas,
      state: canvasState,
      userId,
      userName,
      shapes,
      createShape: createShapeInConvex,
      moveShape: moveShapeInConvex,
      updateShape: updateShapeInConvex,
      deleteShape: deleteShapeInConvex,
      history,
      updateCursorPosition,
      selectedColor,
    };
    selectToolRef.current = createSelectTool(toolContext);
    handToolRef.current = createHandTool(toolContext);
    rectangleToolRef.current = createShapeCreationTool(
      toolContext,
      "rectangle",
    );
    circleToolRef.current = createShapeCreationTool(toolContext, "circle");
    ellipseToolRef.current = createShapeCreationTool(toolContext, "ellipse");
    lineToolRef.current = createShapeCreationTool(toolContext, "line");
    textToolRef.current = createTextTool(toolContext);
    polygonToolRef.current = createPolygonTool(toolContext);
    pencilToolRef.current = createPencilTool(toolContext);

    // Setup mouse wheel handling for pan/zoom
    fabricCanvas.on("mouse:wheel", (opt) => {
      const e = opt.e as WheelEvent;
      e.preventDefault();
      e.stopPropagation();

      // Pinch gesture (ctrlKey) = zoom, two-finger scroll = pan
      if (e.ctrlKey) {
        // ZOOM: Pinch gesture detected
        const delta = e.deltaY;
        const currentZoom = fabricCanvas.getZoom();
        const newZoom = calculateZoomFromWheel(currentZoom, delta);

        // Zoom toward mouse cursor position
        const point = {
          x: e.offsetX,
          y: e.offsetY,
        };

        zoomToPoint(fabricCanvas, point, newZoom);
      } else {
        // PAN: Two-finger scroll
        const vpt = fabricCanvas.viewportTransform;
        if (vpt) {
          vpt[4] -= e.deltaX;
          vpt[5] -= e.deltaY;

          // Update control coordinates for selected objects
          const activeObject = fabricCanvas.getActiveObject();
          if (activeObject) {
            activeObject.setCoords();
          }

          fabricCanvas.requestRenderAll();
        }
      }
    });

    // Handle mouse down events
    fabricCanvas.on("mouse:down", (opt) => {
      const e = opt.e as MouseEvent;
      const pointer = fabricCanvas.getPointer(e);

      // NEW: Delegate to shape creation tools
      if (activeToolRef.current === "rectangle" && rectangleToolRef.current) {
        rectangleToolRef.current.onMouseDown(e, pointer, opt.target || null);
        return;
      }

      if (activeToolRef.current === "circle" && circleToolRef.current) {
        circleToolRef.current.onMouseDown(e, pointer, opt.target || null);
        return;
      }

      if (activeToolRef.current === "ellipse" && ellipseToolRef.current) {
        ellipseToolRef.current.onMouseDown(e, pointer, opt.target || null);
        return;
      }

      if (activeToolRef.current === "line" && lineToolRef.current) {
        lineToolRef.current.onMouseDown(e, pointer, opt.target || null);
        return;
      }

      // NEW: Delegate to text tool if in text mode
      if (activeToolRef.current === "text" && textToolRef.current) {
        textToolRef.current.onMouseDown(e, pointer, opt.target || null);
        return;
      }

      // NEW: Delegate to polygon tool if in polygon mode
      if (activeToolRef.current === "polygon" && polygonToolRef.current) {
        polygonToolRef.current.onMouseDown(e, pointer, opt.target || null);
        return;
      }

      // NEW: Delegate to hand tool if in hand mode
      if (activeToolRef.current === "hand" && handToolRef.current) {
        handToolRef.current.onMouseDown(e, pointer, opt.target || null);
        return;
      }

      // NEW: Delegate to select tool if in select mode
      if (activeToolRef.current === "select" && selectToolRef.current) {
        selectToolRef.current.onMouseDown(e, pointer, opt.target || null);
        return;
      }
    });

    fabricCanvas.on("mouse:move", (opt) => {
      const e = opt.e as MouseEvent;
      const pointer = fabricCanvas.getPointer(e);

      // Update cursor position for multiplayer (throttled to 50ms)
      // Don't send cursor updates if window is hidden (tab is in background)
      if (!document.hidden) {
        updateCursorPosition(pointer.x, pointer.y);
      }

      // NEW: Delegate to shape creation tools
      if (activeToolRef.current === "rectangle" && rectangleToolRef.current) {
        rectangleToolRef.current.onMouseMove(e, pointer);
      }

      if (activeToolRef.current === "circle" && circleToolRef.current) {
        circleToolRef.current.onMouseMove(e, pointer);
      }

      if (activeToolRef.current === "ellipse" && ellipseToolRef.current) {
        ellipseToolRef.current.onMouseMove(e, pointer);
      }

      if (activeToolRef.current === "line" && lineToolRef.current) {
        lineToolRef.current.onMouseMove(e, pointer);
      }

      // NEW: Delegate to polygon tool if in polygon mode
      if (activeToolRef.current === "polygon" && polygonToolRef.current) {
        polygonToolRef.current.onMouseMove(e, pointer);
      }

      // NEW: Delegate to hand tool if in hand mode
      if (activeToolRef.current === "hand" && handToolRef.current) {
        handToolRef.current.onMouseMove(e, pointer);
      }

      // NEW: Delegate to select tool if in select mode (for Alt+drag panning)
      if (activeToolRef.current === "select" && selectToolRef.current) {
        selectToolRef.current.onMouseMove(e, pointer);
      }
    });

    fabricCanvas.on("mouse:up", (opt) => {
      const e = opt.e as MouseEvent;
      const pointer = fabricCanvas.getPointer(e);
      // NEW: Delegate to shape creation tools
      if (activeToolRef.current === "rectangle" && rectangleToolRef.current) {
        rectangleToolRef.current.onMouseUp(e, pointer);
        return;
      }

      if (activeToolRef.current === "circle" && circleToolRef.current) {
        circleToolRef.current.onMouseUp(e, pointer);
        return;
      }

      if (activeToolRef.current === "ellipse" && ellipseToolRef.current) {
        ellipseToolRef.current.onMouseUp(e, pointer);
        return;
      }

      if (activeToolRef.current === "line" && lineToolRef.current) {
        lineToolRef.current.onMouseUp(e, pointer);
        return;
      }

      // NEW: Delegate to hand tool if in hand mode
      if (activeToolRef.current === "hand" && handToolRef.current) {
        handToolRef.current.onMouseUp(e, pointer);
        return;
      }

      // NEW: Delegate to select tool if in select mode (handles Alt+drag duplication & panning)
      if (activeToolRef.current === "select" && selectToolRef.current) {
        selectToolRef.current.onMouseUp(e, pointer);
        return;
      }

      canvasState.isDraggingShape = false;
    });

    // Handle object moving (real-time sync during drag) - throttled to 100ms
    fabricCanvas.on("object:moving", async (opt) => {
      if (!opt.target) return;

      // Skip ActiveSelection - we'll handle multi-select moves in object:modified
      if (opt.target.type === "activeSelection") return;

      const data = opt.target.get("data") as { shapeId?: string } | undefined;
      const shapeId = data?.shapeId;

      // Skip if no shapeId or it's a temporary shape still being created
      if (!shapeId || shapeId.startsWith("temp_")) return;

      // Throttle to 100ms (10 updates per second)
      const now = Date.now();
      if (now - lastMoveUpdateRef.current < 100) return;
      lastMoveUpdateRef.current = now;

      try {
        // Only sync position during drag - not size/rotation
        await moveShapeInConvex(
          shapeId,
          opt.target.left || 0,
          opt.target.top || 0,
        );
      } catch (error) {
        console.error("Failed to sync shape movement:", error);
      }
    });

    // Store object state before modifications for undo/redo
    const objectStateBeforeModify = new Map<
      string,
      { x: number; y: number; width: number; height: number; angle: number }
    >();

    // Helper: Capture object state before modification (used by scaling/rotating)
    const captureObjectState = (obj: FabricObject) => {
      const data = obj.get("data") as { shapeId?: string } | undefined;
      if (!data?.shapeId || objectStateBeforeModify.has(data.shapeId)) return;

      const shape = shapes.find((s) => s._id === data.shapeId);
      if (!shape) return;

      // Line shapes have different coordinate system
      const shapeData =
        shape.type === "line"
          ? {
              x: shape.x1,
              y: shape.y1,
              width: 0,
              height: 0,
              angle: shape.angle || 0,
            }
          : {
              x: shape.x || 0,
              y: shape.y || 0,
              width: "width" in shape ? shape.width || 0 : 0,
              height: "height" in shape ? shape.height || 0 : 0,
              angle: shape.angle || 0,
            };

      objectStateBeforeModify.set(data.shapeId, shapeData);
    };

    // Helper: Capture state for target (handles both single and multi-select)
    const captureShapeState = (target: FabricObject) => {
      // Handle ActiveSelection (multi-select)
      if (target.type === "activeSelection") {
        // Access _objects through property access
        const objects =
          (target as { _objects?: FabricObject[] })._objects || [];
        objects.forEach((obj: FabricObject) => captureObjectState(obj));
        return;
      }

      // Handle single object
      captureObjectState(target);
    };

    // Single handler for both scaling and rotating events
    const handleObjectTransformStart = (opt: any) => {
      if (!opt.target) return;
      captureShapeState(opt.target);
    };

    fabricCanvas.on("object:scaling", handleObjectTransformStart);
    fabricCanvas.on("object:rotating", handleObjectTransformStart);

    // Handle object modifications (resize, rotation, etc.) - sync to Convex
    fabricCanvas.on("object:modified", async (opt) => {
      if (!opt.target) return;

      // Handle ActiveSelection (multi-select) - DO NOT save during group modification
      // Fabric.js mutates object coordinates to be relative during grouping
      // Instead, we'll handle this in the selection:cleared event
      if (opt.target.type === "activeSelection") {
        // Store the selection for later processing when cleared
        const objects =
          (opt.target as { _objects?: FabricObject[] })._objects || [];

        // Mark all objects in selection to prevent position updates from Convex
        objects.forEach((obj: FabricObject) => {
          const data = obj.get("data") as { shapeId?: string } | undefined;
          if (data?.shapeId) {
            savingShapesRef.current.add(data.shapeId);
          }
        });

        // We'll handle the actual saving when the selection is cleared
        // and objects are restored to their absolute positions
        return;
      }

      // Handle single object modification
      const data = opt.target.get("data") as { shapeId?: string } | undefined;
      const shapeId = data?.shapeId;

      if (!shapeId) return;

      // Mark this shape as being saved to prevent sync conflicts
      savingShapesRef.current.add(shapeId);

      try {
        // Check if size changed (scaling/resizing)
        const scaleX = opt.target.scaleX ?? 1;
        const scaleY = opt.target.scaleY ?? 1;

        // If object was scaled, apply the scale to width/height and reset scale
        if (scaleX !== 1 || scaleY !== 1) {
          const newWidth = (opt.target.width ?? 0) * scaleX;
          const newHeight = (opt.target.height ?? 0) * scaleY;

          opt.target.set({
            width: newWidth,
            height: newHeight,
            scaleX: 1,
            scaleY: 1,
          });
        }

        const newValues = {
          x: opt.target.left,
          y: opt.target.top,
          width: opt.target.width,
          height: opt.target.height,
          angle: opt.target.angle,
        };

        // Get old values from our stored state
        const oldValues = objectStateBeforeModify.get(shapeId);

        if (oldValues) {
          // Use command pattern for undo/redo support
          const command = new UpdateShapeCommand(
            shapeId,
            oldValues,
            newValues,
            updateShapeInConvex,
          );
          await historyRef.current.execute(command);

          // Clear the stored state
          objectStateBeforeModify.delete(shapeId);
        } else {
          // Fallback: direct update without undo support (shouldn't happen normally)
          await updateShapeInConvex(shapeId, newValues);
        }
      } catch (error) {
        console.error("Failed to sync shape changes:", error);
      } finally {
        // Allow sync updates again after a brief delay to ensure Convex has propagated
        setTimeout(() => {
          savingShapesRef.current.delete(shapeId);
        }, 100);
      }
    });

    // NOTE: Text editing events now handled by useTextTool

    // Handle object selection
    fabricCanvas.on("selection:created", () => {
      // Optional: Add any selection-specific logic here
    });

    fabricCanvas.on("selection:cleared", (e) => {
      // When selection is cleared, save the absolute positions of previously selected objects
      // This handles the case where ActiveSelection modified object coordinates
      const deselected =
        (e as { deselected?: FabricObject[] }).deselected || [];

      deselected.forEach(async (obj: FabricObject) => {
        const data = obj.get("data") as { shapeId?: string } | undefined;
        const shapeId = data?.shapeId;

        if (!shapeId) return;

        try {
          // Now the object has been restored to absolute coordinates by Fabric
          // Save the current position to Convex
          const newValues = {
            x: obj.left || 0,
            y: obj.top || 0,
            width: (obj.width || 0) * (obj.scaleX || 1),
            height: (obj.height || 0) * (obj.scaleY || 1),
            angle: obj.angle || 0,
          };

          // Reset scale after applying to dimensions
          obj.set({ scaleX: 1, scaleY: 1 });
          obj.setCoords();

          // Save to Convex
          await updateShapeInConvex(shapeId, newValues);
        } catch (error) {
          console.error(
            "Failed to save shape position after selection cleared:",
            error,
          );
        } finally {
          // Remove from saving set
          setTimeout(() => {
            savingShapesRef.current.delete(shapeId);
          }, 100);
        }
      });
    });

    // Handle hover preview in select mode - show border on mouse over
    fabricCanvas.on("mouse:over", (opt) => {
      // Only show hover effect in select mode
      if (activeToolRef.current !== "select") return;

      // Only for actual objects, not during interactions
      if (
        opt.target &&
        !canvasState.isDraggingShape &&
        !canvasState.isPanning &&
        !canvasState.creation.isActive
      ) {
        // Don't highlight if already selected
        const isSelected = fabricCanvas.getActiveObjects().includes(opt.target);
        if (isSelected) return;

        // Store reference to hovered object
        hoveredObjectRef.current = opt.target;

        // Add hover effect - blue border
        opt.target.set({
          strokeWidth: 2,
          stroke: "#3b82f6", // Blue highlight
        });

        fabricCanvas.requestRenderAll();
      }
    });

    // Handle hover preview removal on mouse out
    fabricCanvas.on("mouse:out", (opt) => {
      if (opt.target && opt.target === hoveredObjectRef.current) {
        // Remove hover effect
        opt.target.set({
          strokeWidth: 0,
          stroke: undefined,
        });

        hoveredObjectRef.current = null;
        fabricCanvas.requestRenderAll();
      }
    });

    // Notify parent component that canvas is ready
    onCanvasReady?.(fabricCanvas);

    // Cleanup
    return () => {
      fabricCanvas.dispose();
      fabricCanvasRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, updateCursorPosition]);

  // Separate effect to handle canvas resize without recreating it
  useEffect(() => {
    if (!fabricCanvasRef.current) return;

    // Update canvas dimensions without recreating the entire canvas
    fabricCanvasRef.current.setDimensions({
      width: dimensions.width,
      height: dimensions.height,
    });

    // Update viewport coordinates for selected objects
    const activeObject = fabricCanvasRef.current.getActiveObject();
    if (activeObject) {
      activeObject.setCoords();
    }

    fabricCanvasRef.current.requestRenderAll();
  }, [dimensions.width, dimensions.height]);

  // Pass delete handler to parent component
  useEffect(() => {
    if (onDeleteSelected) {
      onDeleteSelected(handleDeleteSelected);
    }
  }, [onDeleteSelected, handleDeleteSelected]);

  // Pass duplicate handler to parent component
  useEffect(() => {
    if (onDuplicateSelected) {
      onDuplicateSelected(handleDuplicateSelected);
    }
  }, [onDuplicateSelected, handleDuplicateSelected]);

  // Update canvas selection mode when tool changes
  useEffect(() => {
    if (fabricCanvasRef.current) {
      // Update the ref so event handlers have the latest value
      activeToolRef.current = activeTool;

      const isSelectMode = activeTool === "select";
      const isHandMode = activeTool === "hand";

      // NEW: Delegate to tool onActivate for all extracted tools
      if (isSelectMode && selectToolRef.current) {
        selectToolRef.current.onActivate();
      } else if (isHandMode && handToolRef.current) {
        handToolRef.current.onActivate();
      } else if (activeTool === "rectangle" && rectangleToolRef.current) {
        rectangleToolRef.current.onActivate();
      } else if (activeTool === "circle" && circleToolRef.current) {
        circleToolRef.current.onActivate();
      } else if (activeTool === "ellipse" && ellipseToolRef.current) {
        ellipseToolRef.current.onActivate();
      } else if (activeTool === "line" && lineToolRef.current) {
        lineToolRef.current.onActivate();
      } else if (activeTool === "text" && textToolRef.current) {
        textToolRef.current.onActivate();
      } else if (activeTool === "polygon" && polygonToolRef.current) {
        polygonToolRef.current.onActivate();
      } else if (activeTool === "pencil" && pencilToolRef.current) {
        pencilToolRef.current.onActivate();
      } else {
        // Fallback for any unhandled tools
        fabricCanvasRef.current.selection = isSelectMode;
        fabricCanvasRef.current.defaultCursor = "default";
        fabricCanvasRef.current.hoverCursor = "move";
        fabricCanvasRef.current.setCursor("default");

        // Clear hover state when switching tools
        if (hoveredObjectRef.current) {
          hoveredObjectRef.current.set({
            strokeWidth: 0,
            stroke: undefined,
          });
          hoveredObjectRef.current = null;
        }

        fabricCanvasRef.current.requestRenderAll();
      }
    }
  }, [activeTool]);

  // NOTE: Pencil tool now handled by usePencilTool - no separate effect needed
  // NOTE: Polygon tool keyboard events now handled by usePolygonTool - no separate effect needed
  // NOTE: Text tool events now handled by useTextTool - no separate effect needed

  // Sync shapes with Fabric canvas - ensure all shapes are rendered and updated
  useEffect(() => {
    if (!fabricCanvasRef.current) return;

    const fabricCanvas = fabricCanvasRef.current;

    // Build map of Fabric objects by shape ID
    const fabricObjectMap = new Map();
    const canvasObjects = fabricCanvas.getObjects();

    canvasObjects.forEach((obj) => {
      const data = obj.get("data") as { shapeId?: string } | undefined;
      if (data?.shapeId) {
        fabricObjectMap.set(data.shapeId, obj);
      }
    });

    // Track shapes from database
    const dbShapeIds = new Set(shapes.map((s) => s._id));

    // Performance optimization: Batch rendering by disabling auto-render
    const shouldBatchRender = shapes.length > 5; // Only batch if multiple shapes
    if (shouldBatchRender) {
      fabricCanvas.renderOnAddRemove = false;
    }

    // Update or add shapes
    shapes.forEach((shape) => {
      const fabricObj = fabricObjectMap.get(shape._id);

      if (fabricObj) {
        // Skip updates if user is actively interacting with this object
        // This prevents jittery behavior and control glitching when editing
        const activeObject = fabricCanvas.getActiveObject();

        // Check if this object is the active object OR part of an active selection
        const isActiveObject = activeObject === fabricObj;
        const isInActiveSelection =
          activeObject?.type === "activeSelection" &&
          (activeObject as { _objects?: FabricObject[] })._objects?.includes(
            fabricObj,
          );

        if (isActiveObject || isInActiveSelection) {
          return;
        }

        // Skip updates if this shape is currently being saved
        // This prevents the old data from overwriting the new data before Convex syncs
        if (savingShapesRef.current.has(shape._id)) {
          return;
        }

        // Update existing shape
        updateFabricRect(fabricObj, shape);
      } else {
        // Add new shape
        const fabricRect = createFabricRect(shape);
        fabricCanvas.add(fabricRect);
      }
    });

    // Remove shapes that no longer exist in database
    fabricCanvas.getObjects().forEach((obj) => {
      const data = obj.get("data") as { shapeId?: string } | undefined;

      if (!data?.shapeId) {
        return;
      }

      const inDatabase = dbShapeIds.has(data.shapeId);
      const beingSaved = savingShapesRef.current.has(data.shapeId);

      // Only remove if:
      // 1. It has a shapeId (it's been saved before)
      // 2. That shapeId is not in the database anymore
      // 3. It's not currently being saved (to prevent race condition)
      if (!inDatabase && !beingSaved) {
        fabricCanvas.remove(obj);
      }
    });

    // Re-enable auto-render and render once
    if (shouldBatchRender) {
      fabricCanvas.renderOnAddRemove = true;
    }
    fabricCanvas.requestRenderAll();
  }, [shapes]);

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      onWheel={(e) => {
        // Prevent browser navigation gestures (back/forward swipe)
        e.preventDefault();
      }}
    >
      <canvas ref={canvasRef} />
    </div>
  );
};

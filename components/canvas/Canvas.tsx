"use client";

/**
 * Main Canvas component using Fabric.js
 * Handles pan/zoom functionality, shape creation, selection, and dragging
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { Canvas as FabricCanvas, FabricObject, Rect } from "fabric";
import { CANVAS, ZOOM, DEFAULT_SHAPE } from "@/constants/shapes";
import { calculateZoomFromWheel } from "@/lib/viewport-utils";
import { zoomToPoint } from "@/lib/canvas-utils";
import { createFabricRect, updateFabricRect } from "./Shape";
import { configureSelectionStyle } from "./SelectionBox";
import { SELECTION_COLORS } from "@/constants/colors";
import { useShapes } from "@/hooks/useShapes";
import type { Shape } from "@/types/shapes";
import type { Tool } from "../toolbar/Toolbar";

interface CanvasProps {
  onCanvasReady?: (canvas: FabricCanvas) => void;
  activeTool: Tool;
  userId?: string;
  userName?: string;
  onDeleteSelected?: (handler: () => void) => void;
  updateCursorPosition: (x: number, y: number) => void;
}

export function Canvas({
  onCanvasReady,
  activeTool,
  userId = "anonymous",
  userName = "Anonymous",
  onDeleteSelected,
  updateCursorPosition,
}: CanvasProps) {
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

  // Track panning state
  const isPanningRef = useRef(false);
  const lastPosXRef = useRef(0);
  const lastPosYRef = useRef(0);

  // Track if we're dragging a shape
  const isDraggingShapeRef = useRef(false);

  // Track last move update time for throttling real-time movement
  const lastMoveUpdateRef = useRef<number>(0);

  // Track rectangle creation state
  const isCreatingRectRef = useRef(false);
  const creatingRectRef = useRef<Rect | null>(null);
  const creatingStartPointRef = useRef<{ x: number; y: number } | null>(null);

  // Set mounted state
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Initialize canvas dimensions
  useEffect(() => {
    const updateDimensions = () => {
      // Get the canvas container dimensions
      const container = canvasRef.current?.parentElement;
      if (container) {
        setDimensions({
          width: container.clientWidth,
          height: container.clientHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Finalize rectangle creation
  const finalizeRectangle = useCallback(
    async (rect: Rect) => {
      // Only create if rectangle has meaningful size
      if ((rect.width || 0) < 5 || (rect.height || 0) < 5) {
        // Too small, remove it
        if (fabricCanvasRef.current) {
          fabricCanvasRef.current.remove(rect);
        }
        return null;
      }

      try {
        // Create shape in Convex
        const shapeId = await createShapeInConvex({
          type: "rectangle",
          x: rect.left || 0,
          y: rect.top || 0,
          width: rect.width || DEFAULT_SHAPE.WIDTH,
          height: rect.height || DEFAULT_SHAPE.HEIGHT,
          fillColor: DEFAULT_SHAPE.FILL_COLOR,
          createdBy: userId,
          createdAt: Date.now(),
          lastModified: Date.now(),
          lastModifiedBy: userId,
        });

        // Store the real shape ID in the rect's data
        rect.set("data", { shapeId: shapeId });

        // Trigger selection event now that we have the shapeId
        if (fabricCanvasRef.current) {
          fabricCanvasRef.current.fire("selection:updated", {
            selected: [rect],
          });
        }

        return shapeId;
      } catch (error) {
        console.error("Failed to create shape:", error);
        // Remove the rectangle from canvas on error
        if (fabricCanvasRef.current) {
          fabricCanvasRef.current.remove(rect);
        }
        return null;
      }
    },
    [userId, createShapeInConvex],
  );

  // Handle deletion of selected shape
  const handleDeleteSelected = useCallback(() => {
    const activeObject = fabricCanvasRef.current?.getActiveObject();
    if (!activeObject) return;

    const data = activeObject.get("data") as { shapeId?: string } | undefined;
    if (data?.shapeId) {
      deleteShapeInConvex(data.shapeId);
    }
  }, [deleteShapeInConvex]);

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

      // Rectangle creation mode - start drawing
      if (activeToolRef.current === "rectangle" && !opt.target) {
        isCreatingRectRef.current = true;
        creatingStartPointRef.current = { x: pointer.x, y: pointer.y };

        // Create a temporary rectangle (always blue)
        const rect = new Rect({
          left: pointer.x,
          top: pointer.y,
          width: 0,
          height: 0,
          fill: DEFAULT_SHAPE.FILL_COLOR, // Always use blue
          strokeWidth: 2,
          stroke: SELECTION_COLORS.BORDER,
          selectable: false,
          evented: false,
          // Add corner styling even during creation
          hasControls: true,
          cornerColor: SELECTION_COLORS.HANDLE,
          cornerStrokeColor: SELECTION_COLORS.HANDLE_BORDER,
          cornerSize: 10,
          transparentCorners: false,
          cornerStyle: "circle" as const,
          borderColor: SELECTION_COLORS.BORDER,
          borderScaleFactor: 2,
        });

        creatingRectRef.current = rect;
        fabricCanvas.add(rect);
        fabricCanvas.renderAll();
        return;
      }

      // Select mode with panning
      if (activeToolRef.current === "select") {
        // If clicking on an object, we're dragging a shape
        if (opt.target) {
          isDraggingShapeRef.current = true;
          return;
        }

        // Enable panning with Alt key or when clicking empty space
        if (e.altKey || !opt.target) {
          isPanningRef.current = true;
          fabricCanvas.selection = false; // Disable selection during pan
          lastPosXRef.current = e.clientX;
          lastPosYRef.current = e.clientY;
          fabricCanvas.setCursor("grabbing");
        }
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

      // Handle rectangle creation dragging
      if (
        isCreatingRectRef.current &&
        creatingRectRef.current &&
        creatingStartPointRef.current
      ) {
        const startX = creatingStartPointRef.current.x;
        const startY = creatingStartPointRef.current.y;

        // Calculate rectangle dimensions
        const width = pointer.x - startX;
        const height = pointer.y - startY;

        // Update rectangle (handle negative dimensions for dragging in any direction)
        if (width < 0) {
          creatingRectRef.current.set({
            left: pointer.x,
            width: Math.abs(width),
          });
        } else {
          creatingRectRef.current.set({ left: startX, width: width });
        }

        if (height < 0) {
          creatingRectRef.current.set({
            top: pointer.y,
            height: Math.abs(height),
          });
        } else {
          creatingRectRef.current.set({ top: startY, height: height });
        }

        fabricCanvas.renderAll();
        return;
      }

      // Handle panning
      if (!isPanningRef.current) return;

      const vpt = fabricCanvas.viewportTransform;

      if (vpt) {
        vpt[4] += e.clientX - lastPosXRef.current;
        vpt[5] += e.clientY - lastPosYRef.current;

        // Update control coordinates for selected objects during pan
        const activeObject = fabricCanvas.getActiveObject();
        if (activeObject) {
          activeObject.setCoords();
        }

        fabricCanvas.requestRenderAll();
        lastPosXRef.current = e.clientX;
        lastPosYRef.current = e.clientY;
      }
    });

    fabricCanvas.on("mouse:up", () => {
      // Handle rectangle creation completion
      if (isCreatingRectRef.current && creatingRectRef.current) {
        const createdRect = creatingRectRef.current;

        // Check if the rectangle has meaningful size (at least 5x5 pixels)
        const rectWidth = createdRect.width || 0;
        const rectHeight = createdRect.height || 0;

        if (rectWidth < 5 || rectHeight < 5) {
          // Too small - this was likely an accidental click, remove it
          fabricCanvas.remove(createdRect);

          // Reset creation state
          isCreatingRectRef.current = false;
          creatingRectRef.current = null;
          creatingStartPointRef.current = null;

          fabricCanvas.renderAll();
          return;
        }

        // Remove stroke and make it selectable
        createdRect.set({
          stroke: undefined,
          strokeWidth: 0,
          selectable: true,
          evented: true,
        });

        // Enable selection mode on the canvas
        fabricCanvas.selection = true;

        // Select the newly created rectangle immediately (visual feedback)
        fabricCanvas.setActiveObject(createdRect);
        fabricCanvas.renderAll();

        // Reset creation state
        isCreatingRectRef.current = false;
        creatingRectRef.current = null;
        creatingStartPointRef.current = null;

        // Finalize the rectangle (async - will trigger selection:updated when done)
        finalizeRectangle(createdRect);

        return;
      }

      // Handle panning end
      if (isPanningRef.current) {
        const vpt = fabricCanvas.viewportTransform;
        if (vpt) {
          fabricCanvas.setViewportTransform(vpt);
        }
        isPanningRef.current = false;
        fabricCanvas.selection = activeToolRef.current === "select"; // Re-enable selection if in select mode
        fabricCanvas.setCursor("default");
      }

      isDraggingShapeRef.current = false;
    });

    // Handle object moving (real-time sync during drag) - throttled to 100ms
    fabricCanvas.on("object:moving", async (opt) => {
      if (!opt.target) return;

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

    // Handle object modifications (resize, rotation, etc.) - sync to Convex
    fabricCanvas.on("object:modified", async (opt) => {
      if (!opt.target) return;

      // Access custom data using get method
      const data = opt.target.get("data") as { shapeId?: string } | undefined;
      const shapeId = data?.shapeId;

      if (!shapeId) return;

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

        // Sync all properties to Convex (including rotation)
        await updateShapeInConvex(shapeId, {
          x: opt.target.left,
          y: opt.target.top,
          width: opt.target.width,
          height: opt.target.height,
          angle: opt.target.angle,
        });
      } catch (error) {
        console.error("Failed to sync shape changes:", error);
      }
    });

    // Handle object selection
    fabricCanvas.on("selection:created", () => {
      // Optional: Add any selection-specific logic here
    });

    fabricCanvas.on("selection:cleared", () => {
      // Optional: Add any deselection-specific logic here
    });

    // Notify parent component that canvas is ready
    onCanvasReady?.(fabricCanvas);

    // Cleanup
    return () => {
      fabricCanvas.dispose();
      fabricCanvasRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    dimensions.width,
    dimensions.height,
    finalizeRectangle,
    userId,
    updateCursorPosition,
  ]);

  // Pass delete handler to parent component
  useEffect(() => {
    if (onDeleteSelected) {
      onDeleteSelected(handleDeleteSelected);
    }
  }, [onDeleteSelected, handleDeleteSelected]);

  // Update canvas selection mode when tool changes
  useEffect(() => {
    if (fabricCanvasRef.current) {
      // Update the ref so event handlers have the latest value
      activeToolRef.current = activeTool;

      const isSelectMode = activeTool === "select";
      fabricCanvasRef.current.selection = isSelectMode;

      // Update cursor based on tool
      if (activeTool === "rectangle") {
        fabricCanvasRef.current.defaultCursor = "crosshair";
        fabricCanvasRef.current.hoverCursor = "crosshair";
      } else {
        fabricCanvasRef.current.defaultCursor = "default";
        fabricCanvasRef.current.hoverCursor = "move";
      }

      // Make objects selectable in select mode OR rectangle mode (for color picker)
      // In rectangle mode: shapes are selectable but canvas selection box is disabled
      fabricCanvasRef.current.getObjects().forEach((obj) => {
        obj.selectable = true; // Always selectable for color picker access
        obj.evented = true;
      });

      // Important: Request render to show the objects
      fabricCanvasRef.current.requestRenderAll();
    }
  }, [activeTool]);

  // Sync shapes with Fabric canvas - ensure all shapes are rendered and updated
  useEffect(() => {
    if (!fabricCanvasRef.current) return;

    const fabricCanvas = fabricCanvasRef.current;

    // Build map of Fabric objects by shape ID
    const fabricObjectMap = new Map();
    fabricCanvas.getObjects().forEach((obj) => {
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
        if (activeObject === fabricObj) {
          // Don't apply remote updates to the object you're currently manipulating
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
      if (data?.shapeId && !dbShapeIds.has(data.shapeId)) {
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
      className="relative w-full h-full overflow-hidden bg-slate-900"
      onWheel={(e) => {
        // Prevent browser navigation gestures (back/forward swipe)
        e.preventDefault();
      }}
    >
      {/* Subtle dot pattern background */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255, 255, 255, 0.15) 1px, transparent 1px)",
          backgroundSize: "30px 30px",
        }}
      ></div>

      <canvas ref={canvasRef} className="relative z-10" />

      {/* Multiplayer cursors - rendered by parent component */}

      {/* Canvas info overlay (for development) - only render on client */}
      {isMounted && (
        <div className="absolute bottom-6 left-6 bg-slate-900/80 backdrop-blur-xl border border-white/10 text-white text-xs px-4 py-3 rounded-xl pointer-events-none shadow-2xl">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
            <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
            <span className="text-white/70 font-semibold">Canvas Stats</span>
          </div>
          <div className="space-y-1 text-white/60">
            <div className="flex justify-between gap-4">
              <span>Dimensions:</span>
              <span className="text-white/90 font-mono">
                {dimensions.width}×{dimensions.height}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Shapes:</span>
              <span className="text-white/90 font-mono">{shapes.length}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Active Tool:</span>
              <span className="text-white/90 capitalize">{activeTool}</span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-white/10 text-white/50 text-[10px]">
            {activeTool === "rectangle"
              ? "🖱️ Click & drag to create rectangle"
              : "✌️ Pinch to zoom • Pan with scroll"}
          </div>
        </div>
      )}
    </div>
  );
}

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
import {
  createFabricRect,
  getShapeFromFabricObject,
  updateFabricRect,
} from "./Shape";
import { configureSelectionStyle } from "./SelectionBox";
import { SELECTION_COLORS } from "@/constants/colors";
import { useShapes } from "@/hooks/useShapes";
import { usePresence } from "@/hooks/usePresence";
import { getUserColor } from "@/lib/color-utils";
import { MultiplayerCursor } from "./MultiplayerCursor";
import type { Shape } from "@/types/shapes";
import type { Tool } from "../toolbar/Toolbar";

interface CanvasProps {
  onCanvasReady?: (canvas: FabricCanvas) => void;
  activeTool: Tool;
  userId?: string;
  userName?: string;
  onDeleteSelected?: (handler: () => void) => void;
}

export function Canvas({
  onCanvasReady,
  activeTool,
  userId = "anonymous",
  userName = "Anonymous",
  onDeleteSelected,
}: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<FabricCanvas | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [isMounted, setIsMounted] = useState(false);

  // Real-time shape state from Convex
  const {
    shapes,
    createShape: createShapeInConvex,
    moveShape: moveShapeInConvex,
    deleteShape: deleteShapeInConvex,
  } = useShapes();

  // Real-time presence and cursor tracking
  // Only enable presence when we have a valid userId (not anonymous)
  const isAuthenticated = userId !== "anonymous" && !!userId;
  const userColor = getUserColor(userId);
  const { otherUsers, updateCursorPosition } = usePresence({
    userId,
    userName,
    userColor,
    enabled: isAuthenticated,
  });

  // Track panning state
  const isPanningRef = useRef(false);
  const lastPosXRef = useRef(0);
  const lastPosYRef = useRef(0);

  // Track if we're dragging a shape
  const isDraggingShapeRef = useRef(false);

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
        return;
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
      } catch (error) {
        console.error("Failed to create shape:", error);
        // Remove the rectangle from canvas on error
        if (fabricCanvasRef.current) {
          fabricCanvasRef.current.remove(rect);
        }
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

    // Setup mouse wheel handling
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
          fabricCanvas.requestRenderAll();
        }
      }
    });

    // Handle mouse down events
    fabricCanvas.on("mouse:down", (opt) => {
      const e = opt.e as MouseEvent;
      const pointer = fabricCanvas.getPointer(e);

      // Rectangle creation mode - start drawing
      if (activeTool === "rectangle" && !opt.target) {
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
        });

        creatingRectRef.current = rect;
        fabricCanvas.add(rect);
        fabricCanvas.renderAll();
        return;
      }

      // Select mode with panning
      if (activeTool === "select") {
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
      updateCursorPosition(pointer.x, pointer.y);

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
        fabricCanvas.requestRenderAll();
        lastPosXRef.current = e.clientX;
        lastPosYRef.current = e.clientY;
      }
    });

    fabricCanvas.on("mouse:up", () => {
      // Handle rectangle creation completion
      if (isCreatingRectRef.current && creatingRectRef.current) {
        // Remove stroke and make it selectable
        creatingRectRef.current.set({
          stroke: undefined,
          strokeWidth: 0,
          selectable: true,
          evented: true,
        });

        // Finalize the rectangle
        finalizeRectangle(creatingRectRef.current);

        // Reset creation state
        isCreatingRectRef.current = false;
        creatingRectRef.current = null;
        creatingStartPointRef.current = null;

        fabricCanvas.renderAll();
        return;
      }

      // Handle panning end
      if (isPanningRef.current) {
        const vpt = fabricCanvas.viewportTransform;
        if (vpt) {
          fabricCanvas.setViewportTransform(vpt);
        }
        isPanningRef.current = false;
        fabricCanvas.selection = activeTool === "select"; // Re-enable selection if in select mode
        fabricCanvas.setCursor("default");
      }

      isDraggingShapeRef.current = false;
    });

    // Handle object movement (sync to Convex)
    fabricCanvas.on("object:modified", async (opt) => {
      if (!opt.target) return;

      // Access custom data using get method
      const data = opt.target.get("data") as { shapeId?: string } | undefined;
      const shapeId = data?.shapeId;

      if (
        shapeId &&
        opt.target.left !== undefined &&
        opt.target.top !== undefined
      ) {
        try {
          // Sync to Convex
          await moveShapeInConvex(shapeId, opt.target.left, opt.target.top);
        } catch (error) {
          console.error("Failed to sync shape movement:", error);
        }
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
    activeTool,
    finalizeRectangle,
    userId,
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

      // Make objects selectable only in select mode
      fabricCanvasRef.current.getObjects().forEach((obj) => {
        obj.selectable = isSelectMode;
        obj.evented = isSelectMode;
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

    // Update or add shapes
    shapes.forEach((shape) => {
      const fabricObj = fabricObjectMap.get(shape._id);

      if (fabricObj) {
        // Skip if user is actively dragging this object
        if (fabricCanvas.getActiveObject() === fabricObj) {
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

    fabricCanvas.requestRenderAll();
  }, [shapes]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-900">
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

      {/* Multiplayer cursors */}
      {isMounted &&
        otherUsers.map((user) => (
          <MultiplayerCursor
            key={user.userId}
            user={user}
            canvas={fabricCanvasRef.current}
          />
        ))}

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
            <div className="flex justify-between gap-4">
              <span>Users Online:</span>
              <span className="text-white/90 font-mono">
                {otherUsers.length + 1}
              </span>
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

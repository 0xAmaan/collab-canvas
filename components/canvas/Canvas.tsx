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
import { createFabricRect, getShapeFromFabricObject } from "./Shape";
import { configureSelectionStyle } from "./SelectionBox";
import { SELECTION_COLORS } from "@/constants/colors";
import { useShapes } from "@/hooks/useShapes";
import type { Shape } from "@/types/shapes";
import type { Tool } from "../toolbar/Toolbar";

interface CanvasProps {
  onCanvasReady?: (canvas: FabricCanvas) => void;
  activeTool: Tool;
  userId?: string;
}

export function Canvas({
  onCanvasReady,
  activeTool,
  userId = "anonymous",
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
  } = useShapes();

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
      // Handle rectangle creation dragging
      if (
        isCreatingRectRef.current &&
        creatingRectRef.current &&
        creatingStartPointRef.current
      ) {
        const e = opt.e as MouseEvent;
        const pointer = fabricCanvas.getPointer(e);
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

      const e = opt.e as MouseEvent;
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

  // Sync shapes with Fabric canvas - ensure all shapes are rendered
  useEffect(() => {
    if (!fabricCanvasRef.current) return;

    const fabricCanvas = fabricCanvasRef.current;

    // Get current Fabric objects
    const fabricObjects = fabricCanvas.getObjects();
    const fabricShapeIds = new Set(
      fabricObjects
        .map((obj) => {
          const data = obj.get("data") as { shapeId?: string } | undefined;
          return data?.shapeId;
        })
        .filter(Boolean),
    );

    // Add any shapes that are missing from the canvas
    shapes.forEach((shape) => {
      if (!fabricShapeIds.has(shape._id)) {
        const fabricRect = createFabricRect(shape);
        fabricCanvas.add(fabricRect);
      }
    });

    // Force render
    fabricCanvas.requestRenderAll();
  }, [shapes]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <canvas ref={canvasRef} />

      {/* Canvas info overlay (for development) - only render on client */}
      {isMounted && (
        <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white text-xs px-3 py-2 rounded pointer-events-none">
          <div>
            Canvas: {dimensions.width}x{dimensions.height}
          </div>
          <div>Shapes: {shapes.length}</div>
          <div>Tool: {activeTool}</div>
          <div className="mt-1 text-gray-300">
            {activeTool === "rectangle"
              ? "Click & drag to create rectangle"
              : "2-finger scroll to pan • Pinch to zoom"}
          </div>
        </div>
      )}
    </div>
  );
}

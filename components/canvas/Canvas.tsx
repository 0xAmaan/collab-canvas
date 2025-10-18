"use client";

/**
 * Main Canvas component using Fabric.js
 * Handles pan/zoom functionality, shape creation, selection, and dragging
 */

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Canvas as FabricCanvas,
  FabricObject,
  Rect,
  Circle,
  Ellipse,
  Line,
  IText,
} from "fabric";
import { CANVAS, ZOOM, DEFAULT_SHAPE, DEFAULT_TEXT } from "@/constants/shapes";
import { calculateZoomFromWheel } from "@/lib/viewport-utils";
import { zoomToPoint } from "@/lib/canvas-utils";
import { createFabricRect, updateFabricRect } from "./Shape";
import { configureSelectionStyle } from "./SelectionBox";
import { SELECTION_COLORS } from "@/constants/colors";
import { useShapes } from "@/hooks/useShapes";
import type { Shape } from "@/types/shapes";
import type { Tool } from "../toolbar/BottomToolbar";
import { CreateShapeCommand } from "@/lib/commands/CreateShapeCommand";
import { UpdateShapeCommand } from "@/lib/commands/UpdateShapeCommand";
import { DeleteShapeCommand } from "@/lib/commands/DeleteShapeCommand";

interface CanvasProps {
  onCanvasReady?: (canvas: FabricCanvas) => void;
  activeTool: Tool;
  userId?: string;
  userName?: string;
  onDeleteSelected?: (handler: () => void) => void;
  onDuplicateSelected?: (handler: () => void) => void;
  updateCursorPosition: (x: number, y: number) => void;
  history: {
    execute: (command: any) => Promise<void>;
    undo: () => Promise<void>;
    redo: () => Promise<void>;
    canUndo: boolean;
    canRedo: boolean;
    clear: () => void;
  };
}

export function Canvas({
  onCanvasReady,
  activeTool,
  userId = "anonymous",
  userName = "Anonymous",
  onDeleteSelected,
  onDuplicateSelected,
  updateCursorPosition,
  history,
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

  // Track shapes currently being saved to prevent sync conflicts
  const savingShapesRef = useRef<Set<string>>(new Set());

  // Track rectangle creation state
  const isCreatingRectRef = useRef(false);
  const creatingRectRef = useRef<Rect | null>(null);
  const creatingStartPointRef = useRef<{ x: number; y: number } | null>(null);

  // Track circle creation state
  const isCreatingCircleRef = useRef(false);
  const creatingCircleRef = useRef<Circle | null>(null);

  // Track ellipse creation state
  const isCreatingEllipseRef = useRef(false);
  const creatingEllipseRef = useRef<Ellipse | null>(null);

  // Track line creation state
  const isCreatingLineRef = useRef(false);
  const creatingLineRef = useRef<Line | null>(null);

  // Track text creation and editing state
  const isEditingTextRef = useRef(false);
  const editingTextRef = useRef<IText | null>(null);
  const textUpdateTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Track Alt+drag duplication state
  const isDuplicatingRef = useRef(false);
  const originalShapeDataRef = useRef<Shape | null>(null);

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
        // Create shape data
        const shapeData = {
          type: "rectangle" as const,
          x: rect.left || 0,
          y: rect.top || 0,
          width: rect.width || DEFAULT_SHAPE.WIDTH,
          height: rect.height || DEFAULT_SHAPE.HEIGHT,
          fillColor: DEFAULT_SHAPE.FILL_COLOR,
          createdBy: userId,
          createdAt: Date.now(),
          lastModified: Date.now(),
          lastModifiedBy: userId,
        };

        // Use command pattern for undo/redo support
        const command = new CreateShapeCommand(
          shapeData,
          createShapeInConvex,
          deleteShapeInConvex,
        );

        await historyRef.current.execute(command);

        // Get the shapeId from the command
        const shapeId = (command as any).shapeId;

        // Store the real shape ID in the rect's data so sync recognizes it
        // This prevents the sync from creating a duplicate
        if (shapeId) {
          rect.set("data", { shapeId: shapeId });
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
    [userId, createShapeInConvex, deleteShapeInConvex],
  );

  // Finalize circle creation
  const finalizeCircle = useCallback(
    async (circle: Circle) => {
      // Only create if circle has meaningful size
      if ((circle.radius || 0) < 3) {
        // Too small, remove it
        if (fabricCanvasRef.current) {
          fabricCanvasRef.current.remove(circle);
        }
        return null;
      }

      try {
        // Create shape data - store as width/height (diameter)
        const diameter = (circle.radius || 0) * 2;
        const shapeData = {
          type: "circle" as const,
          x: circle.left || 0,
          y: circle.top || 0,
          width: diameter,
          height: diameter, // Circle has equal width/height
          fillColor: DEFAULT_SHAPE.FILL_COLOR,
          createdBy: userId,
          createdAt: Date.now(),
          lastModified: Date.now(),
          lastModifiedBy: userId,
        };

        const command = new CreateShapeCommand(
          shapeData,
          createShapeInConvex,
          deleteShapeInConvex,
        );

        await historyRef.current.execute(command);

        // Get the shapeId from the command and store it to prevent duplication
        const shapeId = (command as any).shapeId;
        if (shapeId) {
          circle.set("data", { shapeId: shapeId });
        }

        return shapeId;
      } catch (error) {
        console.error("Failed to create circle:", error);
        if (fabricCanvasRef.current) {
          fabricCanvasRef.current.remove(circle);
        }
        return null;
      }
    },
    [userId, createShapeInConvex, deleteShapeInConvex],
  );

  // Finalize ellipse creation
  const finalizeEllipse = useCallback(
    async (ellipse: Ellipse) => {
      // Only create if ellipse has meaningful size
      if ((ellipse.rx || 0) < 3 || (ellipse.ry || 0) < 3) {
        // Too small, remove it
        if (fabricCanvasRef.current) {
          fabricCanvasRef.current.remove(ellipse);
        }
        return null;
      }

      try {
        // Create shape data - store as width/height
        const shapeData = {
          type: "ellipse" as const,
          x: ellipse.left || 0,
          y: ellipse.top || 0,
          width: (ellipse.rx || 0) * 2,
          height: (ellipse.ry || 0) * 2,
          fillColor: DEFAULT_SHAPE.FILL_COLOR,
          createdBy: userId,
          createdAt: Date.now(),
          lastModified: Date.now(),
          lastModifiedBy: userId,
        };

        const command = new CreateShapeCommand(
          shapeData,
          createShapeInConvex,
          deleteShapeInConvex,
        );

        await historyRef.current.execute(command);

        // Get the shapeId from the command and store it to prevent duplication
        const shapeId = (command as any).shapeId;
        if (shapeId) {
          ellipse.set("data", { shapeId: shapeId });
        }

        return shapeId;
      } catch (error) {
        console.error("Failed to create ellipse:", error);
        if (fabricCanvasRef.current) {
          fabricCanvasRef.current.remove(ellipse);
        }
        return null;
      }
    },
    [userId, createShapeInConvex, deleteShapeInConvex],
  );

  // Finalize line creation
  const finalizeLine = useCallback(
    async (line: Line) => {
      // Only create if line has meaningful length
      const x1 = line.x1 || 0;
      const y1 = line.y1 || 0;
      const x2 = line.x2 || 0;
      const y2 = line.y2 || 0;
      const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

      if (length < 5) {
        // Too small, remove it
        if (fabricCanvasRef.current) {
          fabricCanvasRef.current.remove(line);
        }
        return null;
      }

      try {
        // Create shape data
        const shapeData = {
          type: "line" as const,
          x1,
          y1,
          x2,
          y2,
          fillColor: DEFAULT_SHAPE.FILL_COLOR, // Lines use this for stroke color
          createdBy: userId,
          createdAt: Date.now(),
          lastModified: Date.now(),
          lastModifiedBy: userId,
        };

        const command = new CreateShapeCommand(
          shapeData,
          createShapeInConvex,
          deleteShapeInConvex,
        );

        await historyRef.current.execute(command);

        // Get the shapeId from the command and store it to prevent duplication
        const shapeId = (command as any).shapeId;
        if (shapeId) {
          line.set("data", { shapeId: shapeId });
        }

        return shapeId;
      } catch (error) {
        console.error("Failed to create line:", error);
        if (fabricCanvasRef.current) {
          fabricCanvasRef.current.remove(line);
        }
        return null;
      }
    },
    [userId, createShapeInConvex, deleteShapeInConvex],
  );

  // Finalize text creation
  const finalizeText = useCallback(
    async (text: IText) => {
      // Don't create if text is empty or just the placeholder
      const textContent = text.text || "";
      if (!textContent || textContent === DEFAULT_TEXT.TEXT) {
        if (fabricCanvasRef.current) {
          fabricCanvasRef.current.remove(text);
        }
        return null;
      }

      try {
        // Create shape data
        const shapeData = {
          type: "text" as const,
          x: text.left || 0,
          y: text.top || 0,
          width: text.width || 100,
          height: text.height || 40,
          text: textContent,
          fontSize: text.fontSize || DEFAULT_TEXT.FONT_SIZE,
          fontFamily: text.fontFamily || DEFAULT_TEXT.FONT_FAMILY,
          fillColor: (text.fill as string) || DEFAULT_TEXT.FILL_COLOR,
          createdBy: userId,
          createdAt: Date.now(),
          lastModified: Date.now(),
          lastModifiedBy: userId,
        };

        const command = new CreateShapeCommand(
          shapeData,
          createShapeInConvex,
          deleteShapeInConvex,
        );

        await historyRef.current.execute(command);

        // Get the shapeId from the command and store it to prevent duplication
        const shapeId = (command as any).shapeId;
        if (shapeId) {
          text.set("data", { shapeId: shapeId });
        }

        return shapeId;
      } catch (error) {
        console.error("Failed to create text:", error);
        if (fabricCanvasRef.current) {
          fabricCanvasRef.current.remove(text);
        }
        return null;
      }
    },
    [userId, createShapeInConvex, deleteShapeInConvex],
  );

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
    if (!activeObject) return;

    // Check if it's a multi-select (ActiveSelection)
    if (activeObject.type === "activeSelection") {
      // Get all selected objects
      const objects = (activeObject as any)._objects || [];

      // Delete each selected shape
      for (const obj of objects) {
        const data = obj.get("data") as { shapeId?: string } | undefined;
        if (data?.shapeId) {
          const shapeToDelete = shapesRef.current.find(
            (s) => s._id === data.shapeId,
          );
          if (shapeToDelete) {
            const command = new DeleteShapeCommand(
              shapeToDelete,
              createShapeInConvex,
              deleteShapeInConvex,
            );
            await historyRef.current.execute(command);
          }
        }
      }
    } else {
      // Single shape deletion
      const data = activeObject.get("data") as { shapeId?: string } | undefined;
      if (data?.shapeId) {
        const shapeToDelete = shapesRef.current.find(
          (s) => s._id === data.shapeId,
        );
        if (shapeToDelete) {
          const command = new DeleteShapeCommand(
            shapeToDelete,
            createShapeInConvex,
            deleteShapeInConvex,
          );
          await historyRef.current.execute(command);
        }
      }
    }
  }, [createShapeInConvex, deleteShapeInConvex]);

  // Handle duplication of selected shape(s) (Cmd+D) - supports all shape types and multi-select
  const handleDuplicateSelected = useCallback(async () => {
    const activeObject = fabricCanvasRef.current?.getActiveObject();
    if (!activeObject) return;

    const shapesToDuplicate: typeof shapes = [];

    // Check if it's a multi-select (ActiveSelection)
    if (activeObject.type === "activeSelection") {
      const objects = (activeObject as any)._objects || [];
      for (const obj of objects) {
        const data = obj.get("data") as { shapeId?: string } | undefined;
        if (data?.shapeId) {
          const shape = shapesRef.current.find((s) => s._id === data.shapeId);
          if (shape) shapesToDuplicate.push(shape);
        }
      }
    } else {
      // Single shape
      const data = activeObject.get("data") as { shapeId?: string } | undefined;
      if (data?.shapeId) {
        const shape = shapesRef.current.find((s) => s._id === data.shapeId);
        if (shape) shapesToDuplicate.push(shape);
      }
    }

    // Duplicate each shape with offset
    for (const shapeToDuplicate of shapesToDuplicate) {
      let duplicateData: any = {
        type: shapeToDuplicate.type,
        createdBy: userId,
        createdAt: Date.now(),
        lastModified: Date.now(),
        lastModifiedBy: userId,
      };

      // Add type-specific properties
      switch (shapeToDuplicate.type) {
        case "rectangle":
          duplicateData = {
            ...duplicateData,
            x: shapeToDuplicate.x + 10,
            y: shapeToDuplicate.y + 10,
            width: shapeToDuplicate.width,
            height: shapeToDuplicate.height,
            angle: shapeToDuplicate.angle,
            fillColor: shapeToDuplicate.fillColor,
          };
          break;
        case "circle":
          duplicateData = {
            ...duplicateData,
            x: shapeToDuplicate.x + 10,
            y: shapeToDuplicate.y + 10,
            width: shapeToDuplicate.width,
            height: shapeToDuplicate.height,
            angle: shapeToDuplicate.angle,
            fillColor: shapeToDuplicate.fillColor,
          };
          break;
        case "ellipse":
          duplicateData = {
            ...duplicateData,
            x: shapeToDuplicate.x + 10,
            y: shapeToDuplicate.y + 10,
            width: shapeToDuplicate.width,
            height: shapeToDuplicate.height,
            angle: shapeToDuplicate.angle,
            fillColor: shapeToDuplicate.fillColor,
          };
          break;
        case "line":
          duplicateData = {
            ...duplicateData,
            x1: (shapeToDuplicate.x1 || 0) + 10,
            y1: (shapeToDuplicate.y1 || 0) + 10,
            x2: (shapeToDuplicate.x2 || 0) + 10,
            y2: (shapeToDuplicate.y2 || 0) + 10,
            strokeWidth: shapeToDuplicate.strokeWidth,
            strokeColor: shapeToDuplicate.strokeColor,
          };
          break;
        case "text":
          duplicateData = {
            ...duplicateData,
            x: shapeToDuplicate.x + 10,
            y: shapeToDuplicate.y + 10,
            text: shapeToDuplicate.text,
            fontSize: shapeToDuplicate.fontSize,
            fontFamily: shapeToDuplicate.fontFamily,
            fillColor: shapeToDuplicate.fillColor,
            angle: shapeToDuplicate.angle,
          };
          break;
      }

      // Use command pattern for undo/redo support
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

      // Circle creation mode - start drawing
      if (activeToolRef.current === "circle" && !opt.target) {
        isCreatingCircleRef.current = true;
        creatingStartPointRef.current = { x: pointer.x, y: pointer.y };

        const circle = new Circle({
          left: pointer.x,
          top: pointer.y,
          radius: 0,
          fill: DEFAULT_SHAPE.FILL_COLOR,
          strokeWidth: 2,
          stroke: SELECTION_COLORS.BORDER,
          selectable: false,
          evented: false,
          hasControls: true,
          cornerColor: SELECTION_COLORS.HANDLE,
          cornerStrokeColor: SELECTION_COLORS.HANDLE_BORDER,
          cornerSize: 10,
          transparentCorners: false,
          cornerStyle: "circle" as const,
          borderColor: SELECTION_COLORS.BORDER,
          borderScaleFactor: 2,
        });

        creatingCircleRef.current = circle;
        fabricCanvas.add(circle);
        fabricCanvas.renderAll();
        return;
      }

      // Ellipse creation mode - start drawing
      if (activeToolRef.current === "ellipse" && !opt.target) {
        isCreatingEllipseRef.current = true;
        creatingStartPointRef.current = { x: pointer.x, y: pointer.y };

        const ellipse = new Ellipse({
          left: pointer.x,
          top: pointer.y,
          rx: 0,
          ry: 0,
          fill: DEFAULT_SHAPE.FILL_COLOR,
          strokeWidth: 2,
          stroke: SELECTION_COLORS.BORDER,
          selectable: false,
          evented: false,
          hasControls: true,
          cornerColor: SELECTION_COLORS.HANDLE,
          cornerStrokeColor: SELECTION_COLORS.HANDLE_BORDER,
          cornerSize: 10,
          transparentCorners: false,
          cornerStyle: "circle" as const,
          borderColor: SELECTION_COLORS.BORDER,
          borderScaleFactor: 2,
        });

        creatingEllipseRef.current = ellipse;
        fabricCanvas.add(ellipse);
        fabricCanvas.renderAll();
        return;
      }

      // Line creation mode - start drawing
      if (activeToolRef.current === "line" && !opt.target) {
        isCreatingLineRef.current = true;
        creatingStartPointRef.current = { x: pointer.x, y: pointer.y };

        const line = new Line([pointer.x, pointer.y, pointer.x, pointer.y], {
          fill: undefined,
          stroke: DEFAULT_SHAPE.FILL_COLOR,
          strokeWidth: 2,
          selectable: false,
          evented: false,
          hasControls: true,
          cornerColor: SELECTION_COLORS.HANDLE,
          cornerStrokeColor: SELECTION_COLORS.HANDLE_BORDER,
          cornerSize: 10,
          transparentCorners: false,
          cornerStyle: "circle" as const,
          borderColor: SELECTION_COLORS.BORDER,
          borderScaleFactor: 2,
        });

        creatingLineRef.current = line;
        fabricCanvas.add(line);
        fabricCanvas.renderAll();
        return;
      }

      // Text creation mode - click to place
      if (activeToolRef.current === "text" && !opt.target) {
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

        fabricCanvas.add(text);
        fabricCanvas.setActiveObject(text);

        // Enter edit mode immediately
        text.enterEditing();
        text.selectAll();

        isEditingTextRef.current = true;
        editingTextRef.current = text;

        fabricCanvas.renderAll();
        return;
      }

      // Double-click existing text to edit
      if (opt.target && opt.target.type === "i-text") {
        const text = opt.target as IText;
        text.enterEditing();
        text.selectAll();
        isEditingTextRef.current = true;
        editingTextRef.current = text;
        return;
      }

      // Select mode with panning and Alt+drag duplication
      if (activeToolRef.current === "select") {
        // Alt+drag duplication: Clone the shape and drag the duplicate
        if (e.altKey && opt.target) {
          console.log("[Alt+Drag] Alt key detected, starting duplication");
          const data = opt.target.get("data") as
            | { shapeId?: string }
            | undefined;
          if (data?.shapeId) {
            // Find the original shape data
            const originalShape = shapesRef.current.find(
              (s) => s._id === data.shapeId,
            );
            if (originalShape && originalShape.type === "rectangle") {
              // Only rectangles supported for now
              // Store original shape data for duplication on mouse up
              originalShapeDataRef.current = originalShape;
              isDuplicatingRef.current = true;
              console.log("[Alt+Drag] Duplication state set to true");

              // Clone the Fabric object visually
              const clonedRect = new Rect({
                left: opt.target.left,
                top: opt.target.top,
                width: opt.target.width,
                height: opt.target.height,
                angle: opt.target.angle,
                fill: originalShape.fillColor,
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
                data: { shapeId: "temp_duplicate" }, // Temporary ID
              });

              fabricCanvas.add(clonedRect);
              fabricCanvas.setActiveObject(clonedRect);
              fabricCanvas.requestRenderAll();
            }
          }
          return;
        }

        // If clicking on an object (not Alt), we're dragging a shape
        if (opt.target) {
          isDraggingShapeRef.current = true;
          return;
        }

        // Enable panning when clicking empty space (removed Alt requirement for pan)
        if (!opt.target) {
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

      // Handle circle creation dragging
      if (
        isCreatingCircleRef.current &&
        creatingCircleRef.current &&
        creatingStartPointRef.current
      ) {
        const startX = creatingStartPointRef.current.x;
        const startY = creatingStartPointRef.current.y;

        // Calculate radius (use max distance for locked aspect ratio)
        const dx = pointer.x - startX;
        const dy = pointer.y - startY;
        const radius = Math.sqrt(dx * dx + dy * dy) / 2;

        // Update circle position to center between start and current point
        creatingCircleRef.current.set({
          left: Math.min(startX, pointer.x),
          top: Math.min(startY, pointer.y),
          radius: radius,
        });

        fabricCanvas.renderAll();
        return;
      }

      // Handle ellipse creation dragging
      if (
        isCreatingEllipseRef.current &&
        creatingEllipseRef.current &&
        creatingStartPointRef.current
      ) {
        const startX = creatingStartPointRef.current.x;
        const startY = creatingStartPointRef.current.y;

        // Calculate radii (independent width/height)
        const width = Math.abs(pointer.x - startX);
        const height = Math.abs(pointer.y - startY);

        creatingEllipseRef.current.set({
          left: Math.min(startX, pointer.x),
          top: Math.min(startY, pointer.y),
          rx: width / 2,
          ry: height / 2,
        });

        fabricCanvas.renderAll();
        return;
      }

      // Handle line creation dragging
      if (
        isCreatingLineRef.current &&
        creatingLineRef.current &&
        creatingStartPointRef.current
      ) {
        // Update line endpoint
        creatingLineRef.current.set({
          x2: pointer.x,
          y2: pointer.y,
        });

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

      // Handle circle creation completion
      if (isCreatingCircleRef.current && creatingCircleRef.current) {
        const createdCircle = creatingCircleRef.current;

        // Check meaningful size
        if ((createdCircle.radius || 0) < 3) {
          fabricCanvas.remove(createdCircle);
          isCreatingCircleRef.current = false;
          creatingCircleRef.current = null;
          creatingStartPointRef.current = null;
          fabricCanvas.renderAll();
          return;
        }

        // Remove stroke and make it selectable
        createdCircle.set({
          stroke: undefined,
          strokeWidth: 0,
          selectable: true,
          evented: true,
        });

        fabricCanvas.selection = true;
        fabricCanvas.setActiveObject(createdCircle);
        fabricCanvas.renderAll();

        // Reset creation state
        isCreatingCircleRef.current = false;
        creatingCircleRef.current = null;
        creatingStartPointRef.current = null;

        // Finalize the circle
        finalizeCircle(createdCircle);

        return;
      }

      // Handle ellipse creation completion
      if (isCreatingEllipseRef.current && creatingEllipseRef.current) {
        const createdEllipse = creatingEllipseRef.current;

        // Check meaningful size
        if ((createdEllipse.rx || 0) < 3 || (createdEllipse.ry || 0) < 3) {
          fabricCanvas.remove(createdEllipse);
          isCreatingEllipseRef.current = false;
          creatingEllipseRef.current = null;
          creatingStartPointRef.current = null;
          fabricCanvas.renderAll();
          return;
        }

        // Remove stroke and make it selectable
        createdEllipse.set({
          stroke: undefined,
          strokeWidth: 0,
          selectable: true,
          evented: true,
        });

        fabricCanvas.selection = true;
        fabricCanvas.setActiveObject(createdEllipse);
        fabricCanvas.renderAll();

        // Reset creation state
        isCreatingEllipseRef.current = false;
        creatingEllipseRef.current = null;
        creatingStartPointRef.current = null;

        // Finalize the ellipse
        finalizeEllipse(createdEllipse);

        return;
      }

      // Handle line creation completion
      if (isCreatingLineRef.current && creatingLineRef.current) {
        const createdLine = creatingLineRef.current;

        // Check meaningful length
        const x1 = createdLine.x1 || 0;
        const y1 = createdLine.y1 || 0;
        const x2 = createdLine.x2 || 0;
        const y2 = createdLine.y2 || 0;
        const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

        if (length < 5) {
          fabricCanvas.remove(createdLine);
          isCreatingLineRef.current = false;
          creatingLineRef.current = null;
          creatingStartPointRef.current = null;
          fabricCanvas.renderAll();
          return;
        }

        // Make it selectable (keep stroke for lines)
        createdLine.set({
          selectable: true,
          evented: true,
        });

        fabricCanvas.selection = true;
        fabricCanvas.setActiveObject(createdLine);
        fabricCanvas.renderAll();

        // Reset creation state
        isCreatingLineRef.current = false;
        creatingLineRef.current = null;
        creatingStartPointRef.current = null;

        // Finalize the line
        finalizeLine(createdLine);

        return;
      }

      // Handle Alt+drag duplication completion
      if (isDuplicatingRef.current && originalShapeDataRef.current) {
        console.log("[Alt+Drag] Completing duplication on mouse up");
        const activeObject = fabricCanvas.getActiveObject();
        if (activeObject && originalShapeDataRef.current.type === "rectangle") {
          const originalShape = originalShapeDataRef.current;

          // Create duplicate shape data at the new position (only rectangles for now)
          const duplicateData = {
            type: "rectangle" as const,
            x: activeObject.left || originalShape.x,
            y: activeObject.top || originalShape.y,
            width: activeObject.width || originalShape.width,
            height: activeObject.height || originalShape.height,
            angle: activeObject.angle || originalShape.angle,
            fillColor: originalShape.fillColor,
            createdBy: userId,
            createdAt: Date.now(),
            lastModified: Date.now(),
            lastModifiedBy: userId,
          };

          // Remove the temporary visual clone
          fabricCanvas.remove(activeObject);

          // Create the actual shape via command pattern
          const command = new CreateShapeCommand(
            duplicateData,
            createShapeInConvex,
            deleteShapeInConvex,
          );
          historyRef.current.execute(command);
        }

        // Reset duplication state
        isDuplicatingRef.current = false;
        originalShapeDataRef.current = null;
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

    fabricCanvas.on("object:scaling", (opt) => {
      if (!opt.target) return;

      // Handle ActiveSelection (multi-select)
      if (opt.target.type === "activeSelection") {
        const objects = (opt.target as any)._objects || [];
        for (const obj of objects) {
          const data = obj.get("data") as { shapeId?: string } | undefined;
          if (data?.shapeId && !objectStateBeforeModify.has(data.shapeId)) {
            const shape = shapes.find((s) => s._id === data.shapeId);
            if (shape) {
              const shapeData: any = {
                angle: shape.angle || 0,
              };

              // Add type-specific properties
              if (shape.type === "line") {
                shapeData.x = shape.x1;
                shapeData.y = shape.y1;
                shapeData.width = 0;
                shapeData.height = 0;
              } else {
                shapeData.x = (shape as any).x || 0;
                shapeData.y = (shape as any).y || 0;
                shapeData.width = (shape as any).width || 0;
                shapeData.height = (shape as any).height || 0;
              }

              objectStateBeforeModify.set(data.shapeId, shapeData);
            }
          }
        }
        return;
      }

      // Handle single object
      const data = opt.target.get("data") as { shapeId?: string } | undefined;
      if (data?.shapeId && !objectStateBeforeModify.has(data.shapeId)) {
        // Store original state
        const shape = shapes.find((s) => s._id === data.shapeId);
        if (shape) {
          const shapeData: any = {
            angle: shape.angle || 0,
          };

          // Add type-specific properties
          if (shape.type === "line") {
            shapeData.x = shape.x1;
            shapeData.y = shape.y1;
            shapeData.width = 0;
            shapeData.height = 0;
          } else {
            shapeData.x = (shape as any).x || 0;
            shapeData.y = (shape as any).y || 0;
            shapeData.width = (shape as any).width || 0;
            shapeData.height = (shape as any).height || 0;
          }

          objectStateBeforeModify.set(data.shapeId, shapeData);
        }
      }
    });

    fabricCanvas.on("object:rotating", (opt) => {
      if (!opt.target) return;

      // Handle ActiveSelection (multi-select)
      if (opt.target.type === "activeSelection") {
        const objects = (opt.target as any)._objects || [];
        for (const obj of objects) {
          const data = obj.get("data") as { shapeId?: string } | undefined;
          if (data?.shapeId && !objectStateBeforeModify.has(data.shapeId)) {
            const shape = shapes.find((s) => s._id === data.shapeId);
            if (shape) {
              const shapeData: any = {
                angle: shape.angle || 0,
              };

              // Add type-specific properties
              if (shape.type === "line") {
                shapeData.x = shape.x1;
                shapeData.y = shape.y1;
                shapeData.width = 0;
                shapeData.height = 0;
              } else {
                shapeData.x = (shape as any).x || 0;
                shapeData.y = (shape as any).y || 0;
                shapeData.width = (shape as any).width || 0;
                shapeData.height = (shape as any).height || 0;
              }

              objectStateBeforeModify.set(data.shapeId, shapeData);
            }
          }
        }
        return;
      }

      // Handle single object
      const data = opt.target.get("data") as { shapeId?: string } | undefined;
      if (data?.shapeId && !objectStateBeforeModify.has(data.shapeId)) {
        const shape = shapes.find((s) => s._id === data.shapeId);
        if (shape) {
          const shapeData: any = {
            angle: shape.angle || 0,
          };

          // Add type-specific properties
          if (shape.type === "line") {
            shapeData.x = shape.x1;
            shapeData.y = shape.y1;
            shapeData.width = 0;
            shapeData.height = 0;
          } else {
            shapeData.x = (shape as any).x || 0;
            shapeData.y = (shape as any).y || 0;
            shapeData.width = (shape as any).width || 0;
            shapeData.height = (shape as any).height || 0;
          }

          objectStateBeforeModify.set(data.shapeId, shapeData);
        }
      }
    });

    // Handle object modifications (resize, rotation, etc.) - sync to Convex
    fabricCanvas.on("object:modified", async (opt) => {
      if (!opt.target) return;

      // Handle ActiveSelection (multi-select) - DO NOT save during group modification
      // Fabric.js mutates object coordinates to be relative during grouping
      // Instead, we'll handle this in the selection:cleared event
      if (opt.target.type === "activeSelection") {
        // Store the selection for later processing when cleared
        const selection = opt.target as any;
        const objects = selection._objects || [];

        // Mark all objects in selection to prevent position updates from Convex
        objects.forEach((obj: any) => {
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

    // Handle text editing events - throttled to 200ms
    fabricCanvas.on("text:changed", (opt) => {
      if (!opt.target || opt.target.type !== "i-text") return;

      const text = opt.target as IText;
      const data = text.get("data") as { shapeId?: string } | undefined;
      const shapeId = data?.shapeId;

      if (!shapeId) return;

      // Throttle text updates to 200ms to prevent mutation spam
      if (textUpdateTimerRef.current) {
        clearTimeout(textUpdateTimerRef.current);
      }

      textUpdateTimerRef.current = setTimeout(async () => {
        try {
          await updateShapeInConvex(shapeId, {
            text: text.text || "",
            width: text.width || 100,
            height: text.height || 40,
          });
        } catch (error) {
          console.error("Failed to update text:", error);
        }
      }, 200);
    });

    // Handle text editing exit
    fabricCanvas.on("text:editing:exited", async (opt) => {
      if (!opt.target || opt.target.type !== "i-text") return;

      const text = opt.target as IText;
      const data = text.get("data") as { shapeId?: string } | undefined;

      // If text has no shapeId, it's a new text that needs to be finalized
      if (!data?.shapeId) {
        await finalizeText(text);
      }

      isEditingTextRef.current = false;
      editingTextRef.current = null;
    });

    // Handle object selection
    fabricCanvas.on("selection:created", () => {
      // Optional: Add any selection-specific logic here
    });

    fabricCanvas.on("selection:cleared", (e) => {
      // When selection is cleared, save the absolute positions of previously selected objects
      // This handles the case where ActiveSelection modified object coordinates
      const deselected = (e as any).deselected || [];

      deselected.forEach(async (obj: any) => {
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
      fabricCanvasRef.current.selection = isSelectMode;

      // Update cursor based on tool
      if (
        activeTool === "rectangle" ||
        activeTool === "circle" ||
        activeTool === "ellipse" ||
        activeTool === "line"
      ) {
        fabricCanvasRef.current.defaultCursor = "crosshair";
        fabricCanvasRef.current.hoverCursor = "crosshair";
      } else if (activeTool === "text") {
        fabricCanvasRef.current.defaultCursor = "text";
        fabricCanvasRef.current.hoverCursor = "text";
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

        // Check if this object is the active object OR part of an active selection
        const isActiveObject = activeObject === fabricObj;
        const isInActiveSelection =
          activeObject?.type === "activeSelection" &&
          (activeObject as any)._objects?.includes(fabricObj);

        if (isActiveObject || isInActiveSelection) {
          // Don't apply remote updates to objects you're currently manipulating
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
              : activeTool === "text"
                ? "✍️ Click to place text"
                : "✌️ Pinch to zoom • Pan with scroll"}
          </div>
        </div>
      )}
    </div>
  );
}

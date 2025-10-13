"use client";

/**
 * Main Canvas component using Fabric.js
 * Handles pan/zoom functionality and canvas initialization
 */

import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas } from "fabric";
import { CANVAS, ZOOM } from "@/constants/shapes";
import { calculateZoomFromWheel } from "@/lib/viewport-utils";
import { zoomToPoint } from "@/lib/canvas-utils";

interface CanvasProps {
  onCanvasReady?: (canvas: FabricCanvas) => void;
}

export function Canvas({ onCanvasReady }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<FabricCanvas | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Track panning state
  const isPanningRef = useRef(false);
  const lastPosXRef = useRef(0);
  const lastPosYRef = useRef(0);

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

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    // Create Fabric canvas instance
    const fabricCanvas = new FabricCanvas(canvasRef.current, {
      width: dimensions.width,
      height: dimensions.height,
      backgroundColor: CANVAS.BACKGROUND_COLOR,
      selection: true, // Enable selection (will be controlled by tool mode later)
      renderOnAddRemove: true,
    });

    fabricCanvasRef.current = fabricCanvas;

    // Setup mouse wheel zoom
    fabricCanvas.on("mouse:wheel", (opt) => {
      const e = opt.e as WheelEvent;
      e.preventDefault();
      e.stopPropagation();

      const delta = e.deltaY;
      const currentZoom = fabricCanvas.getZoom();
      const newZoom = calculateZoomFromWheel(currentZoom, delta);

      // Zoom toward mouse cursor position
      const point = {
        x: e.offsetX,
        y: e.offsetY,
      };

      zoomToPoint(fabricCanvas, point, newZoom);
    });

    // Setup panning with mouse drag (when not clicking on objects)
    fabricCanvas.on("mouse:down", (opt) => {
      const e = opt.e as MouseEvent;

      // Enable panning with Alt key or when clicking empty space
      if (e.altKey || !opt.target) {
        isPanningRef.current = true;
        fabricCanvas.selection = false; // Disable selection during pan
        lastPosXRef.current = e.clientX;
        lastPosYRef.current = e.clientY;
        fabricCanvas.setCursor("grabbing");
      }
    });

    fabricCanvas.on("mouse:move", (opt) => {
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
      if (isPanningRef.current) {
        const vpt = fabricCanvas.viewportTransform;
        if (vpt) {
          fabricCanvas.setViewportTransform(vpt);
        }
        isPanningRef.current = false;
        fabricCanvas.selection = true; // Re-enable selection
        fabricCanvas.setCursor("default");
      }
    });

    // Notify parent component that canvas is ready
    // Use optional chaining and call it only once
    onCanvasReady?.(fabricCanvas);

    // Cleanup
    return () => {
      fabricCanvas.dispose();
      fabricCanvasRef.current = null;
    };
    // Only re-run when dimensions change, not when onCanvasReady changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dimensions.width, dimensions.height]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <canvas ref={canvasRef} />

      {/* Canvas info overlay (for development) */}
      <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white text-xs px-3 py-2 rounded pointer-events-none">
        <div>
          Canvas: {dimensions.width}x{dimensions.height}
        </div>
        <div>
          Virtual: {CANVAS.VIRTUAL_WIDTH}x{CANVAS.VIRTUAL_HEIGHT}
        </div>
        <div className="mt-1 text-gray-300">
          Alt+Drag to pan • Scroll to zoom
        </div>
      </div>
    </div>
  );
}

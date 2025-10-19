"use client";

import { useEffect, useRef } from "react";
import { Canvas as FabricCanvas, PencilBrush } from "fabric";

export default function TemporaryTestPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Create a simple Fabric canvas with SAME config as main app
    const canvas = new FabricCanvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: "#f9fafb",
      selection: false,
      renderOnAddRemove: true,
      // Selection config from main app
      selectionColor: "rgba(59, 130, 246, 0.1)",
      selectionBorderColor: "#3b82f6",
      selectionLineWidth: 2,
      selectionDashArray: [5, 5],
    });

    // Enable drawing mode with pencil brush
    canvas.isDrawingMode = true;
    const brush = new PencilBrush(canvas);
    brush.color = "#3b82f6"; // Blue color to match our app
    brush.width = 2;
    canvas.freeDrawingBrush = brush;

    // Log when path is created
    canvas.on("path:created", (e: any) => {
      const path = e.path;
      console.log("[FABRIC TEST] Path created:", {
        fill: path.fill,
        stroke: path.stroke,
        strokeWidth: path.strokeWidth,
        type: path.type,
      });
    });

    console.log("[FABRIC TEST] Canvas initialized");
    console.log(
      "[FABRIC TEST] contextTop.fillStyle:",
      canvas.contextTop?.fillStyle,
    );

    // Cleanup
    return () => {
      canvas.dispose();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Raw Fabric.js Pencil Test</h1>
        <p className="mb-4 text-gray-700">
          This is a minimal Fabric.js canvas with ONLY the pencil tool. No
          Convex, no custom logic, no syncing. Draw a "V" shape and see if
          there's a fill flash.
        </p>
        <div className="bg-white p-4 rounded-lg shadow-lg">
          <canvas ref={canvasRef} className="border border-gray-300" />
        </div>
        <div className="mt-4 p-4 bg-blue-50 rounded">
          <p className="font-semibold">Instructions:</p>
          <ol className="list-decimal ml-5 mt-2 space-y-1">
            <li>Draw a "V" shape</li>
            <li>Release the mouse</li>
            <li>Watch for any blue fill flash</li>
            <li>Check the console for path properties</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

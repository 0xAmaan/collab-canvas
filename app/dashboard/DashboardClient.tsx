"use client";

/**
 * Client-side dashboard component with Canvas
 */

import { useState, useCallback } from "react";
import type { Canvas as FabricCanvas } from "fabric";
import { Canvas } from "@/components/canvas/Canvas";
import { ZoomControls } from "@/components/toolbar/ZoomControls";

interface DashboardClientProps {
  userName: string;
}

export function DashboardClient({ userName }: DashboardClientProps) {
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);

  const handleCanvasReady = useCallback((canvas: FabricCanvas) => {
    setFabricCanvas(canvas);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <h1 className="text-2xl font-bold text-gray-900">Collab Canvas</h1>

          {/* Toolbar placeholder - tools will be added in PR #5 */}
          <div className="flex gap-2">
            <div className="px-4 py-2 bg-gray-100 rounded text-sm text-gray-500">
              Tools coming in PR #5...
            </div>
          </div>
        </div>

        {/* Right side - zoom controls and user info */}
        <div className="flex items-center gap-4">
          <ZoomControls canvas={fabricCanvas} />
          <span className="text-sm text-gray-600">Welcome, {userName}!</span>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 canvas-container relative">
        <Canvas onCanvasReady={handleCanvasReady} />
      </div>
    </div>
  );
}

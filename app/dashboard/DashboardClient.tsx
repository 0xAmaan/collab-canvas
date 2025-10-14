"use client";

/**
 * Client-side dashboard component with Canvas and Toolbar
 */

import { useState, useCallback } from "react";
import type { Canvas as FabricCanvas } from "fabric";
import { Canvas } from "@/components/canvas/Canvas";
import { ZoomControls } from "@/components/toolbar/ZoomControls";
import { Toolbar, type Tool } from "@/components/toolbar/Toolbar";
import { useUser } from "@clerk/nextjs";
import { useKeyboard } from "@/hooks/useKeyboard";

interface DashboardClientProps {
  userName: string;
}

export function DashboardClient({ userName }: DashboardClientProps) {
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [activeTool, setActiveTool] = useState<Tool>("select");
  const [deleteHandler, setDeleteHandler] = useState<(() => void) | null>(null);
  const { user } = useUser();

  const handleCanvasReady = useCallback((canvas: FabricCanvas) => {
    setFabricCanvas(canvas);
  }, []);

  const handleToolChange = useCallback((tool: Tool) => {
    setActiveTool(tool);
  }, []);

  // Keyboard shortcuts
  useKeyboard({
    onEscape: () => {
      setActiveTool("select");
      // Clear any selections
      if (fabricCanvas) {
        fabricCanvas.discardActiveObject();
        fabricCanvas.requestRenderAll();
      }
    },
    onR: () => {
      setActiveTool("rectangle");
    },
    onDelete: () => {
      deleteHandler?.();
    },
    onBackspace: () => {
      deleteHandler?.();
    },
  });

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <h1 className="text-2xl font-bold text-gray-900">Collab Canvas</h1>

          {/* Toolbar with shape tools */}
          <Toolbar activeTool={activeTool} onToolChange={handleToolChange} />
        </div>

        {/* Right side - zoom controls and user info */}
        <div className="flex items-center gap-4">
          <ZoomControls canvas={fabricCanvas} />
          <span className="text-sm text-gray-600">Welcome, {userName}!</span>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 canvas-container relative">
        <Canvas
          onCanvasReady={handleCanvasReady}
          activeTool={activeTool}
          userId={user?.id}
          userName={userName}
          onDeleteSelected={(handler) => setDeleteHandler(() => handler)}
        />
      </div>
    </div>
  );
}

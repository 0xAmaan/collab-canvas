"use client";

/**
 * Client-side dashboard component with Canvas and Toolbar
 */

import { useState, useCallback } from "react";
import type { Canvas as FabricCanvas } from "fabric";
import { Canvas } from "@/components/canvas/Canvas";
import { ZoomControls } from "@/components/toolbar/ZoomControls";
import { Toolbar, type Tool } from "@/components/toolbar/Toolbar";
import { PresencePanel } from "@/components/presence/PresencePanel";
import { KeyboardShortcutsHelp } from "@/components/ui/KeyboardShortcutsHelp";
import { useUser } from "@clerk/nextjs";
import { useKeyboard } from "@/hooks/useKeyboard";
import { usePresence } from "@/hooks/usePresence";
import { getUserColor } from "@/lib/color-utils";

interface DashboardClientProps {
  userName: string;
}

export function DashboardClient({ userName }: DashboardClientProps) {
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [activeTool, setActiveTool] = useState<Tool>("select");
  const [deleteHandler, setDeleteHandler] = useState<(() => void) | null>(null);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const { user } = useUser();

  // User info and color
  const userId = user?.id || "anonymous";
  const userColor = getUserColor(userId);
  const isAuthenticated = !!user?.id && user.id !== "anonymous";

  // Presence for showing active users
  const { allUsers } = usePresence({
    userId,
    userName,
    userColor,
    enabled: isAuthenticated,
  });

  const handleCanvasReady = useCallback((canvas: FabricCanvas) => {
    setFabricCanvas(canvas);
  }, []);

  const handleToolChange = useCallback((tool: Tool) => {
    setActiveTool(tool);
  }, []);

  // Keyboard shortcuts
  useKeyboard({
    onSelectTool: () => {
      setActiveTool("select");
      // Clear any selections
      if (fabricCanvas) {
        fabricCanvas.discardActiveObject();
        fabricCanvas.requestRenderAll();
      }
    },
    onRectangleTool: () => {
      setActiveTool("rectangle");
    },
    onDeleteShape: () => {
      deleteHandler?.();
    },
    onShowHelp: () => {
      setShowKeyboardHelp((prev) => !prev);
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

        {/* Right side - presence panel, zoom controls and user info */}
        <div className="flex items-center gap-4">
          <PresencePanel
            activeUsers={allUsers}
            currentUserId={userId}
            maxVisible={8}
          />
          <ZoomControls canvas={fabricCanvas} />
          <span className="text-sm text-gray-600">Welcome, {userName}!</span>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 canvas-container relative">
        <Canvas
          onCanvasReady={handleCanvasReady}
          activeTool={activeTool}
          userId={userId}
          userName={userName}
          onDeleteSelected={(handler) => setDeleteHandler(() => handler)}
        />
      </div>

      {/* Keyboard Shortcuts Help Modal */}
      <KeyboardShortcutsHelp
        isOpen={showKeyboardHelp}
        onClose={() => setShowKeyboardHelp(false)}
      />
    </div>
  );
}

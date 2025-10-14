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
import { useUser, UserButton } from "@clerk/nextjs";
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

  // Memoized callback for canvas ready - prevents unnecessary re-renders
  const handleCanvasReady = useCallback((canvas: FabricCanvas) => {
    setFabricCanvas(canvas);
  }, []);

  // Memoized callback for tool changes
  const handleToolChange = useCallback((tool: Tool) => {
    setActiveTool(tool);
  }, []);

  // Memoized callback for delete handler registration
  const handleDeleteSelected = useCallback(() => {
    deleteHandler?.();
  }, [deleteHandler]);

  // Memoized callback to avoid recreating this on every render
  const registerDeleteHandler = useCallback((handler: () => void) => {
    setDeleteHandler(() => handler);
  }, []);

  // Memoized keyboard shortcut handlers to prevent unnecessary re-creations
  const handleSelectTool = useCallback(() => {
    setActiveTool("select");
    // Clear any selections
    if (fabricCanvas) {
      fabricCanvas.discardActiveObject();
      fabricCanvas.requestRenderAll();
    }
  }, [fabricCanvas]);

  const handleRectangleTool = useCallback(() => {
    setActiveTool("rectangle");
  }, []);

  const handleToggleHelp = useCallback(() => {
    setShowKeyboardHelp((prev) => !prev);
  }, []);

  // Keyboard shortcuts with memoized handlers
  useKeyboard({
    onSelectTool: handleSelectTool,
    onRectangleTool: handleRectangleTool,
    onDeleteShape: handleDeleteSelected,
    onShowHelp: handleToggleHelp,
  });

  return (
    <div className="h-screen relative overflow-hidden bg-slate-950">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900"></div>

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      ></div>

      {/* Floating Toolbar - Top Center */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20">
        <Toolbar activeTool={activeTool} onToolChange={handleToolChange} />
      </div>

      {/* Unified Floating Controls - Top Right */}
      <div className="absolute top-6 right-6 z-20 flex items-center gap-0 bg-slate-800/50 backdrop-blur-xl rounded-xl border border-white/10 shadow-xl">
        {/* Presence Section */}
        <div className="px-3 py-2">
          <PresencePanel
            activeUsers={allUsers}
            currentUserId={userId}
            maxVisible={8}
          />
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-white/10" />

        {/* Zoom Section */}
        <div className="px-2 py-2">
          <ZoomControls canvas={fabricCanvas} />
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-white/10" />

        {/* User + Clerk Section */}
        <div className="flex items-center gap-2 px-3 py-2 cursor-pointer">
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: "ring-2 ring-green-500",
              },
            }}
          />
          <span className="text-sm text-white/70 font-medium">{userName}</span>
        </div>
      </div>

      {/* Canvas Area - Full Screen */}
      <div className="relative h-full w-full canvas-container">
        <Canvas
          onCanvasReady={handleCanvasReady}
          activeTool={activeTool}
          userId={userId}
          userName={userName}
          onDeleteSelected={registerDeleteHandler}
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

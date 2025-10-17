"use client";

/**
 * Client-side dashboard component with Canvas and Toolbar
 */

import { useState, useCallback, useRef, useEffect } from "react";
import type { Canvas as FabricCanvas } from "fabric";
import { Canvas } from "@/components/canvas/Canvas";
import { ZoomControls } from "@/components/toolbar/ZoomControls";
import { Toolbar, type Tool } from "@/components/toolbar/Toolbar";
import { PresencePanel } from "@/components/presence/PresencePanel";
import { KeyboardShortcutsHelp } from "@/components/ui/KeyboardShortcutsHelp";
import { MultiplayerCursor } from "@/components/canvas/MultiplayerCursor";
import { useUser, UserButton } from "@clerk/nextjs";
import { useKeyboard } from "@/hooks/useKeyboard";
import { usePresence } from "@/hooks/usePresence";
import { useConnectionStatus } from "@/hooks/useConnectionStatus";
import { useShapes } from "@/hooks/useShapes";
import { useHistory } from "@/hooks/useHistory";
import { useClipboard } from "@/hooks/useClipboard";
import { getUserColor } from "@/lib/color-utils";
import { CreateShapeCommand } from "@/lib/commands/CreateShapeCommand";
import { AIInput } from "@/components/ai/AIInput";
import { AIFeedback } from "@/components/ai/AIFeedback";
import { executeAICommands } from "@/lib/ai/client-executor";
import type {
  AIStatus,
  AICommandRequest,
  AICommandResponse,
} from "@/lib/ai/types";

interface DashboardClientProps {
  userName: string;
}

export function DashboardClient({ userName }: DashboardClientProps) {
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [activeTool, setActiveTool] = useState<Tool>("select");
  const [deleteHandler, setDeleteHandler] = useState<(() => void) | null>(null);
  const [duplicateHandler, setDuplicateHandler] = useState<(() => void) | null>(
    null,
  );
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [zoom, setZoom] = useState<number>(1);
  const [selectedShapeIds, setSelectedShapeIds] = useState<string[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const userButtonRef = useRef<HTMLDivElement>(null);
  const cursorContainerRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();

  // AI command state
  const [aiStatus, setAIStatus] = useState<AIStatus>("idle");
  const [aiMessage, setAIMessage] = useState<string>("");

  // History for undo/redo
  const history = useHistory();

  // Clipboard for copy/paste
  const clipboard = useClipboard();

  // Connection status
  const { status, color } = useConnectionStatus();

  // Set mounted state to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Shapes management
  const { shapes, updateShape, createShape, deleteShape } = useShapes();

  // User info and color
  const userId = user?.id || "anonymous";
  const userColor = getUserColor(userId);
  const isAuthenticated = !!user?.id && user.id !== "anonymous";

  // Presence for showing active users and cursor tracking
  const { allUsers, otherUsers, updateCursorPosition, isReady } = usePresence({
    userId,
    userName,
    userColor,
    enabled: isAuthenticated,
  });

  // Wrap updateCursorPosition to only call when ready and authenticated
  const safeUpdateCursorPosition = useCallback(
    (x: number, y: number) => {
      if (!isAuthenticated) {
        console.log(
          "[DashboardClient] Cursor update blocked - not authenticated. userId:",
          userId,
        );
        return;
      }
      if (!isReady) {
        console.log(
          "[DashboardClient] Cursor update blocked - not ready. userId:",
          userId,
          "isReady:",
          isReady,
        );
        return;
      }
      // console.log(
      //   "[DashboardClient] Passing cursor update through. userId:",
      //   userId,
      //   "isReady:",
      //   isReady,
      // );
      updateCursorPosition(x, y);
    },
    [isAuthenticated, isReady, updateCursorPosition, userId],
  );

  // Memoized callback for canvas ready - prevents unnecessary re-renders
  const handleCanvasReady = useCallback((canvas: FabricCanvas) => {
    setFabricCanvas(canvas);

    // Track selection changes - support multi-select
    canvas.on("selection:created", (e) => {
      const selectedObjects = e.selected || [];
      const shapeIds = selectedObjects
        .map((obj) => {
          const data = obj.get("data") as { shapeId?: string } | undefined;
          return data?.shapeId;
        })
        .filter((id): id is string => !!id);
      setSelectedShapeIds(shapeIds);
    });

    canvas.on("selection:updated", (e) => {
      const selectedObjects = e.selected || [];
      const shapeIds = selectedObjects
        .map((obj) => {
          const data = obj.get("data") as { shapeId?: string } | undefined;
          return data?.shapeId;
        })
        .filter((id): id is string => !!id);
      setSelectedShapeIds(shapeIds);
    });

    canvas.on("selection:cleared", () => {
      setSelectedShapeIds([]);
    });
  }, []);

  // Sync viewport transform from canvas to cursor container using direct DOM manipulation
  useEffect(() => {
    if (!fabricCanvas || !cursorContainerRef.current) return;

    const container = cursorContainerRef.current;
    let currentZoom = 1;

    const updateViewportTransform = () => {
      const vpt = fabricCanvas.viewportTransform;
      if (vpt) {
        // Apply transform directly to DOM (no React re-render)
        const transform = `matrix(${vpt[0]}, ${vpt[1]}, ${vpt[2]}, ${vpt[3]}, ${vpt[4]}, ${vpt[5]})`;
        container.style.transform = transform;

        // Update zoom for cursors only when it changes
        const newZoom = vpt[0];
        if (newZoom !== currentZoom) {
          currentZoom = newZoom;
          setZoom(newZoom);
        }
      }
    };

    // Update immediately
    updateViewportTransform();

    // Update on every canvas render (zoom/pan)
    fabricCanvas.on("after:render", updateViewportTransform);

    return () => {
      fabricCanvas.off("after:render", updateViewportTransform);
    };
  }, [fabricCanvas]);

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

  // Memoized callback for duplicate handler registration
  const registerDuplicateHandler = useCallback((handler: () => void) => {
    setDuplicateHandler(() => handler);
  }, []);

  // Memoized callback for duplicate action
  const handleDuplicate = useCallback(() => {
    duplicateHandler?.();
  }, [duplicateHandler]);

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

  const handleCircleTool = useCallback(() => {
    setActiveTool("circle");
  }, []);

  const handleEllipseTool = useCallback(() => {
    setActiveTool("ellipse");
  }, []);

  const handleLineTool = useCallback(() => {
    setActiveTool("line");
  }, []);

  const handleTextTool = useCallback(() => {
    setActiveTool("text");
  }, []);

  // Handle copy selected shape(s) - supports multi-select
  const handleCopy = useCallback(() => {
    if (!fabricCanvas) return;

    const activeObject = fabricCanvas.getActiveObject();
    if (!activeObject) return;

    const shapesToCopy: typeof shapes = [];

    // Check if it's a multi-select (ActiveSelection)
    if (activeObject.type === "activeSelection") {
      const objects = (activeObject as any)._objects || [];
      for (const obj of objects) {
        const data = obj.get("data") as { shapeId?: string } | undefined;
        if (data?.shapeId) {
          const shape = shapes.find((s) => s._id === data.shapeId);
          if (shape) shapesToCopy.push(shape);
        }
      }
    } else {
      // Single shape selection
      const data = activeObject.get("data") as { shapeId?: string } | undefined;
      if (data?.shapeId) {
        const shape = shapes.find((s) => s._id === data.shapeId);
        if (shape) shapesToCopy.push(shape);
      }
    }

    if (shapesToCopy.length > 0) {
      clipboard.copy(shapesToCopy);
    }
  }, [fabricCanvas, shapes, clipboard]);

  // Handle paste
  const handlePaste = useCallback(async () => {
    const shapesToPaste = clipboard.getClipboard();
    if (shapesToPaste.length === 0) return;

    // Paste each shape with an offset (+10, +10)
    for (const shape of shapesToPaste) {
      let pastedShape: any;

      // Handle line shapes differently (they have x1, y1, x2, y2 instead of x, y)
      if (shape.type === "line") {
        pastedShape = {
          ...shape,
          x1: shape.x1 + 10,
          y1: shape.y1 + 10,
          x2: shape.x2 + 10,
          y2: shape.y2 + 10,
          createdBy: userId,
          createdAt: Date.now(),
          lastModified: Date.now(),
          lastModifiedBy: userId,
        };
      } else {
        pastedShape = {
          ...shape,
          x: ("x" in shape ? shape.x : 0) + 10,
          y: ("y" in shape ? shape.y : 0) + 10,
          createdBy: userId,
          createdAt: Date.now(),
          lastModified: Date.now(),
          lastModifiedBy: userId,
        };
      }

      // Remove the _id so a new one is generated
      const { _id, ...shapeWithoutId } = pastedShape;

      // Use command pattern for undo/redo support
      const command = new CreateShapeCommand(
        shapeWithoutId as any,
        createShape,
        deleteShape,
      );
      await history.execute(command);
    }
  }, [clipboard, userId, createShape, deleteShape, history]);

  const handleToggleHelp = useCallback(() => {
    setShowKeyboardHelp((prev) => !prev);
  }, []);

  // Handle AI command
  const handleAICommand = useCallback(
    async (command: string) => {
      setAIStatus("thinking");
      setAIMessage("");

      try {
        // Call AI API endpoint
        const request: AICommandRequest = {
          command,
          shapes,
        };

        const response = await fetch("/api/ai/canvas", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(request),
        });

        const data: AICommandResponse = await response.json();

        if (!data.success) {
          setAIStatus("error");
          setAIMessage(data.message);
          setTimeout(() => setAIStatus("idle"), 3000);
          return;
        }

        // Execute commands client-side
        const result = await executeAICommands(data.commands, {
          shapes,
          createShape,
          updateShape,
        });

        if (result.success) {
          setAIStatus("success");
          setAIMessage(data.message || result.message);
        } else {
          setAIStatus("error");
          setAIMessage(result.message);
        }
      } catch (error: any) {
        console.error("AI command error:", error);
        setAIStatus("error");
        setAIMessage("Failed to execute command");
      }

      // Reset after 3 seconds
      setTimeout(() => {
        setAIStatus("idle");
        setAIMessage("");
      }, 3000);
    },
    [shapes, createShape, updateShape],
  );

  // Handle color change for selected shape(s) - supports multi-select
  const handleColorChange = useCallback(
    async (color: string) => {
      if (selectedShapeIds.length === 0) return;

      try {
        // Update all selected shapes in Convex
        for (const shapeId of selectedShapeIds) {
          await updateShape(shapeId, { fill: color });
        }

        // Also update the Fabric.js objects immediately for instant feedback
        if (fabricCanvas) {
          const activeObject = fabricCanvas.getActiveObject();
          if (activeObject) {
            // Check if it's a multi-select (ActiveSelection)
            if (activeObject.type === "activeSelection") {
              const objects = (activeObject as any)._objects || [];
              for (const obj of objects) {
                obj.set("fill", color);
              }
            } else {
              // Single shape
              activeObject.set("fill", color);
            }
            fabricCanvas.requestRenderAll();
          }
        }
      } catch (error) {
        console.error("Failed to update shape color:", error);
      }
    },
    [selectedShapeIds, updateShape, fabricCanvas],
  );

  // Get selected shape for color picker (use first shape if multi-select)
  const selectedShape =
    selectedShapeIds.length > 0
      ? shapes.find((s) => s._id === selectedShapeIds[0])
      : null;

  // Keyboard shortcuts with memoized handlers
  useKeyboard({
    onSelectTool: handleSelectTool,
    onRectangleTool: handleRectangleTool,
    onCircleTool: handleCircleTool,
    onEllipseTool: handleEllipseTool,
    onLineTool: handleLineTool,
    onTextTool: handleTextTool,
    onDeleteShape: handleDeleteSelected,
    onShowHelp: handleToggleHelp,
    onUndo: history.undo,
    onRedo: history.redo,
    onDuplicate: handleDuplicate,
    onCopy: handleCopy,
    onPaste: handlePaste,
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
        <Toolbar
          activeTool={activeTool}
          onToolChange={handleToolChange}
          selectedShapeColor={selectedShape?.fillColor}
          onColorChange={handleColorChange}
        />
      </div>

      {/* Unified Floating Controls - Top Right */}
      <div className="absolute top-6 right-6 z-20 flex items-center gap-0 bg-slate-800/50 backdrop-blur-xl rounded-xl border border-white/10 shadow-xl">
        {/* Presence Section - only show if there are active users */}
        {allUsers.length > 0 && (
          <>
            <div className="px-3 py-2">
              <PresencePanel
                activeUsers={allUsers}
                currentUserId={userId}
                maxVisible={5}
              />
            </div>

            {/* Divider */}
            <div className="w-px h-8 bg-white/10" />
          </>
        )}

        {/* Zoom Section */}
        <div className="px-2 py-2">
          <ZoomControls canvas={fabricCanvas} />
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-white/10" />

        {/* Connection Status Section - only render on client to avoid hydration issues */}
        {isMounted && (
          <>
            <div className="flex items-center gap-2 px-3 py-2">
              <div
                className={`w-2 h-2 rounded-full ${color}`}
                title={`Connection: ${status}`}
              />
              <span className="text-xs text-white/50 capitalize">{status}</span>
            </div>

            {/* Divider */}
            <div className="w-px h-8 bg-white/10" />
          </>
        )}

        {/* User + Clerk Section */}
        <div
          className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-white/5 rounded-lg transition-colors"
          onClick={(e) => {
            // Only trigger UserButton if we didn't click directly on it
            // (the UserButton has its own click handler)
            if (
              e.target === e.currentTarget ||
              !(e.target as HTMLElement).closest("[data-clerk-user-button]")
            ) {
              const button = userButtonRef.current?.querySelector("button");
              button?.click();
            }
          }}
        >
          <div
            ref={userButtonRef}
            data-clerk-user-button
            className="flex items-center"
          >
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "ring-2 ring-green-500",
                },
              }}
            />
          </div>
          <span className="text-sm text-white/70 font-medium leading-none">
            Account
          </span>
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
          onDuplicateSelected={registerDuplicateHandler}
          updateCursorPosition={safeUpdateCursorPosition}
          history={history}
        />

        {/* Multiplayer cursors container - synced with canvas viewport transform */}
        <div
          ref={cursorContainerRef}
          className="absolute top-0 left-0 w-0 h-0 pointer-events-none z-50"
          style={{
            transformOrigin: "0 0",
          }}
        >
          {otherUsers.map((user) => (
            <MultiplayerCursor key={user.userId} user={user} zoom={zoom} />
          ))}
        </div>
      </div>

      {/* AI Input */}
      <AIInput onSubmit={handleAICommand} isLoading={aiStatus === "thinking"} />

      {/* AI Feedback */}
      <AIFeedback status={aiStatus} message={aiMessage} />

      {/* Keyboard Shortcuts Help Modal */}
      <KeyboardShortcutsHelp
        isOpen={showKeyboardHelp}
        onClose={() => setShowKeyboardHelp(false)}
      />
    </div>
  );
}

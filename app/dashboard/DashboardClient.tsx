"use client";

/**
 * Client-side dashboard component with Canvas and Toolbar
 */

import { useState, useCallback, useRef, useEffect } from "react";
import type { Canvas as FabricCanvas } from "fabric";
import { Canvas } from "@/components/canvas/Canvas";
import { BottomToolbar, type Tool } from "@/components/toolbar/BottomToolbar";
import { ZoomControls } from "@/components/toolbar/ZoomControls";
import { KeyboardShortcutsHelp } from "@/components/ui/KeyboardShortcutsHelp";
import { MultiplayerCursor } from "@/components/canvas/MultiplayerCursor";
import { PropertiesSidebar } from "@/components/properties/PropertiesSidebar";
import { PresencePanel } from "@/components/presence/PresencePanel";
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
import { AIChatSidebar, type ChatMessageType } from "@/components/ai";
import { PanelLeft } from "lucide-react";
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const cursorContainerRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();

  // AI command state
  const [aiStatus, setAIStatus] = useState<AIStatus>("idle");
  const [aiMessage, setAIMessage] = useState<string>("");

  // Chat sidebar state
  const [chatMessages, setChatMessages] = useState<ChatMessageType[]>([]);

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

  const handleToggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  // Handle AI command
  const handleAICommand = useCallback(
    async (command: string) => {
      // Add user message to chat
      const userMessageId = `user-${Date.now()}`;
      const userMessage: ChatMessageType = {
        id: userMessageId,
        type: "user",
        content: command,
        timestamp: Date.now(),
        status: "success",
      };
      setChatMessages((prev) => [...prev, userMessage]);

      // Add AI thinking message
      const aiMessageId = `ai-${Date.now()}`;
      const thinkingMessage: ChatMessageType = {
        id: aiMessageId,
        type: "ai",
        content: "Thinking...",
        timestamp: Date.now(),
        status: "sending",
      };
      setChatMessages((prev) => [...prev, thinkingMessage]);

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
          // Update AI message with error
          setChatMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMessageId
                ? { ...msg, content: data.message, status: "error" as const }
                : msg,
            ),
          );
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
          // Update AI message with success
          setChatMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMessageId
                ? {
                    ...msg,
                    content: data.message || result.message,
                    status: "success" as const,
                  }
                : msg,
            ),
          );
          setAIStatus("success");
          setAIMessage(data.message || result.message);
        } else {
          // Update AI message with error
          setChatMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMessageId
                ? { ...msg, content: result.message, status: "error" as const }
                : msg,
            ),
          );
          setAIStatus("error");
          setAIMessage(result.message);
        }
      } catch (error: any) {
        console.error("AI command error:", error);
        // Update AI message with error
        setChatMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMessageId
              ? {
                  ...msg,
                  content: "Failed to execute command",
                  status: "error" as const,
                }
              : msg,
          ),
        );
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
    onToggleSidebar: handleToggleSidebar,
  });

  return (
    <div className="h-screen flex overflow-hidden bg-slate-950">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 pointer-events-none"></div>

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      ></div>

      {/* Left Sidebar - AI Chat Panel */}
      <AIChatSidebar
        isOpen={isSidebarOpen}
        onToggle={handleToggleSidebar}
        messages={chatMessages}
        onSubmit={handleAICommand}
        isLoading={aiStatus === "thinking"}
      />

      {/* Sidebar Toggle Button - show when closed */}
      {!isSidebarOpen && (
        <button
          onClick={handleToggleSidebar}
          className="fixed left-4 top-6 z-30 p-2 bg-[#2C2C2C] hover:bg-[#3A3A3A] rounded-lg text-white shadow-xl transition-colors cursor-pointer border border-white/10"
          title="Open AI Chat (⌘+\)"
        >
          <PanelLeft className="w-5 h-5" />
        </button>
      )}

      {/* Main Canvas Area */}
      <div className="flex-1 relative">
        {/* Floating Toolbar - Bottom Center */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
          <BottomToolbar
            activeTool={activeTool}
            onToolChange={handleToolChange}
            selectedShapeColor={selectedShape?.fillColor}
            onColorChange={handleColorChange}
          />
        </div>

        {/* Canvas Container */}
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

        {/* AI Feedback Toast - temporary status notifications */}
        <AIFeedback status={aiStatus} message={aiMessage} />
      </div>

      {/* Right Sidebar - Properties Panel */}
      <PropertiesSidebar
        canvas={fabricCanvas}
        allUsers={allUsers}
        currentUserId={userId}
        status={status}
        statusColor={color}
        isMounted={isMounted}
        shapes={shapes}
        selectedShapeIds={selectedShapeIds}
        onUpdateShape={updateShape}
        onShowHelp={handleToggleHelp}
      />

      {/* Keyboard Shortcuts Help Modal */}
      <KeyboardShortcutsHelp
        isOpen={showKeyboardHelp}
        onClose={() => setShowKeyboardHelp(false)}
      />
    </div>
  );
}

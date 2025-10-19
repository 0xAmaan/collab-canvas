/**
 * Left Sidebar Component
 * Tabbed sidebar with AI Chat and Layers panels
 */

"use client";

import { PanelRight, Lightbulb, Layers } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Canvas as FabricCanvas } from "fabric";
import type { Shape } from "@/types/shapes";
import { ChatHistory, type ChatMessageType } from "@/components/ai/ChatHistory";
import { ChatInput } from "@/components/ai/ChatInput";
import { LayersPanel } from "@/components/layers/LayersPanel";

type SidebarTab = "ai" | "layers";

interface LeftSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  // AI Chat props
  messages: ChatMessageType[];
  onSubmit: (command: string) => void;
  isLoading: boolean;
  // Layers props
  shapes: Shape[];
  selectedShapeIds: string[];
  canvas: FabricCanvas | null;
  onReorderShapes: (updates: Array<{ id: string; zIndex: number }>) => void;
}

export const LeftSidebar = ({
  isOpen,
  onToggle,
  messages,
  onSubmit,
  isLoading,
  shapes,
  selectedShapeIds,
  canvas,
  onReorderShapes,
}: LeftSidebarProps) => {
  const [activeTab, setActiveTab] = useState<SidebarTab>("ai");
  const [isCollapseHovered, setIsCollapseHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevIsOpenRef = useRef(isOpen);

  // Autofocus input when sidebar is opened to AI tab (not on initial load)
  useEffect(() => {
    // Only focus if sidebar just opened (was closed, now open) and AI tab is active
    if (isOpen && !prevIsOpenRef.current && activeTab === "ai") {
      // Small delay to ensure transition completes
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 250); // Slightly longer than the 200ms transition

      return () => clearTimeout(timer);
    }

    // Update previous state
    prevIsOpenRef.current = isOpen;
  }, [isOpen, activeTab]);

  return (
    <div
      className="h-full bg-sidebar border-r border-white/10 flex flex-col transition-all duration-200 ease-in-out relative z-10 overflow-hidden"
      style={{
        width: isOpen ? "280px" : "0px",
        minWidth: isOpen ? "280px" : "0px",
        flexShrink: 0,
      }}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 flex-shrink-0">
        <h1 className="text-[14px] font-semibold text-white">CollabCanvas</h1>
        <div className="relative">
          <button
            onClick={onToggle}
            onMouseEnter={() => setIsCollapseHovered(true)}
            onMouseLeave={() => setIsCollapseHovered(false)}
            className="p-1 hover:bg-white/5 rounded transition-colors cursor-pointer"
          >
            <PanelRight className="w-4 h-4 text-[#888888]" />
          </button>

          {/* Custom Tooltip */}
          {isCollapseHovered && (
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-white text-xs rounded whitespace-nowrap z-50 pointer-events-none">
              Close sidebar
              <span className="ml-2 text-white/60">⌘+\</span>
            </div>
          )}
        </div>
      </div>

      {/* Tab Buttons */}
      <div className="flex border-b border-white/10 flex-shrink-0">
        <button
          onClick={() => setActiveTab("ai")}
          className={`
            flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium
            transition-colors relative cursor-pointer
            ${
              activeTab === "ai"
                ? "text-primary bg-white/5"
                : "text-white/60 hover:text-white/80 hover:bg-white/5"
            }
          `}
        >
          <Lightbulb className="w-4 h-4" />
          <span>AI Assistant</span>
          {activeTab === "ai" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("layers")}
          className={`
            flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium
            transition-colors relative cursor-pointer
            ${
              activeTab === "layers"
                ? "text-primary bg-white/5"
                : "text-white/60 hover:text-white/80 hover:bg-white/5"
            }
          `}
        >
          <Layers className="w-4 h-4" />
          <span>Layers</span>
          {activeTab === "layers" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "ai" && (
        <>
          {/* Chat History - scrollable area that fills remaining space */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <ChatHistory messages={messages} />
          </div>

          {/* Chat Input - sticky at bottom */}
          <div className="flex-shrink-0">
            <ChatInput
              ref={inputRef}
              onSubmit={onSubmit}
              isLoading={isLoading}
            />
          </div>
        </>
      )}

      {activeTab === "layers" && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Layers Panel - scrollable area */}
          <LayersPanel
            shapes={shapes}
            selectedShapeIds={selectedShapeIds}
            canvas={canvas}
            onReorderShapes={onReorderShapes}
          />
        </div>
      )}
    </div>
  );
};

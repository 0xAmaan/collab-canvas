/**
 * Left Sidebar Component
 * Tabbed sidebar with AI Chat and Layers panels
 * Now includes project header (back button, name, share)
 */

"use client";

import {
  PanelRight,
  Lightbulb,
  Layers,
  ArrowLeft,
  Share2,
  Globe,
  Lock,
  Check,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Canvas as FabricCanvas } from "fabric";
import type { Shape } from "@/types/shapes";
import { ChatHistory, type ChatMessageType } from "@/components/ai/ChatHistory";
import { ChatInput } from "@/components/ai/ChatInput";
import { LayersPanel } from "@/components/layers/LayersPanel";
import Link from "next/link";

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
  // Project header props
  projectName: string;
  isPublic: boolean;
  isOwner: boolean;
  onTogglePublic: () => void;
  onRenameProject: (newName: string) => void;
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
  projectName,
  isPublic,
  isOwner,
  onTogglePublic,
  onRenameProject,
}: LeftSidebarProps) => {
  const [activeTab, setActiveTab] = useState<SidebarTab>("ai");
  const [isCollapseHovered, setIsCollapseHovered] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(projectName);
  const inputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const prevIsOpenRef = useRef(isOpen);

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNameClick = () => {
    if (isOwner) {
      setIsEditingName(true);
      setEditedName(projectName);
    }
  };

  const handleNameSave = () => {
    if (editedName.trim() && editedName !== projectName) {
      onRenameProject(editedName.trim());
    }
    setIsEditingName(false);
  };

  const handleNameCancel = () => {
    setEditedName(projectName);
    setIsEditingName(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleNameSave();
    } else if (e.key === "Escape") {
      handleNameCancel();
    }
  };

  // Focus name input when entering edit mode
  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  // Update edited name when project name changes
  useEffect(() => {
    setEditedName(projectName);
  }, [projectName]);

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

      {/* Project Header Section - Horizontal Layout */}
      <div className="px-3 py-2 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-2">
          {/* Back to Projects Button */}
          <Link
            href="/projects"
            className="p-1.5 hover:bg-white/5 text-white/80 hover:text-white rounded transition-colors"
            title="Back to Projects"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          {/* Project Name - takes up remaining space, editable on click */}
          {isEditingName ? (
            <input
              ref={nameInputRef}
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onBlur={handleNameSave}
              onKeyDown={handleNameKeyDown}
              className="flex-1 px-2 py-1.5 bg-toolbar border border-primary text-white rounded text-sm min-w-0 font-semibold focus:outline-none"
              placeholder="Project name"
            />
          ) : (
            <div
              className="flex-1 px-2 py-1.5 text-white rounded text-sm min-w-0 cursor-pointer hover:bg-white/5 transition-colors"
              onClick={handleNameClick}
              title={isOwner ? "Click to rename" : projectName}
            >
              <span className="font-semibold truncate block">
                {projectName}
              </span>
            </div>
          )}

          {/* Share Button (only for owner) - shows current status */}
          {isOwner && (
            <div className="relative">
              <button
                onClick={() => setShowShareMenu(!showShareMenu)}
                className="p-1.5 hover:bg-white/5 text-white/80 hover:text-white rounded transition-colors cursor-pointer"
                title={
                  isPublic
                    ? "Public - Click to manage sharing"
                    : "Private - Click to manage sharing"
                }
              >
                {isPublic ? (
                  <Globe className="w-4 h-4 text-green-400" />
                ) : (
                  <Lock className="w-4 h-4 text-gray-400" />
                )}
              </button>

              {/* Share Menu */}
              {showShareMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowShareMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 w-64 bg-panel border border-white/10 rounded-lg shadow-xl z-20 overflow-hidden">
                    <div className="p-3 border-b border-white/10">
                      <p className="text-xs text-gray-400 mb-2">Visibility</p>
                      <button
                        onClick={() => {
                          onTogglePublic();
                          setShowShareMenu(false);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 bg-toolbar hover:bg-gray-700 text-white rounded-lg transition-colors text-sm cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          {isPublic ? (
                            <>
                              <Globe className="w-4 h-4 text-green-400" />
                              <span>Public</span>
                            </>
                          ) : (
                            <>
                              <Lock className="w-4 h-4 text-gray-400" />
                              <span>Private</span>
                            </>
                          )}
                        </div>
                        <span className="text-xs text-gray-400">
                          Click to toggle
                        </span>
                      </button>
                      <p className="text-xs text-gray-500 mt-2">
                        {isPublic
                          ? "Anyone with the link can view and edit"
                          : "Only you can access this project"}
                      </p>
                    </div>

                    {isPublic && (
                      <div className="p-3">
                        <p className="text-xs text-gray-400 mb-2">Share Link</p>
                        <button
                          onClick={handleCopyLink}
                          className="w-full flex items-center justify-between px-3 py-2 bg-toolbar hover:bg-gray-700 text-white rounded-lg transition-colors text-sm cursor-pointer"
                        >
                          <span className="truncate text-xs">
                            {typeof window !== "undefined"
                              ? window.location.href
                              : ""}
                          </span>
                          {copied ? (
                            <Check className="w-4 h-4 text-green-400 flex-shrink-0 ml-2" />
                          ) : (
                            <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                              Copy
                            </span>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Public Indicator (for non-owners) - icon only */}
          {!isOwner && isPublic && (
            <div
              className="p-1.5 text-green-400 rounded bg-green-400/10"
              title="Public Project"
            >
              <Globe className="w-4 h-4" />
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

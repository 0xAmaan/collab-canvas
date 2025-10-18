"use client";

/**
 * Properties Sidebar Component
 * Main right sidebar with account section and shape properties
 */

import { useState } from "react";
import type { Canvas as FabricCanvas } from "fabric";
import type { Presence } from "@/types/presence";
import type { Shape } from "@/types/shapes";
import { AccountSection } from "./AccountSection";
import { EmptyState } from "./EmptyState";
import { PositionPanel } from "./PositionPanel";
import { StylePanel } from "./StylePanel";
import { TransformPanel } from "./TransformPanel";

interface PropertiesSidebarProps {
  canvas: FabricCanvas | null;
  allUsers: Presence[];
  currentUserId: string;
  status: string;
  statusColor: string;
  isMounted: boolean;
  shapes: Shape[];
  selectedShapeIds: string[];
  onUpdateShape: (shapeId: string, updates: Partial<Shape>) => Promise<void>;
  onShowHelp: () => void;
}

export const PropertiesSidebar = ({
  canvas,
  allUsers,
  currentUserId,
  status,
  statusColor,
  isMounted,
  shapes,
  selectedShapeIds,
  onUpdateShape,
  onShowHelp,
}: PropertiesSidebarProps) => {
  const hasSelection = selectedShapeIds.length > 0;
  const [isShortcutsHovered, setIsShortcutsHovered] = useState(false);

  return (
    <div className="w-[300px] h-full bg-[var(--color-sidebar)] border-l border-white/8 flex flex-col relative z-10">
      {/* Account Section - Always Visible */}
      <div className="pt-4 px-4">
        <AccountSection
          canvas={canvas}
          allUsers={allUsers}
          currentUserId={currentUserId}
          status={status}
          statusColor={statusColor}
          isMounted={isMounted}
        />
      </div>

      {/* Properties Divider */}
      <div className="border-t border-white/10 mb-6" />

      {/* Properties Section - Conditional */}
      <div className="flex-1 overflow-y-auto px-4">
        {hasSelection ? (
          <div className="space-y-6 pb-6">
            <PositionPanel
              shapes={shapes}
              selectedShapeIds={selectedShapeIds}
              onUpdate={onUpdateShape}
            />
            <StylePanel
              shapes={shapes}
              selectedShapeIds={selectedShapeIds}
              onUpdate={onUpdateShape}
            />
            <TransformPanel
              shapes={shapes}
              selectedShapeIds={selectedShapeIds}
              onUpdate={onUpdateShape}
            />
          </div>
        ) : (
          <EmptyState />
        )}
      </div>

      {/* Help Button - Bottom Right */}
      <div className="p-4 border-t border-white/10">
        <div className="relative">
          <button
            onClick={onShowHelp}
            onMouseEnter={() => setIsShortcutsHovered(true)}
            onMouseLeave={() => setIsShortcutsHovered(false)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/70 hover:text-white transition-colors group cursor-pointer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM8.94 6.94a.75.75 0 11-1.061-1.061 3 3 0 112.871 5.026v.345a.75.75 0 01-1.5 0v-.5c0-.72.57-1.172 1.081-1.287A1.5 1.5 0 108.94 6.94zM10 15a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm font-medium">Shortcuts</span>
          </button>

          {/* Custom Tooltip */}
          {isShortcutsHovered && (
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-white text-xs rounded whitespace-nowrap z-50 pointer-events-none">
              Shortcuts
              <span className="ml-2 text-white/60">⌘+/</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

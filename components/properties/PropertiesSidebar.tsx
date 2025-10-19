"use client";

/**
 * Properties Sidebar Component
 * Main right sidebar with account section and shape properties
 */

import { useState } from "react";
import type { Canvas as FabricCanvas } from "fabric";
import type { Presence } from "@/types/presence";
import type { Shape } from "@/types/shapes";
import { Circle, Square, RectangleHorizontal, Triangle } from "lucide-react";
import { AccountSection } from "@/components/properties/AccountSection";
import { PositionPanel } from "@/components/properties/PositionPanel";
import { StylePanel } from "@/components/properties/StylePanel";
import { TransformPanel } from "@/components/properties/TransformPanel";
import { ExportPanel } from "@/components/properties/ExportPanel";

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
    <div className="w-[300px] h-full bg-[var(--color-sidebar)] border-l border-white/8 flex flex-col relative z-10 flex-shrink-0">
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

      {/* Properties Section - Conditional */}
      <div className="flex-1 overflow-y-auto px-4">
        {hasSelection ? (
          <div className="space-y-6 pb-6">
            <div className="border-t border-white/8 -mx-4 mb-6" />

            {/* Object Name Header */}
            {selectedShapeIds.length === 1 && (
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-xs font-medium text-white/50 uppercase tracking-wider">
                  Object Name
                </h3>
                <div className="text-sm font-semibold text-white">
                  {(() => {
                    const shape = shapes.find(
                      (s) => s._id === selectedShapeIds[0],
                    );
                    if (!shape) return "Unknown";

                    // Get shape index (1-based for user display)
                    const shapesByType = shapes.filter(
                      (s) => s.type === shape.type,
                    );
                    const index =
                      shapesByType.findIndex((s) => s._id === shape._id) + 1;

                    // Capitalize first letter
                    const typeName =
                      shape.type.charAt(0).toUpperCase() + shape.type.slice(1);

                    return `${typeName} ${index}`;
                  })()}
                </div>
              </div>
            )}

            {selectedShapeIds.length > 1 && (
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-xs font-medium text-white/50 uppercase tracking-wider">
                  Selection
                </h3>
                <div className="text-sm font-semibold text-white">
                  {selectedShapeIds.length} objects
                </div>
              </div>
            )}

            <PositionPanel
              shapes={shapes}
              selectedShapeIds={selectedShapeIds}
              onUpdate={onUpdateShape}
            />
            <TransformPanel
              shapes={shapes}
              selectedShapeIds={selectedShapeIds}
              onUpdate={onUpdateShape}
            />
            <StylePanel
              canvas={canvas}
              shapes={shapes}
              selectedShapeIds={selectedShapeIds}
              onUpdate={onUpdateShape}
            />
            <ExportPanel
              canvas={canvas}
              shapes={shapes}
              selectedShapeIds={selectedShapeIds}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 mb-4 rounded-full bg-white/5 flex items-center justify-center">
              <div className="grid grid-cols-2 gap-1 w-8 h-8">
                <Circle className="w-3.5 h-3.5 text-white/30" />
                <RectangleHorizontal className="w-3.5 h-3.5 text-white/30" />
                <Square className="w-3.5 h-3.5 text-white/30" />
                <Triangle className="w-3.5 h-3.5 text-white/30" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-white/70 mb-2">
              Select a shape to edit properties
            </h3>
            <p className="text-xs text-white/40 max-w-[200px]">
              Click on any shape or use keyboard shortcuts to get started
            </p>
          </div>
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

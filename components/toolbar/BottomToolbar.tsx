"use client";

/**
 * BottomToolbar component - Figma-style toolbar with grouped tool dropdowns
 * Positioned at bottom-center of the canvas
 */

import { memo } from "react";
import { ToolDropdown, type ToolConfig } from "./ToolDropdown";
import { ToolSingleButton } from "./ToolSingleButton";
import { ColorPicker } from "./ColorPicker";

export type Tool =
  | "select"
  | "hand"
  | "rectangle"
  | "circle"
  | "ellipse"
  | "pencil"
  | "polygon"
  | "line"
  | "text";

interface BottomToolbarProps {
  activeTool: Tool;
  onToolChange: (tool: Tool) => void;
  selectedShapeColor?: string;
  onColorChange?: (color: string) => void;
}

function BottomToolbarComponent({
  activeTool,
  onToolChange,
  selectedShapeColor,
  onColorChange,
}: BottomToolbarProps) {
  // Selection Tools Group
  const selectionTools: ToolConfig[] = [
    {
      id: "select",
      icon: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
        </svg>
      ),
      label: "Move",
      shortcut: "V",
    },
    {
      id: "hand",
      icon: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
          <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2" />
          <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
          <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
        </svg>
      ),
      label: "Hand",
      shortcut: "H",
    },
  ];

  // Shape Tools Group
  const shapeTools: ToolConfig[] = [
    {
      id: "rectangle",
      icon: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
        </svg>
      ),
      label: "Rectangle",
      shortcut: "R",
    },
    {
      id: "circle",
      icon: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="9" />
        </svg>
      ),
      label: "Circle",
      shortcut: "C",
    },
    {
      id: "ellipse",
      icon: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <ellipse cx="12" cy="12" rx="9" ry="6" />
        </svg>
      ),
      label: "Ellipse",
      shortcut: "E",
    },
    {
      id: "polygon",
      icon: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="12 2 2 19 12 15 22 19" />
        </svg>
      ),
      label: "Polygon",
    },
  ];

  // Pencil Tool (single button)
  const pencilIcon = (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  );

  // Line Tool (single button)
  const lineIcon = (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="5" y1="19" x2="19" y2="5" />
    </svg>
  );

  // Text Tool (single button)
  const textIcon = (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="4 7 4 4 20 4 20 7" />
      <line x1="9" y1="20" x2="15" y2="20" />
      <line x1="12" y1="4" x2="12" y2="20" />
    </svg>
  );

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-[#383838] backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl">
      {/* Selection Tools Dropdown */}
      <ToolDropdown
        tools={selectionTools}
        activeTool={activeTool}
        onToolSelect={(toolId) => onToolChange(toolId as Tool)}
      />

      {/* Shape Tools Dropdown */}
      <ToolDropdown
        tools={shapeTools}
        activeTool={activeTool}
        onToolSelect={(toolId) => onToolChange(toolId as Tool)}
      />

      {/* Pencil Tool - Single Button */}
      <ToolSingleButton
        id="pencil"
        icon={pencilIcon}
        label="Pencil"
        shortcut="P"
        isActive={activeTool === "pencil"}
        onClick={() => onToolChange("pencil")}
      />

      {/* Line Tool - Single Button */}
      <ToolSingleButton
        id="line"
        icon={lineIcon}
        label="Line"
        shortcut="L"
        isActive={activeTool === "line"}
        onClick={() => onToolChange("line")}
      />

      {/* Text Tool - Single Button */}
      <ToolSingleButton
        id="text"
        icon={textIcon}
        label="Text"
        shortcut="T"
        isActive={activeTool === "text"}
        onClick={() => onToolChange("text")}
      />

      {/* Color Picker - only show when shape is selected */}
      {selectedShapeColor && onColorChange && (
        <ColorPicker value={selectedShapeColor} onChange={onColorChange} />
      )}
    </div>
  );
}

// Memoize component to prevent re-renders when unrelated state changes
export const BottomToolbar = memo(
  BottomToolbarComponent,
  (prevProps, nextProps) => {
    // Only re-render if relevant props change
    return (
      prevProps.activeTool === nextProps.activeTool &&
      prevProps.onToolChange === nextProps.onToolChange &&
      prevProps.selectedShapeColor === nextProps.selectedShapeColor &&
      prevProps.onColorChange === nextProps.onColorChange
    );
  },
);

"use client";

/**
 * Toolbar component - contains tool buttons for shape creation and selection
 */

import { ToolButton } from "./ToolButton";
import { KeyboardAction, getShortcutLabel } from "@/constants/keyboard";

export type Tool = "select" | "rectangle";

interface ToolbarProps {
  activeTool: Tool;
  onToolChange: (tool: Tool) => void;
}

export function Toolbar({ activeTool, onToolChange }: ToolbarProps) {
  const selectShortcut = getShortcutLabel(KeyboardAction.SELECT_TOOL);
  const rectangleShortcut = getShortcutLabel(KeyboardAction.RECTANGLE_TOOL);

  return (
    <div className="flex items-center gap-2 p-2 bg-white rounded-lg shadow-lg border border-gray-200">
      {/* Select Tool */}
      <ToolButton
        icon={
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
          </svg>
        }
        tooltip={`Select (${selectShortcut})`}
        shortcut={selectShortcut}
        active={activeTool === "select"}
        onClick={() => onToolChange("select")}
      />

      {/* Separator */}
      <div className="w-px h-8 bg-gray-300" />

      {/* Rectangle Tool */}
      <ToolButton
        icon={
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
          </svg>
        }
        tooltip={`Rectangle (${rectangleShortcut})`}
        shortcut={rectangleShortcut}
        active={activeTool === "rectangle"}
        onClick={() => onToolChange("rectangle")}
      />

      {/* Tool indicator text */}
      <div className="ml-2 px-3 py-1 text-sm text-gray-600 border-l border-gray-300 pl-4">
        {activeTool === "select" ? "Select" : "Rectangle"}
      </div>
    </div>
  );
}

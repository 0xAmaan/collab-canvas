"use client";

/**
 * ToolButton component - reusable button for toolbar tools
 */

import { ButtonHTMLAttributes, ReactNode } from "react";

interface ToolButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Whether this tool is currently active */
  active?: boolean;
  /** Icon to display (can be emoji, SVG, or any React node) */
  icon: ReactNode;
  /** Tooltip text */
  tooltip?: string;
  /** Keyboard shortcut hint */
  shortcut?: string;
}

export function ToolButton({
  active = false,
  icon,
  tooltip,
  shortcut,
  className = "",
  ...props
}: ToolButtonProps) {
  return (
    <button
      type="button"
      className={`
        relative flex items-center justify-center
        w-10 h-10 rounded-lg
        transition-all duration-150
        ${
          active
            ? "bg-blue-500 text-white shadow-md"
            : "bg-white text-gray-700 hover:bg-gray-100 hover:shadow-sm"
        }
        border ${active ? "border-blue-600" : "border-gray-300"}
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      title={tooltip}
      aria-label={tooltip}
      aria-pressed={active}
      {...props}
    >
      <span className="text-lg">{icon}</span>

      {/* Keyboard shortcut hint */}
      {shortcut && (
        <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs text-gray-500 font-mono">
          {shortcut}
        </span>
      )}
    </button>
  );
}

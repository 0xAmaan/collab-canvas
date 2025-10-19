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
        transition-all duration-200
        cursor-pointer
        ${
          active
            ? "bg-gradient-to-br from-active-from to-active-to text-white shadow-lg shadow-blue-500/50"
            : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
        }
        border ${active ? "border-blue-400/50" : "border-white/10 hover:border-white/20"}
        focus:outline-none focus:ring-2 focus:ring-blue-500/50
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      title={tooltip}
      aria-label={tooltip}
      aria-pressed={active}
      {...props}
    >
      <span className="text-lg relative z-10">{icon}</span>

      {/* Active glow effect */}
      {active && (
        <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-active-from to-active-to blur opacity-50"></div>
      )}

      {/* Keyboard shortcut hint - Excalidraw style subscript */}
      {shortcut && (
        <span className="absolute bottom-0.5 right-0.5 text-[9px] text-white/70 font-medium z-10">
          {shortcut}
        </span>
      )}
    </button>
  );
}

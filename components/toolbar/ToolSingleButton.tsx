"use client";

/**
 * ToolSingleButton component - Single tool button without dropdown
 * For tools that don't have variants (like Text, Line)
 */

import { useState, ReactNode } from "react";

interface ToolSingleButtonProps {
  id: string;
  icon: ReactNode;
  label: string;
  shortcut?: string;
  isActive: boolean;
  onClick: () => void;
}

export const ToolSingleButton = ({
  id,
  icon,
  label,
  shortcut,
  isActive,
  onClick,
}: ToolSingleButtonProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          relative flex items-center justify-center
          w-8 h-8 rounded-lg
          transition-all duration-200
          cursor-pointer
          ${
            isActive
              ? "text-white"
              : "text-white/70 hover:text-white/90 hover:bg-white/5"
          }
          focus:outline-none
        `}
        style={isActive ? { backgroundColor: "#0C8CE9" } : undefined}
        title={label}
        aria-label={label}
      >
        <span className="text-[18px]">{icon}</span>
      </button>

      {/* Tooltip on hover - shows tool name and keyboard shortcut */}
      {isHovered && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-white text-xs rounded whitespace-nowrap z-50 pointer-events-none">
          {label}
          {shortcut && <span className="ml-2 text-white/60">{shortcut}</span>}
        </div>
      )}
    </div>
  );
};

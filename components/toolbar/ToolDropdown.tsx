"use client";

/**
 * ToolDropdown component - Figma-style tool button with separate dropdown trigger
 * Shows active tool button + dropdown chevron as separate interactive elements
 */

import { useState, useRef, useEffect, ReactNode } from "react";

export interface ToolConfig {
  id: string;
  icon: ReactNode;
  label: string;
  shortcut?: string;
}

interface ToolDropdownProps {
  tools: ToolConfig[];
  activeTool: string;
  onToolSelect: (toolId: string) => void;
}

export const ToolDropdown = ({
  tools,
  activeTool,
  onToolSelect,
}: ToolDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredTool, setHoveredTool] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Find the active tool config (default to first tool if active tool not in list)
  const activeToolConfig = tools.find((t) => t.id === activeTool) || tools[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleToolSelect = (toolId: string) => {
    onToolSelect(toolId);
    setIsOpen(false);
  };

  const handleActiveToolClick = () => {
    // Clicking the active tool button selects it (even if already selected)
    onToolSelect(activeToolConfig.id);
  };

  return (
    <div className="relative flex items-center" ref={dropdownRef}>
      {/* Main tool button - activates the current tool */}
      <div className="relative">
        <button
          type="button"
          onClick={handleActiveToolClick}
          onMouseEnter={() => setHoveredTool(activeToolConfig.id)}
          onMouseLeave={() => setHoveredTool(null)}
          className={`
            relative flex items-center justify-center
            w-8 h-8 rounded-lg
            transition-all duration-200
            cursor-pointer
            ${
              activeTool === activeToolConfig.id
                ? "text-white"
                : "text-white/70 hover:text-white/90 hover:bg-white/5"
            }
            focus:outline-none
          `}
          style={
            activeTool === activeToolConfig.id
              ? { backgroundColor: "#0C8CE9" }
              : undefined
          }
          title={activeToolConfig.label}
          aria-label={activeToolConfig.label}
        >
          <span className="text-[18px]">{activeToolConfig.icon}</span>
        </button>

        {/* Tooltip on hover - shows tool name and keyboard shortcut */}
        {hoveredTool === activeToolConfig.id && (
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-white text-xs rounded whitespace-nowrap z-50 pointer-events-none">
            {activeToolConfig.label}
            {activeToolConfig.shortcut && (
              <span className="ml-2 text-white/60">
                {activeToolConfig.shortcut}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Dropdown trigger button - separate from tool button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          relative flex items-center justify-center
          w-4 h-8 rounded-md
          transition-all duration-200
          cursor-pointer
          text-white/70 hover:text-white/90 hover:bg-white/5
          focus:outline-none
        `}
        title="More tools"
        aria-label="Open tool menu"
        aria-expanded={isOpen}
      >
        {/* Chevron icon */}
        <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
          <path d="M2 4 L6 8 L10 4 Z" />
        </svg>
      </button>

      {/* Dropdown menu - opens upward */}
      {isOpen && (
        <div className="absolute bottom-full mb-2 left-0 z-50 min-w-[200px] bg-[#383838] backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl p-1 overflow-hidden">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => handleToolSelect(tool.id)}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-md
                text-sm hover:bg-white/10
                transition-colors
                ${activeTool === tool.id ? "text-white" : "text-white/90"}
              `}
              style={
                activeTool === tool.id
                  ? { backgroundColor: "#0C8CE9" }
                  : undefined
              }
            >
              <span className="text-[18px] flex-shrink-0">{tool.icon}</span>
              <span className="flex-1 text-left">{tool.label}</span>
              {tool.shortcut && (
                <span className="text-xs text-white/40 font-medium">
                  {tool.shortcut}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

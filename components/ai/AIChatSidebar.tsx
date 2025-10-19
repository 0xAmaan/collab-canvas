/**
 * AI Chat Sidebar Component
 * Collapsible sidebar with chat history and input
 */

"use client";

import { PanelRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ChatHistory, type ChatMessageType } from "@/components/ai/ChatHistory";
import { ChatInput } from "@/components/ai/ChatInput";

interface AIChatSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  messages: ChatMessageType[];
  onSubmit: (command: string) => void;
  isLoading: boolean;
}

export const AIChatSidebar = ({
  isOpen,
  onToggle,
  messages,
  onSubmit,
  isLoading,
}: AIChatSidebarProps) => {
  const [isCollapseHovered, setIsCollapseHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevIsOpenRef = useRef(isOpen);

  // Autofocus input when sidebar is opened (not on initial load)
  useEffect(() => {
    // Only focus if sidebar just opened (was closed, now open)
    if (isOpen && !prevIsOpenRef.current) {
      // Small delay to ensure transition completes
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 250); // Slightly longer than the 200ms transition

      return () => clearTimeout(timer);
    }

    // Update previous state
    prevIsOpenRef.current = isOpen;
  }, [isOpen]);

  return (
    <div
      className={`h-full bg-sidebar border-r border-white/10 flex flex-col transition-all duration-200 ease-in-out relative z-10 ${
        isOpen ? "w-[280px]" : "w-0"
      } overflow-hidden`}
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

      {/* AI Assistant Section Header */}
      <div className="px-4 pt-3 pb-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
          <h2 className="text-[11px] font-medium text-[#999999] uppercase tracking-wide">
            AI Assistant
          </h2>
        </div>
      </div>

      {/* Chat History - scrollable area */}
      <ChatHistory messages={messages} />

      {/* Chat Input - sticky at bottom */}
      <div className="flex-shrink-0">
        <ChatInput ref={inputRef} onSubmit={onSubmit} isLoading={isLoading} />
      </div>
    </div>
  );
};

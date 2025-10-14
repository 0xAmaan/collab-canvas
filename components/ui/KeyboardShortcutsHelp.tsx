"use client";

/**
 * Keyboard Shortcuts Help Modal
 * Displays all available keyboard shortcuts
 * Positioned in bottom-right corner
 */

import { useEffect, useRef } from "react";
import { getUniqueShortcuts } from "@/constants/keyboard";

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsHelp({
  isOpen,
  onClose,
}: KeyboardShortcutsHelpProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Get unique shortcuts (no duplicates like Delete/Backspace)
  const shortcuts = getUniqueShortcuts();

  // Handle click outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    // Add small delay to prevent immediate close from the opening click
    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-end justify-end p-6">
      <div
        ref={modalRef}
        className="pointer-events-auto bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 w-96 animate-in fade-in slide-in-from-bottom-4 duration-200"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-white"
              >
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white">
              Keyboard Shortcuts
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10 cursor-pointer"
            aria-label="Close"
          >
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
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="px-6 py-4 space-y-3 max-h-96 overflow-y-auto">
          {shortcuts.map((shortcut, index) => (
            <div
              key={index}
              className="flex items-center justify-between gap-4 group"
            >
              <span className="text-sm text-white/70 group-hover:text-white flex-1 transition-colors">
                {shortcut.description}
              </span>
              <kbd className="px-3 py-1.5 text-sm font-semibold text-white bg-white/10 border border-white/20 rounded-lg shadow-sm min-w-[60px] text-center group-hover:bg-white/15 group-hover:border-white/30 transition-all">
                {shortcut.displayKey}
              </kbd>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/10 bg-slate-800/50 rounded-b-2xl">
          <p className="text-xs text-white/50 text-center flex items-center justify-center gap-2">
            <span>Press</span>
            <kbd className="px-2 py-1 text-xs bg-white/10 border border-white/20 rounded-md font-semibold text-white">
              ?
            </kbd>
            <span>to toggle this help</span>
          </p>
        </div>
      </div>
    </div>
  );
}

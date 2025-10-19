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

  // Handle Escape key to close
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-end justify-end p-6">
      <div
        ref={modalRef}
        className="pointer-events-auto bg-panel backdrop-blur-xl rounded-xl shadow-2xl border border-white/10 w-96 animate-in fade-in slide-in-from-bottom-4 duration-200"
      >
        {/* Header */}
        <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shadow-lg">
              <svg
                width="14"
                height="14"
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
            <h3 className="text-base font-semibold text-white">
              Keyboard Shortcuts
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10 cursor-pointer"
            aria-label="Close"
          >
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
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="px-5 py-3 space-y-2 max-h-96 overflow-y-auto">
          {shortcuts.map((shortcut, index) => (
            <div
              key={index}
              className="flex items-center justify-between gap-4 group py-0.5"
            >
              <span className="text-xs text-white/70 group-hover:text-white flex-1 transition-colors">
                {shortcut.description}
              </span>
              <kbd className="px-2.5 py-1 text-xs font-semibold text-white/90 bg-[var(--color-panel)] border border-white/15 rounded-md shadow-sm min-w-[50px] text-center group-hover:bg-toolbar group-hover:border-white/25 transition-all">
                {shortcut.displayKey}
              </kbd>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 border-t border-white/10 bg-sidebar rounded-b-xl">
          <p className="text-xs text-white/50 text-center flex items-center justify-center gap-2">
            <span>Press</span>
            <kbd className="px-2 py-0.5 text-xs bg-[var(--color-panel)] border border-white/15 rounded font-semibold text-white/90">
              ⌘/
            </kbd>
            <span>to toggle this help</span>
          </p>
        </div>
      </div>
    </div>
  );
}

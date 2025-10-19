"use client";

/**
 * Keyboard Shortcuts Help Modal
 * Displays all available keyboard shortcuts grouped by category
 * Positioned in bottom-right corner
 */

import { useEffect, useRef } from "react";
import { Keyboard, X } from "lucide-react";
import { getUniqueShortcuts, KeyboardAction } from "@/constants/keyboard";
import type { KeyboardShortcut } from "@/constants/keyboard";

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

// Group shortcuts by category
const groupShortcuts = (shortcuts: KeyboardShortcut[]) => {
  const tools: KeyboardShortcut[] = [];
  const actions: KeyboardShortcut[] = [];
  const navigation: KeyboardShortcut[] = [];

  shortcuts.forEach((shortcut) => {
    switch (shortcut.action) {
      case KeyboardAction.SELECT_TOOL:
      case KeyboardAction.HAND_TOOL:
      case KeyboardAction.RECTANGLE_TOOL:
      case KeyboardAction.CIRCLE_TOOL:
      case KeyboardAction.ELLIPSE_TOOL:
      case KeyboardAction.LINE_TOOL:
      case KeyboardAction.TEXT_TOOL:
      case KeyboardAction.PENCIL_TOOL:
        tools.push(shortcut);
        break;
      case KeyboardAction.DELETE_SHAPE:
      case KeyboardAction.DUPLICATE_SHAPE:
      case KeyboardAction.COPY_SHAPE:
      case KeyboardAction.PASTE_SHAPE:
      case KeyboardAction.UNDO:
      case KeyboardAction.REDO:
        actions.push(shortcut);
        break;
      case KeyboardAction.SHOW_HELP:
      case KeyboardAction.TOGGLE_AI_SIDEBAR:
        navigation.push(shortcut);
        break;
    }
  });

  return { tools, actions, navigation };
};

export const KeyboardShortcutsHelp = ({
  isOpen,
  onClose,
}: KeyboardShortcutsHelpProps) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Get unique shortcuts grouped by category
  const shortcuts = getUniqueShortcuts();
  const { tools, actions, navigation } = groupShortcuts(shortcuts);

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

  // Render a category section
  const renderCategory = (
    title: string,
    shortcuts: KeyboardShortcut[],
    showDivider: boolean = true,
  ) => (
    <div>
      <div className="text-[11px] font-semibold text-white uppercase tracking-wide mb-1">
        {title}
      </div>
      <div className="space-y-1">
        {shortcuts.map((shortcut, index) => (
          <div
            key={index}
            className="flex items-center justify-between gap-4 group"
          >
            <span className="text-xs text-white group-hover:text-white/90 flex-1 transition-colors">
              {shortcut.description}
            </span>
            <kbd className="px-2 py-0.5 text-xs font-semibold text-gray-300 rounded shadow-sm min-w-[45px] text-center group-hover:bg-toolbar group-hover:border-white/25 transition-all">
              {shortcut.displayKey}
            </kbd>
          </div>
        ))}
      </div>
      {showDivider && <div className="h-px bg-white/10 my-3" />}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-end justify-end p-6">
      <div
        ref={modalRef}
        className="pointer-events-auto bg-panel backdrop-blur-xl rounded-xl shadow-2xl border border-white/10 w-96 animate-in fade-in slide-in-from-bottom-4 duration-200"
      >
        {/* Header */}
        <div className="px-4 py-2.5 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-base font-semibold text-white">
            Keyboard Shortcuts
          </h3>

          <button
            onClick={onClose}
            className="text-white/50 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10 cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcuts List - Grouped by Category */}
        <div className="px-4 py-2 space-y-3 max-h-96 overflow-y-auto">
          {renderCategory("Tools", tools, true)}
          {renderCategory("Actions", actions, true)}
          {renderCategory("Navigation", navigation, false)}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-white/10 bg-sidebar rounded-b-xl">
          <p className="text-xs text-white/50 text-center flex items-center justify-center gap-2">
            <span>Press</span>
            <kbd className="px-2 py-0.5 text-xs bg-[var(--color-panel)] border border-white/15 rounded font-semibold text-white/50">
              ⌘/
            </kbd>
            <span>to toggle</span>
          </p>
        </div>
      </div>
    </div>
  );
};

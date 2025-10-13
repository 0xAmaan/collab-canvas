/**
 * Custom hook for handling keyboard shortcuts
 */

import { useEffect } from "react";

interface KeyboardShortcuts {
  onEscape?: () => void;
  onR?: () => void;
  onDelete?: () => void;
  onBackspace?: () => void;
}

/**
 * Hook to handle keyboard shortcuts
 * Automatically ignores shortcuts when typing in input fields
 */
export function useKeyboard(shortcuts: KeyboardShortcuts) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      const target = e.target as HTMLElement;
      const isInputField =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (isInputField) {
        return;
      }

      // Check if any modifier keys are pressed (Cmd, Ctrl, Alt, Shift)
      // Allow browser shortcuts like Cmd+R, Ctrl+R, etc.
      const hasModifier = e.metaKey || e.ctrlKey || e.altKey;

      // Handle shortcuts (only if no modifier keys are pressed)
      const key = e.key.toLowerCase();

      if (key === "escape" && shortcuts.onEscape) {
        e.preventDefault();
        shortcuts.onEscape();
      } else if (key === "r" && shortcuts.onR && !hasModifier) {
        // Only trigger 'R' shortcut if no modifier keys are pressed
        e.preventDefault();
        shortcuts.onR();
      } else if (key === "delete" && shortcuts.onDelete) {
        e.preventDefault();
        shortcuts.onDelete();
      } else if (key === "backspace" && shortcuts.onBackspace) {
        e.preventDefault();
        shortcuts.onBackspace();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [shortcuts]);
}

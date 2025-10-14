/**
 * Custom hook for handling keyboard shortcuts
 */

import { useEffect } from "react";
import {
  KeyboardAction,
  getShortcutByKey,
  KEYBOARD_SHORTCUTS,
} from "@/constants/keyboard";

interface KeyboardShortcuts {
  onSelectTool?: () => void;
  onRectangleTool?: () => void;
  onDeleteShape?: () => void;
  onShowHelp?: () => void;
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

      // Get the pressed key
      const key = e.key.toLowerCase();

      // Find matching shortcut
      const shortcut = getShortcutByKey(key);

      if (!shortcut) {
        return;
      }

      // Handle each action
      switch (shortcut.action) {
        case KeyboardAction.SELECT_TOOL:
          if (shortcuts.onSelectTool) {
            e.preventDefault();
            shortcuts.onSelectTool();
          }
          break;

        case KeyboardAction.RECTANGLE_TOOL:
          // Only trigger 'R' shortcut if no modifier keys are pressed
          if (shortcuts.onRectangleTool && !hasModifier) {
            e.preventDefault();
            shortcuts.onRectangleTool();
          }
          break;

        case KeyboardAction.DELETE_SHAPE:
          if (shortcuts.onDeleteShape) {
            e.preventDefault();
            shortcuts.onDeleteShape();
          }
          break;

        case KeyboardAction.SHOW_HELP:
          if (shortcuts.onShowHelp) {
            e.preventDefault();
            shortcuts.onShowHelp();
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [shortcuts]);
}

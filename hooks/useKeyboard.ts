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
  onCircleTool?: () => void;
  onEllipseTool?: () => void;
  onLineTool?: () => void;
  onTextTool?: () => void;
  onDeleteShape?: () => void;
  onShowHelp?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onDuplicate?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onToggleSidebar?: () => void;
}

/**
 * Hook to handle keyboard shortcuts
 * Automatically ignores shortcuts when typing in input fields
 */
export function useKeyboard(shortcuts: KeyboardShortcuts) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if any modifier keys are pressed
      const metaKey = e.metaKey || e.ctrlKey; // Cmd on Mac, Ctrl on Windows
      const hasModifier = metaKey || e.altKey;

      // Get the pressed key
      const key = e.key.toLowerCase();

      // Handle toggle sidebar with Cmd+\ - ALWAYS allow this, even in input fields
      if (key === "\\" && metaKey) {
        e.preventDefault();
        if (shortcuts.onToggleSidebar) {
          shortcuts.onToggleSidebar();
        }
        return;
      }

      // Ignore other shortcuts if user is typing in an input field
      const target = e.target as HTMLElement;
      const isInputField =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (isInputField) {
        return;
      }

      // Handle undo/redo with special key combination detection
      if (key === "z" && metaKey) {
        e.preventDefault();
        if (e.shiftKey && shortcuts.onRedo) {
          shortcuts.onRedo();
        } else if (!e.shiftKey && shortcuts.onUndo) {
          shortcuts.onUndo();
        }
        return;
      }

      // Handle duplicate with Cmd+D
      if (key === "d" && metaKey) {
        e.preventDefault();
        if (shortcuts.onDuplicate) {
          shortcuts.onDuplicate();
        }
        return;
      }

      // Handle copy with Cmd+C
      if (key === "c" && metaKey) {
        e.preventDefault();
        if (shortcuts.onCopy) {
          shortcuts.onCopy();
        }
        return;
      }

      // Handle paste with Cmd+V
      if (key === "v" && metaKey) {
        e.preventDefault();
        if (shortcuts.onPaste) {
          shortcuts.onPaste();
        }
        return;
      }

      // Handle show help with Cmd+/
      if (key === "/" && metaKey) {
        e.preventDefault();
        if (shortcuts.onShowHelp) {
          shortcuts.onShowHelp();
        }
        return;
      }

      // Find matching shortcut for other keys
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

        case KeyboardAction.CIRCLE_TOOL:
          if (shortcuts.onCircleTool && !hasModifier) {
            e.preventDefault();
            shortcuts.onCircleTool();
          }
          break;

        case KeyboardAction.ELLIPSE_TOOL:
          if (shortcuts.onEllipseTool && !hasModifier) {
            e.preventDefault();
            shortcuts.onEllipseTool();
          }
          break;

        case KeyboardAction.LINE_TOOL:
          if (shortcuts.onLineTool && !hasModifier) {
            e.preventDefault();
            shortcuts.onLineTool();
          }
          break;

        case KeyboardAction.TEXT_TOOL:
          if (shortcuts.onTextTool && !hasModifier) {
            e.preventDefault();
            shortcuts.onTextTool();
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

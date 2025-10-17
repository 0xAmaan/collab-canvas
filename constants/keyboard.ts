/**
 * Keyboard shortcuts configuration
 * Centralized location for all keyboard shortcut definitions
 */

export enum KeyboardAction {
  SELECT_TOOL = "SELECT_TOOL",
  RECTANGLE_TOOL = "RECTANGLE_TOOL",
  CIRCLE_TOOL = "CIRCLE_TOOL",
  ELLIPSE_TOOL = "ELLIPSE_TOOL",
  LINE_TOOL = "LINE_TOOL",
  TEXT_TOOL = "TEXT_TOOL",
  DELETE_SHAPE = "DELETE_SHAPE",
  SHOW_HELP = "SHOW_HELP",
  UNDO = "UNDO",
  REDO = "REDO",
  DUPLICATE_SHAPE = "DUPLICATE_SHAPE",
  COPY_SHAPE = "COPY_SHAPE",
  PASTE_SHAPE = "PASTE_SHAPE",
}

export interface KeyboardShortcut {
  key: string;
  displayKey: string; // How the key is displayed in UI
  action: KeyboardAction;
  description: string;
  requiresSelection?: boolean; // Whether this action requires a shape to be selected
}

export const KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
  {
    key: "r",
    displayKey: "R",
    action: KeyboardAction.RECTANGLE_TOOL,
    description: "Toggle rectangle creation tool",
    requiresSelection: false,
  },
  {
    key: "c",
    displayKey: "C",
    action: KeyboardAction.CIRCLE_TOOL,
    description: "Toggle circle creation tool",
    requiresSelection: false,
  },
  {
    key: "e",
    displayKey: "E",
    action: KeyboardAction.ELLIPSE_TOOL,
    description: "Toggle ellipse creation tool",
    requiresSelection: false,
  },
  {
    key: "l",
    displayKey: "L",
    action: KeyboardAction.LINE_TOOL,
    description: "Toggle line creation tool",
    requiresSelection: false,
  },
  {
    key: "t",
    displayKey: "T",
    action: KeyboardAction.TEXT_TOOL,
    description: "Toggle text creation tool",
    requiresSelection: false,
  },
  {
    key: "escape",
    displayKey: "Esc",
    action: KeyboardAction.SELECT_TOOL,
    description: "Switch to select tool / Deselect",
    requiresSelection: false,
  },
  {
    key: "delete",
    displayKey: "Delete",
    action: KeyboardAction.DELETE_SHAPE,
    description: "Delete selected shape",
    requiresSelection: true,
  },
  {
    key: "backspace",
    displayKey: "Backspace",
    action: KeyboardAction.DELETE_SHAPE,
    description: "Delete selected shape",
    requiresSelection: true,
  },
  {
    key: "?",
    displayKey: "?",
    action: KeyboardAction.SHOW_HELP,
    description: "Show keyboard shortcuts help",
    requiresSelection: false,
  },
  {
    key: "z",
    displayKey: "⌘Z",
    action: KeyboardAction.UNDO,
    description: "Undo last action",
    requiresSelection: false,
  },
  {
    key: "z+shift",
    displayKey: "⌘⇧Z",
    action: KeyboardAction.REDO,
    description: "Redo last undone action",
    requiresSelection: false,
  },
  {
    key: "d",
    displayKey: "⌘D",
    action: KeyboardAction.DUPLICATE_SHAPE,
    description: "Duplicate selected shape",
    requiresSelection: true,
  },
  {
    key: "c",
    displayKey: "⌘C",
    action: KeyboardAction.COPY_SHAPE,
    description: "Copy selected shape",
    requiresSelection: true,
  },
  {
    key: "v",
    displayKey: "⌘V",
    action: KeyboardAction.PASTE_SHAPE,
    description: "Paste copied shape",
    requiresSelection: false,
  },
];

/**
 * Get shortcut by key
 */
export function getShortcutByKey(key: string): KeyboardShortcut | undefined {
  return KEYBOARD_SHORTCUTS.find(
    (shortcut) => shortcut.key === key.toLowerCase(),
  );
}

/**
 * Get shortcut by action
 */
export function getShortcutByAction(
  action: KeyboardAction,
): KeyboardShortcut | undefined {
  return KEYBOARD_SHORTCUTS.find((shortcut) => shortcut.action === action);
}

/**
 * Get display label for a keyboard shortcut action
 */
export function getShortcutLabel(action: KeyboardAction): string {
  const shortcut = getShortcutByAction(action);
  return shortcut?.displayKey || "";
}

/**
 * Get all shortcuts for display in help
 * Filters out duplicate actions (like Delete/Backspace)
 */
export function getUniqueShortcuts(): KeyboardShortcut[] {
  const seen = new Set<KeyboardAction>();
  return KEYBOARD_SHORTCUTS.filter((shortcut) => {
    if (seen.has(shortcut.action)) {
      return false;
    }
    seen.add(shortcut.action);
    return true;
  });
}

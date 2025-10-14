/**
 * Keyboard shortcuts configuration
 * Centralized location for all keyboard shortcut definitions
 */

export enum KeyboardAction {
  SELECT_TOOL = "SELECT_TOOL",
  RECTANGLE_TOOL = "RECTANGLE_TOOL",
  DELETE_SHAPE = "DELETE_SHAPE",
  SHOW_HELP = "SHOW_HELP",
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

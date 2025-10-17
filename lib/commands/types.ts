/**
 * Command Pattern Types for Undo/Redo System
 */

export interface Command {
  execute: () => Promise<void>;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
}

/**
 * Custom hook for managing undo/redo history
 * Implements command pattern with 25-operation stack limit
 */

import { useState, useCallback, useMemo, useRef } from "react";
import type { Command } from "@/lib/commands/types";

const MAX_HISTORY_SIZE = 25;

export const useHistory = () => {
  const [undoStack, setUndoStack] = useState<Command[]>([]);
  const [redoStack, setRedoStack] = useState<Command[]>([]);
  const isExecutingRef = useRef(false);

  /**
   * Execute a command and add it to history
   */
  const execute = useCallback(async (command: Command) => {
    try {
      await command.execute();

      // Add to undo stack
      setUndoStack((prev) => {
        const newStack = [...prev, command];
        // Cap at 25 operations
        if (newStack.length > MAX_HISTORY_SIZE) {
          newStack.shift();
        }
        return newStack;
      });

      // Clear redo stack (new action invalidates redo history)
      setRedoStack([]);
    } catch (error) {
      console.error("Failed to execute command:", error);
      throw error;
    }
  }, []);

  /**
   * Undo the last operation
   */
  const undo = useCallback(async () => {
    setUndoStack((prevUndo) => {
      // Prevent double-execution using ref (synchronous check inside setState)
      if (isExecutingRef.current) {
        return prevUndo;
      }

      if (prevUndo.length === 0) {
        return prevUndo;
      }

      // Set flag immediately to block concurrent calls
      isExecutingRef.current = true;

      const command = prevUndo[prevUndo.length - 1];

      // Execute undo asynchronously
      command
        .undo()
        .catch((error) => {
          console.error("Failed to undo command:", error);
        })
        .finally(() => {
          isExecutingRef.current = false;
        });

      // Move command from undo to redo stack
      setRedoStack((prevRedo) => [...prevRedo, command]);

      return prevUndo.slice(0, -1);
    });
  }, []);

  /**
   * Redo the last undone operation
   */
  const redo = useCallback(async () => {
    setRedoStack((prevRedo) => {
      // Prevent double-execution using ref (synchronous check inside setState)
      if (isExecutingRef.current) {
        return prevRedo;
      }

      if (prevRedo.length === 0) {
        return prevRedo;
      }

      // Set flag immediately to block concurrent calls
      isExecutingRef.current = true;

      const command = prevRedo[prevRedo.length - 1];

      // Execute redo asynchronously
      command
        .redo()
        .catch((error) => {
          console.error("Failed to redo command:", error);
        })
        .finally(() => {
          isExecutingRef.current = false;
        });

      // Move command from redo to undo stack
      setUndoStack((prevUndo) => {
        const newStack = [...prevUndo, command];
        // Cap at 25 operations
        if (newStack.length > MAX_HISTORY_SIZE) {
          newStack.shift();
        }
        return newStack;
      });

      return prevRedo.slice(0, -1);
    });
  }, []);

  /**
   * Clear all history
   */
  const clear = useCallback(() => {
    setUndoStack([]);
    setRedoStack([]);
  }, []);

  // Return memoized object to prevent unnecessary re-renders
  return useMemo(
    () => ({
      execute,
      undo,
      redo,
      canUndo: undoStack.length > 0,
      canRedo: redoStack.length > 0,
      clear,
    }),
    [execute, undo, redo, undoStack.length, redoStack.length, clear],
  );
};

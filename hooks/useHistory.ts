/**
 * Custom hook for managing undo/redo history
 * Implements command pattern with 5-operation stack limit
 */

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import type { Command } from "@/lib/commands/types";

const MAX_HISTORY_SIZE = 5;

type PendingAction =
  | { type: "undo"; command: Command }
  | { type: "redo"; command: Command };

export const useHistory = () => {
  const [undoStack, setUndoStack] = useState<Command[]>([]);
  const [redoStack, setRedoStack] = useState<Command[]>([]);
  const [pendingQueue, setPendingQueue] = useState<PendingAction[]>([]);
  const isExecutingRef = useRef(false);

  // Execute pending commands in useEffect to avoid setState during render
  useEffect(() => {
    if (pendingQueue.length === 0 || isExecutingRef.current) return;

    const actionsToExecute = [...pendingQueue];
    isExecutingRef.current = true;
    setPendingQueue([]);

    const executeActions = async () => {
      try {
        await Promise.all(
          actionsToExecute.map((action) =>
            action.type === "undo"
              ? action.command.undo()
              : action.command.redo(),
          ),
        );
      } catch (error) {
        console.error("Failed to execute command:", error);
      } finally {
        isExecutingRef.current = false;
        // Trigger next batch if commands accumulated during execution
        setPendingQueue((current) =>
          current.length > 0 ? [...current] : current,
        );
      }
    };

    executeActions();
  }, [pendingQueue]);

  const execute = useCallback(async (command: Command) => {
    try {
      await command.execute();

      setUndoStack((prev) => {
        const newStack = [...prev, command];
        return newStack.length > MAX_HISTORY_SIZE
          ? newStack.slice(1)
          : newStack;
      });

      setRedoStack([]);
    } catch (error) {
      console.error("Failed to execute command:", error);
      throw error;
    }
  }, []);

  const undo = useCallback(async () => {
    setUndoStack((prevUndo) => {
      if (prevUndo.length === 0) return prevUndo;

      const command = prevUndo[prevUndo.length - 1];

      setPendingQueue((prev) =>
        prev.some((a) => a.type === "undo" && a.command === command)
          ? prev
          : [...prev, { type: "undo", command }],
      );

      setRedoStack((prevRedo) => [...prevRedo, command]);
      return prevUndo.slice(0, -1);
    });
  }, []);

  const redo = useCallback(async () => {
    setRedoStack((prevRedo) => {
      if (prevRedo.length === 0) return prevRedo;

      const command = prevRedo[prevRedo.length - 1];

      setPendingQueue((prev) =>
        prev.some((a) => a.type === "redo" && a.command === command)
          ? prev
          : [...prev, { type: "redo", command }],
      );

      setUndoStack((prevUndo) => {
        const newStack = [...prevUndo, command];
        return newStack.length > MAX_HISTORY_SIZE
          ? newStack.slice(1)
          : newStack;
      });

      return prevRedo.slice(0, -1);
    });
  }, []);

  const clear = useCallback(() => {
    setUndoStack([]);
    setRedoStack([]);
    setPendingQueue([]);
  }, []);

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

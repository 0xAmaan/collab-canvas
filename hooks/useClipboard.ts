/**
 * Custom hook for clipboard management (copy/paste shapes)
 * Uses React state instead of browser clipboard for simplicity
 */

import { useState, useCallback } from "react";
import type { Shape } from "@/types/shapes";

interface ClipboardData {
  shapes: Shape[];
  copiedAt: number;
}

export const useClipboard = () => {
  const [clipboardData, setClipboardData] = useState<ClipboardData | null>(
    null,
  );

  /**
   * Copy shapes to clipboard
   */
  const copy = useCallback((shapes: Shape[]) => {
    if (shapes.length === 0) return;

    setClipboardData({
      shapes: shapes.map((shape) => ({ ...shape })), // Clone to avoid mutations
      copiedAt: Date.now(),
    });
  }, []);

  /**
   * Get clipboard data for pasting
   */
  const getClipboard = useCallback((): Shape[] => {
    if (!clipboardData) return [];
    return clipboardData.shapes;
  }, [clipboardData]);

  /**
   * Check if clipboard has data
   */
  const hasData = clipboardData !== null && clipboardData.shapes.length > 0;

  /**
   * Clear clipboard
   */
  const clear = useCallback(() => {
    setClipboardData(null);
  }, []);

  return {
    copy,
    getClipboard,
    hasData,
    clear,
  };
};

"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "collab-canvas-recent-colors";
const MAX_RECENT_COLORS = 8;

export const useRecentColors = () => {
  const [recentColors, setRecentColors] = useState<string[]>([]);

  // Load recent colors from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecentColors(parsed.slice(0, MAX_RECENT_COLORS));
        }
      }
    } catch (error) {
      console.error("Failed to load recent colors:", error);
    }
  }, []);

  // Add a color to recent colors
  const addRecentColor = (color: string) => {
    setRecentColors((prev) => {
      // Normalize color (uppercase for consistency)
      const normalizedColor = color.toUpperCase();

      // Remove duplicates (case-insensitive comparison)
      const filtered = prev.filter((c) => c.toUpperCase() !== normalizedColor);

      // Add new color to the beginning
      const updated = [normalizedColor, ...filtered].slice(
        0,
        MAX_RECENT_COLORS,
      );

      // Save to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error("Failed to save recent colors:", error);
      }

      return updated;
    });
  };

  return {
    recentColors,
    addRecentColor,
  };
};

/**
 * Custom throttle hook for high-frequency updates
 * No external dependencies - pure React implementation
 */

import { useRef, useCallback, useEffect } from "react";

/**
 * Throttle a callback function to limit execution frequency
 * @param callback - Function to throttle
 * @param delay - Minimum delay between executions in milliseconds
 * @returns Throttled function
 */
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
): ((...args: Parameters<T>) => void) => {
  const lastRanRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastRan = now - lastRanRef.current;

      if (timeSinceLastRan >= delay) {
        // Enough time has passed, execute immediately
        callback(...args);
        lastRanRef.current = now;
      } else {
        // Clear any pending timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        // Schedule execution for later
        const remainingTime = delay - timeSinceLastRan;
        timeoutRef.current = setTimeout(() => {
          callback(...args);
          lastRanRef.current = Date.now();
          timeoutRef.current = null;
        }, remainingTime);
      }
    },
    [callback, delay],
  );
};

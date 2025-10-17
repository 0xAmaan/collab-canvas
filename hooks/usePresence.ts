/**
 * Custom hook for managing user presence and multiplayer cursors
 * Handles joining/leaving canvas and cursor position updates
 */

import { useEffect, useCallback, useRef, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useThrottle } from "./useThrottle";
import type { Presence } from "@/types/presence";

interface UsePresenceOptions {
  userId: string;
  userName: string;
  userColor: string;
  enabled?: boolean;
}

export function usePresence({
  userId,
  userName,
  userColor,
  enabled = true,
}: UsePresenceOptions) {
  const hasJoinedRef = useRef(false);
  const isRejoiningRef = useRef(false); // Track if we're in the middle of rejoining
  const isWindowVisibleRef = useRef(
    typeof document !== "undefined" ? !document.hidden : true,
  ); // Track window visibility (tab within browser)
  const isWindowFocusedRef = useRef(
    typeof document !== "undefined" ? document.hasFocus() : true,
  ); // Track window focus (entire browser window)
  const lastCursorPositionRef = useRef({ x: 0, y: 0 }); // Track last cursor position for rejoin
  const [isReady, setIsReady] = useState(false);

  // Convex queries and mutations
  const activeUsers = useQuery(
    api.presence.getActiveUsers,
    enabled ? {} : "skip",
  );
  const joinCanvas = useMutation(api.presence.joinCanvas);
  const leaveCanvas = useMutation(api.presence.leaveCanvas);
  const updatePresence = useMutation(api.presence.updatePresence);
  const heartbeat = useMutation(api.presence.heartbeat);

  // Helper to check if window is active (visible and focused)
  const isWindowActive = useCallback(() => {
    if (typeof document === "undefined") return true;
    return (
      !document.hidden &&
      isWindowVisibleRef.current &&
      isWindowFocusedRef.current
    );
  }, []);

  // Throttled cursor update (50ms)
  const throttledUpdatePresence = useThrottle(
    useCallback(
      (cursorX: number, cursorY: number) => {
        // Guard: Don't update if window is not active
        if (!isWindowActive()) {
          console.log(
            "[usePresence] Cursor update blocked - window not active",
          );
          return;
        }
        // Guard: Don't update if not enabled or haven't joined yet
        if (!enabled) {
          console.log("[usePresence] Cursor update blocked - not enabled");
          return;
        }
        if (isRejoiningRef.current) {
          console.log(
            "[usePresence] Cursor update blocked - rejoining in progress",
          );
          return;
        }
        if (!hasJoinedRef.current) {
          console.log(
            "[usePresence] Cursor update blocked - haven't joined yet. userId:",
            userId,
            "hasJoinedRef:",
            hasJoinedRef.current,
          );
          return;
        }
        // console.log("[usePresence] Sending cursor update for user:", userId);
        // Store last cursor position for potential rejoin
        lastCursorPositionRef.current = { x: cursorX, y: cursorY };
        updatePresence({ cursorX, cursorY }).catch((error) => {
          // If presence is gone, mark as not joined so visibility handler will rejoin
          if (error.message?.includes("Presence record not found")) {
            console.error(
              "[usePresence] Presence lost - will rejoin on next visibility change",
            );
            hasJoinedRef.current = false;
            setIsReady(false);
          }
        });
      },
      [updatePresence, enabled, userId],
    ),
    50, // 50ms throttle for cursor updates
  );

  // Join canvas on mount - only run when enabled changes or user info changes
  useEffect(() => {
    if (!enabled || hasJoinedRef.current) return;

    // Additional safety check: don't join if userId is invalid
    if (!userId || userId === "anonymous") {
      console.log("[usePresence] Skipping join - userId is invalid:", userId);
      return;
    }

    let mounted = true;

    const join = async () => {
      try {
        console.log(
          "[usePresence] Calling joinCanvas for user:",
          userName,
          userId,
        );
        await joinCanvas({
          userName,
          color: userColor,
        });
        if (mounted) {
          hasJoinedRef.current = true;
          setIsReady(true); // Trigger re-render so parent sees isReady = true
          console.log(
            "[usePresence] Successfully joined canvas for user:",
            userName,
          );

          // Send initial cursor position if we have one (for rejoins during same session)
          const lastPos = lastCursorPositionRef.current;
          if (lastPos.x !== 0 || lastPos.y !== 0) {
            console.log(
              "[usePresence] Sending last cursor position after initial join:",
              lastPos,
            );
            await updatePresence({
              cursorX: lastPos.x,
              cursorY: lastPos.y,
            });
          }
        }
      } catch (error) {
        console.error("[usePresence] Failed to join canvas:", error);
      }
    };

    join();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, userId, userName, userColor]);

  // Heartbeat mechanism - keep presence alive every 5 seconds
  // Only run when window is visible
  useEffect(() => {
    if (!enabled || !hasJoinedRef.current) return;

    console.log("[usePresence] Starting heartbeat interval for user:", userId);

    const checkAndRejoin = async () => {
      // Skip heartbeat if window is not active
      if (!isWindowActive()) {
        console.log("[usePresence] Heartbeat skipped - window not active");
        return;
      }

      console.log(
        "[usePresence] Heartbeat running for user:",
        userId,
        "at",
        new Date().toLocaleTimeString(),
      );
      try {
        await heartbeat();
        console.log("[usePresence] Heartbeat successful");
      } catch (error) {
        console.error("[usePresence] Heartbeat failed:", error);
        // Presence record was likely deleted (user was inactive too long)
        // Reset state and rejoin
        console.log("[usePresence] Rejoining canvas after failed heartbeat");
        isRejoiningRef.current = true;
        hasJoinedRef.current = false;
        setIsReady(false);

        // Attempt to rejoin
        try {
          await joinCanvas({
            userName,
            color: userColor,
          });
          hasJoinedRef.current = true;
          setIsReady(true);
          console.log("[usePresence] Successfully rejoined canvas");

          // Send last known cursor position after rejoining via heartbeat
          const lastPos = lastCursorPositionRef.current;
          if (lastPos.x !== 0 || lastPos.y !== 0) {
            console.log(
              "[usePresence] Sending last cursor position after heartbeat rejoin:",
              lastPos,
            );
            await updatePresence({
              cursorX: lastPos.x,
              cursorY: lastPos.y,
            });
          }
        } catch (rejoinError) {
          console.error("[usePresence] Failed to rejoin canvas:", rejoinError);
        } finally {
          isRejoiningRef.current = false;
        }
      }
    };

    const intervalId = setInterval(checkAndRejoin, 5000);

    return () => {
      console.log(
        "[usePresence] Clearing heartbeat interval for user:",
        userId,
      );
      clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, isReady, userName, userColor]);

  // Handle visibility changes - rejoin when tab becomes visible
  // Page Visibility API is more reliable than focus events for tab switches
  useEffect(() => {
    if (!enabled) return;

    console.log(
      "[usePresence] Setting up visibility change listener for user:",
      userId,
    );

    const handleVisibilityChange = async () => {
      const isVisible = !document.hidden;
      const hasFocus = document.hasFocus();
      isWindowVisibleRef.current = isVisible;
      isWindowFocusedRef.current = hasFocus;

      console.log(
        "[usePresence] Visibility changed:",
        isVisible ? "visible" : "hidden",
        "hasFocus:",
        hasFocus,
      );

      if (isVisible) {
        // Tab became visible - always try to rejoin
        console.log(
          "[usePresence] Tab became visible, rejoining to ensure presence...",
        );

        // Always rejoin when tab becomes visible to ensure presence record exists
        // joinCanvas is idempotent - it will either create or update the record
        // This fixes the issue where hasJoinedRef thinks we're joined but cron deleted us
        console.log("[usePresence] Rejoining on visibility change");
        isRejoiningRef.current = true;

        try {
          await joinCanvas({
            userName,
            color: userColor,
          });
          hasJoinedRef.current = true;
          setIsReady(true);
          console.log(
            "[usePresence] Rejoined successfully on visibility change",
          );

          // Send last known cursor position immediately after rejoining
          // This makes the cursor appear on other users' screens right away
          const lastPos = lastCursorPositionRef.current;
          if (lastPos.x !== 0 || lastPos.y !== 0) {
            console.log(
              "[usePresence] Sending last cursor position after rejoin:",
              lastPos,
            );
            await updatePresence({
              cursorX: lastPos.x,
              cursorY: lastPos.y,
            });
          }
        } catch (error) {
          console.error(
            "[usePresence] Failed to rejoin on visibility change:",
            error,
          );
        } finally {
          isRejoiningRef.current = false;
        }
      } else {
        // Tab became hidden
        console.log(
          "[usePresence] Tab became hidden - cursor updates will be blocked",
        );
      }
    };

    // Listen to visibility change events
    document.addEventListener("visibilitychange", handleVisibilityChange);
    console.log("[usePresence] Visibility change listener registered");

    // Also listen to window focus/blur for browser window switches
    // This catches cases where you switch between different browser windows
    const handleFocus = async () => {
      console.log("[usePresence] Window focus event fired");
      isWindowFocusedRef.current = true;
      // Treat focus the same as visibility change when becoming visible
      if (!document.hidden) {
        await handleVisibilityChange();
      }
    };

    const handleBlur = () => {
      console.log("[usePresence] Window blur event fired");
      isWindowFocusedRef.current = false;
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);
    console.log("[usePresence] Focus/Blur listeners registered");

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, userName, userColor]);

  // Leave canvas on unmount - only run cleanup on actual unmount (not hot reload)
  useEffect(() => {
    return () => {
      // Check if this is a real unmount (page close) vs hot reload
      // During hot reload, the module will be replaced but window persists
      if (hasJoinedRef.current && !window.location.href.includes("localhost")) {
        console.log("[usePresence] Component unmounting, leaving canvas");
        // Best effort cleanup
        leaveCanvas().catch((error) => {
          console.error("[usePresence] Failed to leave canvas:", error);
        });
        hasJoinedRef.current = false;
        setIsReady(false);
      } else if (hasJoinedRef.current) {
        console.log(
          "[usePresence] Unmount detected but keeping presence (likely hot reload)",
        );
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty array - only run on mount/unmount

  // Cleanup on page unload (best effort)
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = () => {
      if (hasJoinedRef.current) {
        console.log("[usePresence] Page unloading, leaving canvas");
        // Synchronous beacon API would be better, but Convex mutations are async
        // This is best effort - the cron job will clean up stale presence
        leaveCanvas().catch(() => {
          // Ignore errors during unload
        });
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]); // Only depend on enabled, not leaveCanvas

  // Performance optimization: Memoize user list filtering
  // Filter out current user from active users (for cursors)
  const otherUsers: Presence[] = useMemo(
    () => activeUsers?.filter((user) => user.userId !== userId) || [],
    [activeUsers, userId],
  );

  // All users including current user (for presence panel)
  const allUsers: Presence[] = useMemo(() => activeUsers || [], [activeUsers]);

  return {
    otherUsers,
    allUsers,
    updateCursorPosition: throttledUpdatePresence,
    isReady, // Use state instead of ref so changes trigger re-renders
  };
}

/**
 * Custom hook for managing user presence and multiplayer cursors
 * Handles joining/leaving canvas and cursor position updates
 */

import { useEffect, useCallback, useRef } from "react";
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

  // Convex queries and mutations
  const activeUsers = useQuery(
    api.presence.getActiveUsers,
    enabled ? {} : "skip",
  );
  const joinCanvas = useMutation(api.presence.joinCanvas);
  const leaveCanvas = useMutation(api.presence.leaveCanvas);
  const updatePresence = useMutation(api.presence.updatePresence);
  const heartbeat = useMutation(api.presence.heartbeat);

  // Throttled cursor update (50ms)
  const throttledUpdatePresence = useThrottle(
    useCallback(
      (cursorX: number, cursorY: number) => {
        if (!enabled || !hasJoinedRef.current) return;
        updatePresence({ cursorX, cursorY }).catch((error) => {
          console.error("Failed to update presence:", error);
        });
      },
      [updatePresence, enabled],
    ),
    50, // 50ms throttle for cursor updates
  );

  // Join canvas on mount
  useEffect(() => {
    if (!enabled || hasJoinedRef.current) return;

    // Additional safety check: don't join if userId is invalid
    if (!userId || userId === "anonymous") return;

    let mounted = true;

    const join = async () => {
      try {
        await joinCanvas({
          userName,
          color: userColor,
        });
        if (mounted) {
          hasJoinedRef.current = true;
        }
      } catch (error) {
        console.error("Failed to join canvas:", error);
      }
    };

    join();

    return () => {
      mounted = false;
    };
  }, [enabled, userId, userName, userColor, joinCanvas]);

  // Heartbeat mechanism - keep presence alive every 5 seconds
  useEffect(() => {
    if (!enabled || !hasJoinedRef.current) return;

    const intervalId = setInterval(() => {
      heartbeat().catch((error) => {
        console.error("Heartbeat failed:", error);
      });
    }, 5000); // 5 seconds

    return () => {
      clearInterval(intervalId);
    };
  }, [enabled, heartbeat]);

  // Leave canvas on unmount
  useEffect(() => {
    return () => {
      if (hasJoinedRef.current) {
        // Best effort cleanup
        leaveCanvas().catch((error) => {
          console.error("Failed to leave canvas:", error);
        });
        hasJoinedRef.current = false;
      }
    };
  }, [leaveCanvas]);

  // Cleanup on page unload (best effort)
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = () => {
      if (hasJoinedRef.current) {
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
  }, [enabled, leaveCanvas]);

  // Filter out current user from active users (for cursors)
  const otherUsers: Presence[] =
    activeUsers?.filter((user) => user.userId !== userId) || [];

  // All users including current user (for presence panel)
  const allUsers: Presence[] = activeUsers || [];

  return {
    otherUsers,
    allUsers,
    updateCursorPosition: throttledUpdatePresence,
    isReady: hasJoinedRef.current,
  };
}

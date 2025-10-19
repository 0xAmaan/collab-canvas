/**
 * PresencePanel component
 * Displays all active users in a Google Docs-style avatar panel
 * Optimized with React.memo and useMemo for better performance
 */

"use client";

import { UserAvatar } from "@/components/presence/UserAvatar";
import type { Presence } from "@/types/presence";
import { memo, useMemo } from "react";

interface PresencePanelProps {
  activeUsers: Presence[];
  currentUserId: string;
  maxVisible?: number;
}

const PresencePanelComponent = ({
  activeUsers,
  currentUserId,
  maxVisible = 5,
}: PresencePanelProps) => {
  // Memoize visible users calculation - exclude current user
  const { visibleUsers, remainingCount, totalOtherUsers } = useMemo(() => {
    // Filter out current user first
    const otherUsers = activeUsers.filter(
      (user) => user.userId !== currentUserId,
    );
    const visible = otherUsers.slice(0, maxVisible);
    const remaining = Math.max(0, otherUsers.length - maxVisible);
    return {
      visibleUsers: visible,
      remainingCount: remaining,
      totalOtherUsers: otherUsers.length,
    };
  }, [activeUsers, currentUserId, maxVisible]);

  // Don't render if no other users
  if (totalOtherUsers === 0) return null;

  return (
    <div
      className="flex items-center"
      title={`${totalOtherUsers} other user${totalOtherUsers === 1 ? "" : "s"} online`}
    >
      {/* Avatars with overlap, spread on hover */}
      <div className="group flex items-center -space-x-3 hover:space-x-1 transition-all duration-300">
        {visibleUsers.map((user) => (
          <div
            key={user.userId}
            className="relative transition-all duration-300"
          >
            <UserAvatar
              userName={user.userName}
              userColor={user.color}
              imageUrl={null} // Will be enhanced later with Clerk image
              isCurrentUser={false}
              size={32}
            />
          </div>
        ))}

        {/* Show "+N more" indicator if there are more users */}
        {remainingCount > 0 && (
          <div
            className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 text-white/70 text-xs font-medium border border-white/20 transition-all duration-300"
            title={`${remainingCount} more user${remainingCount > 1 ? "s" : ""}`}
          >
            +{remainingCount}
          </div>
        )}
      </div>
    </div>
  );
};

// Memoize component to prevent re-renders when unrelated state changes
export const PresencePanel = memo(
  PresencePanelComponent,
  (prevProps, nextProps) => {
    // Only re-render if active users list or currentUserId changes
    return (
      prevProps.activeUsers.length === nextProps.activeUsers.length &&
      prevProps.currentUserId === nextProps.currentUserId &&
      prevProps.maxVisible === nextProps.maxVisible &&
      prevProps.activeUsers.every((user, index) => {
        const nextUser = nextProps.activeUsers[index];
        return nextUser && user.userId === nextUser.userId;
      })
    );
  },
);

/**
 * PresencePanel component
 * Displays all active users in a Google Docs-style avatar panel
 * Optimized with React.memo and useMemo for better performance
 */

"use client";

import { memo, useMemo } from "react";
import { UserAvatar } from "./UserAvatar";
import type { Presence } from "@/types/presence";

interface PresencePanelProps {
  activeUsers: Presence[];
  currentUserId: string;
  maxVisible?: number;
}

function PresencePanelComponent({
  activeUsers,
  currentUserId,
  maxVisible = 8,
}: PresencePanelProps) {
  // Memoize visible users calculation
  const { visibleUsers, remainingCount } = useMemo(() => {
    const visible = activeUsers.slice(0, maxVisible);
    const remaining = Math.max(0, activeUsers.length - maxVisible);
    return { visibleUsers: visible, remainingCount: remaining };
  }, [activeUsers, maxVisible]);

  return (
    <div
      className="flex items-center gap-2"
      title={`${activeUsers.length} users online`}
    >
      {/* User count badge */}
      <div className="flex items-center gap-2 pr-2 border-r border-white/10">
        <div className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </div>
        <span className="text-xs text-white/70 font-medium">
          {activeUsers.length} {activeUsers.length === 1 ? "user" : "users"}
        </span>
      </div>

      {/* Avatars with slight overlap */}
      <div className="flex items-center -space-x-2">
        {visibleUsers.map((user) => (
          <div key={user.userId} className="relative">
            <UserAvatar
              userName={user.userName}
              userColor={user.color}
              imageUrl={null} // Will be enhanced later with Clerk image
              isCurrentUser={user.userId === currentUserId}
              size={32}
            />
          </div>
        ))}
      </div>

      {/* Show "+N more" indicator if there are more users */}
      {remainingCount > 0 && (
        <div
          className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 text-white/70 text-xs font-medium border border-white/20"
          title={`${remainingCount} more user${remainingCount > 1 ? "s" : ""}`}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
}

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

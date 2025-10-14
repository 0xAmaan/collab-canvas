/**
 * PresencePanel component
 * Displays all active users in a Google Docs-style avatar panel
 */

"use client";

import { UserAvatar } from "./UserAvatar";
import type { Presence } from "@/types/presence";

interface PresencePanelProps {
  activeUsers: Presence[];
  currentUserId: string;
  maxVisible?: number;
}

export function PresencePanel({
  activeUsers,
  currentUserId,
  maxVisible = 8,
}: PresencePanelProps) {
  const visibleUsers = activeUsers.slice(0, maxVisible);
  const remainingCount = Math.max(0, activeUsers.length - maxVisible);

  return (
    <div
      className="flex items-center gap-1"
      title={`${activeUsers.length} users online`}
    >
      {/* Avatars with slight overlap */}
      <div className="flex items-center -space-x-2">
        {visibleUsers.map((user) => (
          <div key={user.userId} className="relative">
            <UserAvatar
              userName={user.userName}
              userColor={user.color}
              imageUrl={null} // Will be enhanced later with Clerk image
              isCurrentUser={user.userId === currentUserId}
              size={36}
            />
          </div>
        ))}
      </div>

      {/* Show "+N more" indicator if there are more users */}
      {remainingCount > 0 && (
        <div
          className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-200 text-gray-700 text-xs font-medium ml-1"
          title={`${remainingCount} more user${remainingCount > 1 ? "s" : ""}`}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
}

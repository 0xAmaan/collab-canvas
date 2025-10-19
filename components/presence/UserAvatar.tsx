/**
 * UserAvatar component for presence panel
 * Shows user avatar with online status badge
 */

"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";

interface UserAvatarProps {
  userName: string;
  userColor: string;
  imageUrl?: string | null;
  isCurrentUser?: boolean;
  size?: number;
}

export const UserAvatar = ({
  userName,
  userColor,
  imageUrl,
  isCurrentUser = false,
  size = 40,
}: UserAvatarProps) => {
  const [showTooltip, setShowTooltip] = useState(false);
  // Get first letter of username for fallback
  const initial = userName.charAt(0) || "U";

  return (
    <div
      className="relative inline-block group"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <Avatar
        src={imageUrl}
        alt={userName}
        fallback={initial}
        size={size}
        backgroundColor={userColor}
        isCurrentUser={isCurrentUser}
      />
      <Badge variant="online" />

      {/* Custom tooltip with fast appearance */}
      {showTooltip && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-slate-900 text-white text-xs font-medium rounded shadow-lg whitespace-nowrap z-50 pointer-events-none animate-in fade-in duration-100">
          {userName}
          {/* Tooltip arrow */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 -mb-px">
            <div className="border-4 border-transparent border-b-slate-900"></div>
          </div>
        </div>
      )}
    </div>
  );
};

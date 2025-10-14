/**
 * UserAvatar component for presence panel
 * Shows user avatar with online status badge
 */

import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";

interface UserAvatarProps {
  userName: string;
  userColor: string;
  imageUrl?: string | null;
  isCurrentUser?: boolean;
  size?: number;
}

export function UserAvatar({
  userName,
  userColor,
  imageUrl,
  isCurrentUser = false,
  size = 40,
}: UserAvatarProps) {
  // Get first letter of username for fallback
  const initial = userName.charAt(0) || "U";

  return (
    <div className="relative inline-block" title={userName}>
      <Avatar
        src={imageUrl}
        alt={userName}
        fallback={initial}
        size={size}
        backgroundColor={userColor}
        isCurrentUser={isCurrentUser}
      />
      <Badge variant="online" />
    </div>
  );
}

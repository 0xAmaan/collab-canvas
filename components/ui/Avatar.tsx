/**
 * Reusable Avatar component
 * Displays user avatar image or fallback to initials
 */

import Image from "next/image";

interface AvatarProps {
  src?: string | null;
  alt: string;
  fallback: string; // First letter or initials
  size?: number;
  backgroundColor?: string;
  isCurrentUser?: boolean;
}

export function Avatar({
  src,
  alt,
  fallback,
  size = 40,
  backgroundColor = "#3b82f6",
  isCurrentUser = false,
}: AvatarProps) {
  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full overflow-hidden ${
        isCurrentUser ? "ring-2 ring-gray-700 ring-offset-2" : ""
      }`}
      style={{
        width: size,
        height: size,
        backgroundColor: src ? "transparent" : backgroundColor,
      }}
      title={alt}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          width={size}
          height={size}
          className="object-cover"
        />
      ) : (
        <span
          className="text-white font-semibold select-none"
          style={{ fontSize: size * 0.45 }}
        >
          {fallback.toUpperCase()}
        </span>
      )}
    </div>
  );
}

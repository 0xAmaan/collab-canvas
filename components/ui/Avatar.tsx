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
      className={`relative inline-flex items-center justify-center rounded-full overflow-hidden border-2 transition-all ${
        isCurrentUser
          ? "ring-2 ring-blue-500/50 border-blue-400 shadow-lg shadow-blue-500/30"
          : "border-white/20 shadow-md"
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
          className="text-white font-bold select-none"
          style={{ fontSize: size * 0.45 }}
        >
          {fallback.toUpperCase()}
        </span>
      )}
    </div>
  );
}

/**
 * MultiplayerCursor component
 * Renders a remote user's cursor with their name and color
 * Memoized to prevent unnecessary re-renders
 */

import { memo, useMemo } from "react";
import type { Canvas as FabricCanvas } from "fabric";
import type { Presence } from "@/types/presence";

interface MultiplayerCursorProps {
  user: Presence;
  canvas: FabricCanvas | null;
}

function MultiplayerCursorComponent({ user, canvas }: MultiplayerCursorProps) {
  // Memoize position calculations
  const { screenX, screenY, isVisible } = useMemo(() => {
    if (!canvas) return { screenX: 0, screenY: 0, isVisible: false };

    // Transform cursor position from canvas coordinates to screen coordinates
    const vpt = canvas.viewportTransform || [1, 0, 0, 1, 0, 0];
    const x = user.cursorX * vpt[0] + vpt[4];
    const y = user.cursorY * vpt[3] + vpt[5];

    // Check if cursor is within visible viewport
    const canvasWidth = canvas.getWidth();
    const canvasHeight = canvas.getHeight();
    const visible =
      x >= -50 && x <= canvasWidth + 50 && y >= -50 && y <= canvasHeight + 50;

    return { screenX: x, screenY: y, isVisible: visible };
  }, [canvas, user.cursorX, user.cursorY]);

  if (!isVisible) return null;

  return (
    <div
      className="absolute pointer-events-none transition-all duration-100 ease-out z-50"
      style={{
        left: `${screenX}px`,
        top: `${screenY}px`,
        transform: "translate(-2px, -2px)",
      }}
    >
      {/* Cursor SVG */}
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-md"
      >
        <path
          d="M5.5 3.21V20.8L12.5 13.8L15.5 20.8L17.5 19.8L14.5 12.8L21.5 11.8L5.5 3.21Z"
          fill={user.color}
          stroke="white"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>

      {/* User name label */}
      <div
        className="absolute top-5 left-5 px-2 py-1 rounded text-white text-xs font-medium whitespace-nowrap shadow-lg"
        style={{
          backgroundColor: user.color,
        }}
      >
        {user.userName}
      </div>
    </div>
  );
}

// Memoize the component to prevent re-renders when other cursors update
export const MultiplayerCursor = memo(
  MultiplayerCursorComponent,
  (prevProps, nextProps) => {
    // Only re-render if user position/color changes or canvas viewport changes
    return (
      prevProps.user.cursorX === nextProps.user.cursorX &&
      prevProps.user.cursorY === nextProps.user.cursorY &&
      prevProps.user.color === nextProps.user.color &&
      prevProps.user.userName === nextProps.user.userName &&
      prevProps.canvas === nextProps.canvas
    );
  },
);

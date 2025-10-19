/**
 * MultiplayerCursor component
 * Renders a remote user's cursor with their name and color
 * Positioned in canvas coordinates - parent container applies viewport transform
 */

import { memo } from "react";
import type { Presence } from "@/types/presence";

interface MultiplayerCursorProps {
  user: Presence;
  zoom: number;
}

const MultiplayerCursorComponent = ({ user, zoom }: MultiplayerCursorProps) => {
  // Scale cursor inversely to zoom to maintain constant screen size
  const inverseScale = 1 / zoom;

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: `${user.cursorX}px`,
        top: `${user.cursorY}px`,
        transform: `scale(${inverseScale})`,
        transformOrigin: "0 0",
      }}
    >
      {/* Cursor icon - using the select tool icon from toolbar */}
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
        }}
      >
        <path
          d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"
          fill={user.color}
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* User name label - compact and connected */}
      <div
        className="absolute top-4 left-4 px-2 py-0.5 rounded text-white text-[11px] font-semibold whitespace-nowrap"
        style={{
          backgroundColor: user.color,
          boxShadow:
            "0 2px 4px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.2)",
        }}
      >
        {user.userName}
      </div>
    </div>
  );
};

// Memoize the component to prevent re-renders when other cursors update
export const MultiplayerCursor = memo(
  MultiplayerCursorComponent,
  (prevProps, nextProps) => {
    // Only re-render if user position/color/name or zoom changes
    return (
      prevProps.user.cursorX === nextProps.user.cursorX &&
      prevProps.user.cursorY === nextProps.user.cursorY &&
      prevProps.user.color === nextProps.user.color &&
      prevProps.user.userName === nextProps.user.userName &&
      prevProps.zoom === nextProps.zoom
    );
  },
);

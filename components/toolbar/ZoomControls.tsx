"use client";

/**
 * Zoom control UI component
 * Provides buttons for zoom in, zoom out, and reset
 * Memoized to prevent re-renders when unrelated dashboard state changes
 */

import { useState, useEffect, memo } from "react";
import type { Canvas as FabricCanvas } from "fabric";
import { useViewport } from "@/hooks/useViewport";

interface ZoomControlsProps {
  canvas: FabricCanvas | null;
}

function ZoomControlsComponent({ canvas }: ZoomControlsProps) {
  const [isMounted, setIsMounted] = useState(false);
  const {
    viewport,
    zoomIn,
    zoomOut,
    resetZoom,
    zoomPercentage,
    canZoomIn,
    canZoomOut,
  } = useViewport(canvas);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Don't render zoom percentage until mounted to avoid hydration mismatch
  if (!isMounted) {
    return (
      <div className="flex items-center gap-1.5">
        <button
          disabled
          className="w-8 h-8 flex items-center justify-center rounded-lg disabled:opacity-40 disabled:cursor-not-allowed text-white/70"
          title="Zoom Out (10%)"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path d="M6.75 8.25a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5z" />
            <path
              fillRule="evenodd"
              d="M9 2a7 7 0 104.391 12.452l3.329 3.328a.75.75 0 101.06-1.06l-3.328-3.329A7 7 0 009 2zM3.5 9a5.5 5.5 0 1111 0 5.5 5.5 0 01-11 0z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        <div className="min-w-[60px] px-2 py-1 text-sm font-medium text-white/70 text-center">
          100%
        </div>
        <button
          disabled
          className="w-8 h-8 flex items-center justify-center rounded-lg disabled:opacity-40 disabled:cursor-not-allowed text-white/70"
          title="Zoom In (10%)"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path d="M9 6a.75.75 0 01.75.75v1.5h1.5a.75.75 0 010 1.5h-1.5v1.5a.75.75 0 01-1.5 0v-1.5h-1.5a.75.75 0 010-1.5h1.5v-1.5A.75.75 0 019 6z" />
            <path
              fillRule="evenodd"
              d="M9 2a7 7 0 104.391 12.452l3.329 3.328a.75.75 0 101.06-1.06l-3.328-3.329A7 7 0 009 2zM3.5 9a5.5 5.5 0 1111 0 5.5 5.5 0 01-11 0z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      {/* Zoom Out Button */}
      <button
        onClick={zoomOut}
        disabled={!canZoomOut || !canvas}
        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-white/70 hover:text-white cursor-pointer"
        title="Zoom Out (10%)"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="w-5 h-5"
        >
          <path d="M6.75 8.25a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5z" />
          <path
            fillRule="evenodd"
            d="M9 2a7 7 0 104.391 12.452l3.329 3.328a.75.75 0 101.06-1.06l-3.328-3.329A7 7 0 009 2zM3.5 9a5.5 5.5 0 1111 0 5.5 5.5 0 01-11 0z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* Zoom Percentage Display */}
      <button
        onClick={resetZoom}
        className="min-w-[60px] px-2 py-1 text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-center cursor-pointer"
        title="Reset to 100%"
      >
        {zoomPercentage}
      </button>

      {/* Zoom In Button */}
      <button
        onClick={zoomIn}
        disabled={!canZoomIn || !canvas}
        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-white/70 hover:text-white cursor-pointer"
        title="Zoom In (10%)"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="w-5 h-5"
        >
          <path d="M9 6a.75.75 0 01.75.75v1.5h1.5a.75.75 0 010 1.5h-1.5v1.5a.75.75 0 01-1.5 0v-1.5h-1.5a.75.75 0 010-1.5h1.5v-1.5A.75.75 0 019 6z" />
          <path
            fillRule="evenodd"
            d="M9 2a7 7 0 104.391 12.452l3.329 3.328a.75.75 0 101.06-1.06l-3.328-3.329A7 7 0 009 2zM3.5 9a5.5 5.5 0 1111 0 5.5 5.5 0 01-11 0z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  );
}

// Memoize component to prevent re-renders when canvas reference hasn't changed
export const ZoomControls = memo(
  ZoomControlsComponent,
  (prevProps, nextProps) => {
    // Only re-render if canvas reference changes
    return prevProps.canvas === nextProps.canvas;
  },
);

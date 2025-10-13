"use client";

/**
 * Zoom control UI component
 * Provides buttons for zoom in, zoom out, and reset
 */

import type { Canvas as FabricCanvas } from "fabric";
import { useViewport } from "@/hooks/useViewport";

interface ZoomControlsProps {
  canvas: FabricCanvas | null;
}

export function ZoomControls({ canvas }: ZoomControlsProps) {
  const {
    viewport,
    zoomIn,
    zoomOut,
    resetZoom,
    zoomPercentage,
    canZoomIn,
    canZoomOut,
  } = useViewport(canvas);

  return (
    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
      {/* Zoom Out Button */}
      <button
        onClick={zoomOut}
        disabled={!canZoomOut || !canvas}
        className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
        className="min-w-[60px] px-2 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded transition-colors"
        title="Reset to 100%"
      >
        {zoomPercentage}
      </button>

      {/* Zoom In Button */}
      <button
        onClick={zoomIn}
        disabled={!canZoomIn || !canvas}
        className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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

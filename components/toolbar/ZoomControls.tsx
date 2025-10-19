"use client";

/**
 * Zoom control UI component
 * Provides buttons for zoom in, zoom out, and reset
 * Memoized to prevent re-renders when unrelated dashboard state changes
 */

import { useState, useEffect, memo } from "react";
import type { Canvas as FabricCanvas } from "fabric";
import { ZoomOut, ZoomIn } from "lucide-react";
import { useViewport } from "@/hooks/useViewport";

interface ZoomControlsProps {
  canvas: FabricCanvas | null;
}

const ZoomControlsComponent = ({ canvas }: ZoomControlsProps) => {
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
          <ZoomOut className="w-5 h-5" />
        </button>
        <div className="min-w-[60px] px-2 py-1 text-sm font-medium text-white/70 text-center">
          100%
        </div>
        <button
          disabled
          className="w-8 h-8 flex items-center justify-center rounded-lg disabled:opacity-40 disabled:cursor-not-allowed text-white/70"
          title="Zoom In (10%)"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 pb-5">
      {/* Zoom Out Button */}
      <button
        onClick={zoomOut}
        disabled={!canZoomOut || !canvas}
        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-white/70 hover:text-white cursor-pointer"
        title="Zoom Out (10%)"
      >
        <ZoomOut className="w-5 h-5" />
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
        <ZoomIn className="w-5 h-5" />
      </button>
    </div>
  );
};

// Memoize component to prevent re-renders when canvas reference hasn't changed
export const ZoomControls = memo(
  ZoomControlsComponent,
  (prevProps, nextProps) => {
    // Only re-render if canvas reference changes
    return prevProps.canvas === nextProps.canvas;
  },
);

/**
 * Custom hook for managing canvas viewport state (pan/zoom)
 * Persists viewport state to localStorage
 */

import { useState, useEffect, useCallback } from "react";
import type { Canvas as FabricCanvas } from "fabric";
import { ZOOM, VIEWPORT_STORAGE_KEY } from "@/constants/shapes";
import {
  clampZoom,
  parseStoredViewport,
  serializeViewport,
  formatZoomPercentage,
  calculateHighestDensityPoint,
} from "@/lib/viewport-utils";
import { getZoom, zoomToPoint, setViewportTransform } from "@/lib/canvas-utils";
import type { ViewportState, Point } from "@/types/viewport";
import type { Shape } from "@/types/shapes";

export const useViewport = (canvas: FabricCanvas | null) => {
  const [viewport, setViewport] = useState<ViewportState>(() => {
    // Initialize from localStorage on mount
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(VIEWPORT_STORAGE_KEY);
      const parsed = parseStoredViewport(stored);
      if (parsed) {
        return parsed;
      }
    }
    return {
      zoom: ZOOM.DEFAULT,
      panX: 0,
      panY: 0,
    };
  });

  // Update viewport state from canvas transform
  const updateViewportFromCanvas = useCallback(() => {
    if (!canvas) return;

    const vpt = canvas.viewportTransform || [1, 0, 0, 1, 0, 0];
    const newViewport = {
      zoom: getZoom(canvas),
      panX: vpt[4],
      panY: vpt[5],
    };

    // Only update if values actually changed to prevent infinite loops
    setViewport((prev) => {
      if (
        prev.zoom !== newViewport.zoom ||
        prev.panX !== newViewport.panX ||
        prev.panY !== newViewport.panY
      ) {
        return newViewport;
      }
      return prev;
    });
  }, [canvas]);

  // Apply initial viewport to canvas when it becomes available (only once)
  useEffect(() => {
    if (!canvas) return;

    // Apply the current viewport state to the canvas
    const vpt = canvas.viewportTransform || [1, 0, 0, 1, 0, 0];
    vpt[0] = viewport.zoom;
    vpt[3] = viewport.zoom;
    vpt[4] = viewport.panX;
    vpt[5] = viewport.panY;
    setViewportTransform(canvas, vpt);

    // Listen for mouse:wheel events to update viewport state
    const handleMouseWheel = () => {
      // Small delay to ensure Fabric.js has updated the transform
      setTimeout(() => {
        const vpt = canvas.viewportTransform || [1, 0, 0, 1, 0, 0];
        const newViewport = {
          zoom: getZoom(canvas),
          panX: vpt[4],
          panY: vpt[5],
        };

        // Only update if values actually changed to prevent infinite loops
        setViewport((prev) => {
          if (
            prev.zoom !== newViewport.zoom ||
            prev.panX !== newViewport.panX ||
            prev.panY !== newViewport.panY
          ) {
            return newViewport;
          }
          return prev;
        });
      }, 0);
    };

    canvas.on("mouse:wheel", handleMouseWheel);

    return () => {
      canvas.off("mouse:wheel", handleMouseWheel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvas]);

  // Persist viewport to localStorage whenever it changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(VIEWPORT_STORAGE_KEY, serializeViewport(viewport));
  }, [viewport]);

  // Zoom in
  const zoomIn = useCallback(() => {
    if (!canvas) return;

    const currentZoom = getZoom(canvas);
    const newZoom = clampZoom(currentZoom + ZOOM.STEP);

    // Zoom toward center of viewport
    const center: Point = {
      x: canvas.getWidth() / 2,
      y: canvas.getHeight() / 2,
    };

    zoomToPoint(canvas, center, newZoom);
    updateViewportFromCanvas();
  }, [canvas, updateViewportFromCanvas]);

  // Zoom out
  const zoomOut = useCallback(() => {
    if (!canvas) return;

    const currentZoom = getZoom(canvas);
    const newZoom = clampZoom(currentZoom - ZOOM.STEP);

    // Zoom toward center of viewport
    const center: Point = {
      x: canvas.getWidth() / 2,
      y: canvas.getHeight() / 2,
    };

    zoomToPoint(canvas, center, newZoom);
    updateViewportFromCanvas();
  }, [canvas, updateViewportFromCanvas]);

  // Reset zoom to 100%
  const resetZoom = useCallback(() => {
    if (!canvas) return;

    const center: Point = {
      x: canvas.getWidth() / 2,
      y: canvas.getHeight() / 2,
    };

    zoomToPoint(canvas, center, ZOOM.DEFAULT);
    updateViewportFromCanvas();
  }, [canvas, updateViewportFromCanvas]);

  // Focus on the area with highest density of shapes
  const focusOnDensity = useCallback(
    (shapes: Shape[]) => {
      if (!canvas) return;

      // Calculate the highest density point
      const densityPoint = calculateHighestDensityPoint(shapes);

      // Get current viewport transform
      const vpt = canvas.viewportTransform || [1, 0, 0, 1, 0, 0];
      const currentZoom = vpt[0]; // Keep current zoom level

      // Calculate viewport center
      const viewportCenterX = canvas.getWidth() / 2;
      const viewportCenterY = canvas.getHeight() / 2;

      // Calculate new pan values to center the density point
      // The formula: panX = viewportCenter - (canvasPoint * zoom)
      const newPanX = viewportCenterX - densityPoint.x * currentZoom;
      const newPanY = viewportCenterY - densityPoint.y * currentZoom;

      // Update viewport transform with new pan values (keeping zoom)
      vpt[4] = newPanX;
      vpt[5] = newPanY;

      setViewportTransform(canvas, vpt);
      updateViewportFromCanvas();
    },
    [canvas, updateViewportFromCanvas],
  );

  // Get formatted zoom percentage
  const zoomPercentage = formatZoomPercentage(viewport.zoom);

  return {
    viewport,
    zoomIn,
    zoomOut,
    resetZoom,
    focusOnDensity,
    zoomPercentage,
    canZoomIn: viewport.zoom < ZOOM.MAX,
    canZoomOut: viewport.zoom > ZOOM.MIN,
  };
};

/**
 * SelectionBox utility - handles visual selection feedback
 * Works with Fabric.js selection system
 */

import { FabricObject } from "fabric";
import { SELECTION_COLORS } from "@/constants/colors";

/**
 * Configure global selection styling for the canvas
 * This should be called once when the canvas is initialized
 */
export function configureSelectionStyle() {
  return {
    selectionColor: SELECTION_COLORS.BACKGROUND,
    selectionBorderColor: SELECTION_COLORS.BORDER,
    selectionLineWidth: 2,
    selectionDashArray: [5, 5],
  };
}

/**
 * Show selection indicators on an object
 */
export function showSelection(obj: FabricObject): void {
  obj.set({
    hasControls: true,
    hasBorders: true,
    borderColor: SELECTION_COLORS.BORDER,
    cornerColor: SELECTION_COLORS.HANDLE,
    cornerStrokeColor: SELECTION_COLORS.HANDLE_BORDER,
    cornerSize: 8,
    transparentCorners: false,
    borderScaleFactor: 2,
    lockRotation: true, // Lock rotation for MVP (rectangles only)
    lockScalingX: true, // Lock scaling for MVP
    lockScalingY: true,
  });
}

/**
 * Hide selection indicators from an object
 */
export function hideSelection(obj: FabricObject): void {
  obj.set({
    hasControls: false,
    hasBorders: true,
    borderColor: "transparent",
  });
}

/**
 * Check if an object is currently selected
 */
export function isSelected(obj: FabricObject): boolean {
  return obj.hasControls === true;
}

/**
 * Draw custom selection handles (for future enhancements)
 */
export function drawCustomHandles(
  ctx: CanvasRenderingContext2D,
  left: number,
  top: number,
  width: number,
  height: number,
): void {
  const handleSize = 8;
  const halfHandle = handleSize / 2;

  // Set handle style
  ctx.fillStyle = SELECTION_COLORS.HANDLE;
  ctx.strokeStyle = SELECTION_COLORS.HANDLE_BORDER;
  ctx.lineWidth = 2;

  // Corner positions
  const corners = [
    { x: left, y: top }, // Top-left
    { x: left + width, y: top }, // Top-right
    { x: left + width, y: top + height }, // Bottom-right
    { x: left, y: top + height }, // Bottom-left
  ];

  // Draw handles at each corner
  corners.forEach(({ x, y }) => {
    ctx.fillRect(x - halfHandle, y - halfHandle, handleSize, handleSize);
    ctx.strokeRect(x - halfHandle, y - halfHandle, handleSize, handleSize);
  });
}

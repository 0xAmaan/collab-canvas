/**
 * SelectionBox utility - handles visual selection feedback
 * Works with Fabric.js selection system
 */

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

/**
 * Export utilities for canvas and individual objects
 * Supports PNG and SVG export formats
 */

import type { Canvas as FabricCanvas, FabricObject } from "fabric";

/**
 * Triggers a browser download for a data URL
 */
const downloadFile = (dataURL: string, filename: string): void => {
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataURL;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Exports a single Fabric.js object as PNG
 */
export const exportObjectAsPNG = (
  obj: FabricObject,
  filename: string,
): void => {
  try {
    const dataURL = obj.toDataURL({
      format: "png",
      quality: 1,
      multiplier: 2, // 2x resolution for better quality
    });
    downloadFile(dataURL, filename);
  } catch (error) {
    console.error("Failed to export object as PNG:", error);
    throw new Error("Failed to export object as PNG");
  }
};

/**
 * Exports a single Fabric.js object as SVG
 */
export const exportObjectAsSVG = (
  obj: FabricObject,
  filename: string,
): void => {
  try {
    // Get object bounds for proper SVG dimensions
    const bounds = obj.getBoundingRect();
    const svgMarkup = obj.toSVG();

    // Create a complete SVG with proper XML declaration and viewBox
    const completeSVG = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg width="${bounds.width}" height="${bounds.height}" 
     viewBox="0 0 ${bounds.width} ${bounds.height}" 
     xmlns="http://www.w3.org/2000/svg" 
     xmlns:xlink="http://www.w3.org/1999/xlink">
  <g transform="translate(${-bounds.left}, ${-bounds.top})">
    ${svgMarkup}
  </g>
</svg>`;

    const blob = new Blob([completeSVG], {
      type: "image/svg+xml;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    downloadFile(url, filename);
    // Clean up the object URL after download
    setTimeout(() => URL.revokeObjectURL(url), 100);
  } catch (error) {
    console.error("Failed to export object as SVG:", error);
    throw new Error("Failed to export object as SVG");
  }
};

/**
 * Exports the entire canvas as PNG
 */
export const exportCanvasAsPNG = (
  canvas: FabricCanvas,
  filename: string,
): void => {
  try {
    const dataURL = canvas.toDataURL({
      format: "png",
      quality: 1,
      multiplier: 2, // 2x resolution for better quality
    });
    downloadFile(dataURL, filename);
  } catch (error) {
    console.error("Failed to export canvas as PNG:", error);
    throw new Error("Failed to export canvas as PNG");
  }
};

/**
 * Generates a timestamp-based filename
 */
export const generateTimestampFilename = (
  prefix: string,
  ext: string,
): string => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
  return `${prefix}-${timestamp}.${ext}`;
};

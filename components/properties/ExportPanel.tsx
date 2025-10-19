"use client";

/**
 * Export Panel Component
 * Allows exporting selected objects as PNG or SVG
 */

import { Download, FileImage } from "lucide-react";
import { PropertySection } from "@/components/ui/PropertySection";
import type { Canvas as FabricCanvas } from "fabric";
import type { Shape } from "@/types/shapes";
import {
  exportObjectAsPNG,
  exportObjectAsSVG,
} from "@/lib/canvas/export-utils";

interface ExportPanelProps {
  canvas: FabricCanvas | null;
  shapes: Shape[];
  selectedShapeIds: string[];
}

export const ExportPanel = ({
  canvas,
  shapes,
  selectedShapeIds,
}: ExportPanelProps) => {
  const selectedShapes = shapes.filter((s) => selectedShapeIds.includes(s._id));

  if (selectedShapes.length === 0 || !canvas) return null;

  const handleExportPNG = () => {
    try {
      const activeObjects = canvas.getActiveObjects();

      if (activeObjects.length === 0) {
        console.warn("No active objects to export");
        return;
      }

      // Export each selected object separately
      activeObjects.forEach((obj, index) => {
        const shape = selectedShapes[index];
        const filename =
          activeObjects.length === 1
            ? `${shape?.type || "shape"}.png`
            : `shape-${index + 1}.png`;
        exportObjectAsPNG(obj, filename);
      });
    } catch (error) {
      console.error("Failed to export PNG:", error);
    }
  };

  const handleExportSVG = () => {
    try {
      const activeObjects = canvas.getActiveObjects();

      if (activeObjects.length === 0) {
        console.warn("No active objects to export");
        return;
      }

      // Export each selected object separately
      activeObjects.forEach((obj, index) => {
        const shape = selectedShapes[index];
        const filename =
          activeObjects.length === 1
            ? `${shape?.type || "shape"}.svg`
            : `shape-${index + 1}.svg`;
        exportObjectAsSVG(obj, filename);
      });
    } catch (error) {
      console.error("Failed to export SVG:", error);
    }
  };

  return (
    <PropertySection title="Export" divider>
      <div className="flex gap-2">
        {/* Export as PNG */}
        <button
          onClick={handleExportPNG}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg text-white/70 hover:text-white transition-colors"
          title="Export as PNG"
        >
          <Download className="w-4 h-4" />
          <span className="text-sm font-medium">PNG</span>
        </button>

        {/* Export as SVG */}
        <button
          onClick={handleExportSVG}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg text-white/70 hover:text-white transition-colors"
          title="Export as SVG"
        >
          <FileImage className="w-4 h-4" />
          <span className="text-sm font-medium">SVG</span>
        </button>
      </div>

      {selectedShapes.length > 1 && (
        <p className="text-xs text-white/40 mt-2">
          {selectedShapes.length} objects will be exported separately
        </p>
      )}
    </PropertySection>
  );
};

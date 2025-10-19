"use client";

/**
 * Style Panel Component
 * Controls for fill color, stroke color, stroke width, and opacity
 */

import { useState, useRef, useCallback } from "react";
import type { Canvas as FabricCanvas } from "fabric";
import { PropertySection } from "@/components/ui/PropertySection";
import { EnhancedColorPicker } from "@/components/ui/EnhancedColorPicker";
import { useRecentColors } from "@/hooks/useRecentColors";
import type { Shape } from "@/types/shapes";

interface StylePanelProps {
  canvas: FabricCanvas | null;
  shapes: Shape[];
  selectedShapeIds: string[];
  onUpdate: (shapeId: string, updates: Partial<Shape>) => Promise<void>;
}

export const StylePanel = ({
  canvas,
  shapes,
  selectedShapeIds,
  onUpdate,
}: StylePanelProps) => {
  const [showFillPicker, setShowFillPicker] = useState(false);
  const [pickerPosition, setPickerPosition] = useState({ top: 0, right: 0 });
  const [localFillColor, setLocalFillColor] = useState<string | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const rafIdRef = useRef<number | null>(null);
  const pendingColorRef = useRef<string | null>(null);
  const { recentColors, addRecentColor } = useRecentColors();

  const selectedShapes = shapes.filter((s) => selectedShapeIds.includes(s._id));

  if (selectedShapes.length === 0) return null;

  const firstShape = selectedShapes[0];
  const dbFillColor = firstShape.fill;
  // Show local color if we're actively picking, otherwise show DB color
  const fillColor = localFillColor ?? dbFillColor;

  // Check if values are mixed (use DB color for comparison)
  const isMixedFill = selectedShapes.some((s) => s.fill !== dbFillColor);

  // Update Fabric.js canvas immediately for instant visual feedback (no DB write)
  const updateCanvasColor = useCallback(
    (color: string) => {
      if (!canvas) return;

      const objects = canvas.getObjects();
      selectedShapeIds.forEach((shapeId) => {
        const fabricObj = objects.find((obj) => {
          const data = obj.get("data") as { shapeId?: string } | undefined;
          return data?.shapeId === shapeId;
        });

        if (fabricObj) {
          fabricObj.set("fill", color);
        }
      });

      canvas.renderOnAddRemove = false;
      canvas.requestRenderAll();
      canvas.renderOnAddRemove = true;
    },
    [canvas, selectedShapeIds],
  );

  // Fast visual-only update during dragging using requestAnimationFrame batching
  const handleFillChange = (color: string) => {
    setLocalFillColor(color); // Update UI immediately
    pendingColorRef.current = color;

    if (rafIdRef.current === null) {
      rafIdRef.current = requestAnimationFrame(() => {
        if (pendingColorRef.current) {
          updateCanvasColor(pendingColorRef.current);
        }
        rafIdRef.current = null;
      });
    }
  };

  // Immediate update for direct color clicks (no RAF delay)
  const handleFillChangeImmediate = (color: string) => {
    setLocalFillColor(color); // Update UI immediately
    updateCanvasColor(color);
  };

  // Commit to database and recent colors ONLY when done dragging
  const handleFillChangeComplete = async (color: string) => {
    console.log("handleFillChangeComplete called with color:", color);

    // Cancel any pending RAF updates
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }

    // Save to recent colors
    addRecentColor(color);

    console.log("Saving to database for shapes:", selectedShapeIds);

    // Save to database - onUpdate (handleShapeUpdate) will update the visual
    // No need to call updateCanvasColor here as it's redundant
    for (const shapeId of selectedShapeIds) {
      await onUpdate(shapeId, { fill: color });
      console.log("Database update complete for shape:", shapeId);
    }

    // Clear local color state once DB save completes
    setLocalFillColor(null);

    console.log("Fill change complete - all done");
  };

  const handleTogglePicker = () => {
    if (!showFillPicker && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const pickerHeight = 580; // Approximate height of the color picker
      const pickerWidth = 280;

      // Calculate top position, ensuring it doesn't go off-screen
      let top = rect.top;
      const bottomOverflow = top + pickerHeight - window.innerHeight;
      if (bottomOverflow > 0) {
        top = Math.max(8, top - bottomOverflow - 8); // 8px padding from bottom
      }

      setPickerPosition({
        top,
        right: window.innerWidth - rect.left + 8, // 8px margin
      });
    }
    setShowFillPicker(!showFillPicker);
  };

  return (
    <PropertySection title="Appearance" divider>
      {/* Fill Color */}
      <div className="space-y-2">
        <label className="text-xs text-[#B8B8B8] font-medium">Fill</label>
        <div className="relative">
          <button
            ref={buttonRef}
            onClick={handleTogglePicker}
            className="w-full h-10 rounded-lg border-2 border-white/10 hover:border-white/20 transition-colors"
            style={{
              backgroundColor: isMixedFill ? "transparent" : fillColor,
              backgroundImage: isMixedFill
                ? "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)"
                : "none",
              backgroundSize: "20px 20px",
              backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
            }}
            title={isMixedFill ? "Mixed colors" : fillColor}
          />

          {/* Color Picker Dropdown */}
          {showFillPicker && (
            <>
              <div
                className="fixed inset-0 z-[100]"
                onClick={() => setShowFillPicker(false)}
              />
              <div
                className="fixed z-[110]"
                style={{
                  top: `${pickerPosition.top}px`,
                  right: `${pickerPosition.right}px`,
                }}
              >
                <EnhancedColorPicker
                  color={fillColor}
                  recentColors={recentColors}
                  onColorChange={handleFillChange}
                  onColorChangeImmediate={handleFillChangeImmediate}
                  onColorChangeComplete={handleFillChangeComplete}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Opacity - Future Enhancement */}
      {/* <Slider
        label="Opacity"
        value={100}
        onChange={(val) => {}}
        min={0}
        max={100}
        step={1}
        suffix="%"
      /> */}
    </PropertySection>
  );
};

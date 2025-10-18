"use client";

/**
 * Style Panel Component
 * Controls for fill color, stroke color, stroke width, and opacity
 */

import { useState } from "react";
import { Slider } from "@/components/ui/Slider";
import { PRESET_COLORS } from "@/constants/colors";
import type { Shape } from "@/types/shapes";

interface StylePanelProps {
  shapes: Shape[];
  selectedShapeIds: string[];
  onUpdate: (shapeId: string, updates: Partial<Shape>) => Promise<void>;
}

export const StylePanel = ({
  shapes,
  selectedShapeIds,
  onUpdate,
}: StylePanelProps) => {
  const [showFillPicker, setShowFillPicker] = useState(false);
  const [fillHexInput, setFillHexInput] = useState("");

  const selectedShapes = shapes.filter((s) => selectedShapeIds.includes(s._id));

  if (selectedShapes.length === 0) return null;

  const firstShape = selectedShapes[0];
  const fillColor = firstShape.fillColor;

  // Check if values are mixed
  const isMixedFill = selectedShapes.some((s) => s.fillColor !== fillColor);

  const handleFillChange = async (color: string) => {
    for (const shapeId of selectedShapeIds) {
      await onUpdate(shapeId, { fillColor: color });
    }
  };

  const handleHexChange = (hex: string) => {
    setFillHexInput(hex);
    const hexWithHash = hex.startsWith("#") ? hex : `#${hex}`;
    if (/^#[0-9A-Fa-f]{6}$/.test(hexWithHash)) {
      handleFillChange(hexWithHash);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-[11px] uppercase text-[#888888] font-semibold tracking-wide">
        Appearance
      </h3>

      {/* Fill Color */}
      <div className="space-y-2">
        <label className="text-xs text-[#B8B8B8] font-medium">Fill</label>
        <div className="relative">
          <button
            onClick={() => setShowFillPicker(!showFillPicker)}
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
                className="fixed inset-0 z-30"
                onClick={() => setShowFillPicker(false)}
              />
              <div className="absolute top-full mt-2 left-0 right-0 z-40 bg-[var(--color-sidebar)] border border-white/10 rounded-lg shadow-2xl p-4">
                {/* Preset Colors */}
                <div className="grid grid-cols-7 gap-2 mb-4">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => {
                        handleFillChange(color);
                        setShowFillPicker(false);
                      }}
                      className={`w-8 h-8 rounded-lg border-2 transition-all hover:scale-110 ${
                        fillColor.toLowerCase() === color.toLowerCase()
                          ? "border-white/80 ring-2 ring-[#8A63D2]"
                          : "border-white/20 hover:border-white/40"
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>

                {/* Hex Input */}
                <div className="space-y-1">
                  <label className="text-xs text-[#B8B8B8] font-medium">
                    Hex Color
                  </label>
                  <input
                    type="text"
                    value={fillHexInput || fillColor}
                    onChange={(e) => handleHexChange(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--color-panel)] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#8A63D2]/50 font-mono"
                    placeholder="#3b82f6"
                    maxLength={7}
                  />
                </div>
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
    </div>
  );
};

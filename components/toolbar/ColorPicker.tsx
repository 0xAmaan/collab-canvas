"use client";

/**
 * Color Picker Component
 * Shows preset color palette and hex input for changing shape colors
 */

import { useState } from "react";
import { PRESET_COLORS } from "@/constants/colors";

interface ColorPickerProps {
  value: string; // Current color (hex)
  onChange: (color: string) => void; // Called when color changes
}

export const ColorPicker = ({ value, onChange }: ColorPickerProps) => {
  const [hexInput, setHexInput] = useState(value);
  const [showPicker, setShowPicker] = useState(false);

  // Validate and apply hex color
  const handleHexChange = (hex: string) => {
    setHexInput(hex);

    // Validate hex format (with or without #)
    const hexWithHash = hex.startsWith("#") ? hex : `#${hex}`;
    if (/^#[0-9A-Fa-f]{6}$/.test(hexWithHash)) {
      onChange(hexWithHash);
    }
  };

  // Apply preset color
  const handlePresetClick = (color: string) => {
    setHexInput(color);
    onChange(color);
  };

  return (
    <div className="relative">
      {/* Color preview button */}
      <button
        onClick={() => setShowPicker(!showPicker)}
        className="w-8 h-8 rounded-lg border-2 border-white/20 hover:border-white/40 transition-colors shadow-lg"
        style={{ backgroundColor: value }}
        title="Change color"
      />

      {/* Color picker dropdown */}
      {showPicker && (
        <>
          {/* Backdrop to close picker */}
          <div
            className="fixed inset-0 z-30"
            onClick={() => setShowPicker(false)}
          />

          {/* Picker panel */}
          <div className="absolute top-full mt-2 left-0 z-40 bg-slate-800/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl p-3 min-w-[220px]">
            {/* Preset colors grid */}
            <div className="grid grid-cols-7 gap-2 mb-3">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => handlePresetClick(color)}
                  className={`w-7 h-7 rounded-lg border-2 transition-all hover:scale-110 ${
                    value.toLowerCase() === color.toLowerCase()
                      ? "border-white/80 ring-2 ring-white/30"
                      : "border-white/20 hover:border-white/40"
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>

            {/* Hex input */}
            <div className="space-y-1">
              <label className="text-xs text-white/50 font-medium">
                Hex Color
              </label>
              <input
                type="text"
                value={hexInput}
                onChange={(e) => handleHexChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-mono"
                placeholder="#3b82f6"
                maxLength={7}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

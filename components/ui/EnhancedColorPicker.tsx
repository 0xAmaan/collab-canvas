"use client";

import { useRef, useEffect, useState } from "react";
import { HexColorPicker } from "react-colorful";
import { PRESET_COLORS } from "@/constants/colors";

interface EnhancedColorPickerProps {
  color: string;
  recentColors: string[];
  onColorChange: (color: string) => void;
  onColorChangeImmediate?: (color: string) => void;
  onColorChangeComplete?: (color: string) => void;
}

export const EnhancedColorPicker = ({
  color,
  recentColors,
  onColorChange,
  onColorChangeImmediate,
  onColorChangeComplete,
}: EnhancedColorPickerProps) => {
  const isDraggingRef = useRef(false);
  const lastColorRef = useRef(color);
  const [hexInput, setHexInput] = useState(color);

  // Sync hex input with color prop when color changes externally
  useEffect(() => {
    setHexInput(color);
  }, [color]);

  // Handle color picker dragging - fast visual updates only
  const handlePickerChange = (selectedColor: string) => {
    isDraggingRef.current = true;
    lastColorRef.current = selectedColor;
    onColorChange(selectedColor);
  };

  // Handle mouse up - finalize the color choice
  const handlePickerChangeComplete = () => {
    if (isDraggingRef.current && onColorChangeComplete) {
      console.log("Color picker complete:", lastColorRef.current);
      onColorChangeComplete(lastColorRef.current);
      isDraggingRef.current = false;
    }
  };

  // Listen for global mouseup to catch mouse releases outside the picker
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      handlePickerChangeComplete();
    };

    document.addEventListener("mouseup", handleGlobalMouseUp);
    document.addEventListener("touchend", handleGlobalMouseUp);

    return () => {
      document.removeEventListener("mouseup", handleGlobalMouseUp);
      document.removeEventListener("touchend", handleGlobalMouseUp);
    };
  }, []);

  // Handle direct color selection (presets, recent) - INSTANT update
  const handleColorSelect = (selectedColor: string) => {
    // Use immediate callback for instant visual update (no RAF delay)
    if (onColorChangeImmediate) {
      onColorChangeImmediate(selectedColor);
    } else {
      onColorChange(selectedColor);
    }

    // Non-blocking DB save in background
    if (onColorChangeComplete) {
      console.log("Direct color select:", selectedColor);
      // Don't await - let it run in background
      Promise.resolve().then(() => onColorChangeComplete(selectedColor));
    }
  };

  // Create array of 8 slots for recent colors (empty or filled)
  const recentColorSlots = Array.from({ length: 8 }, (_, i) => recentColors[i]);

  return (
    <div className="w-[280px] bg-[var(--color-sidebar)] border border-white/10 rounded-lg shadow-2xl p-4 space-y-4">
      {/* Recent Colors Section */}
      <div>
        <label className="text-xs text-[#B8B8B8] font-medium mb-2 block">
          Recent Colors
        </label>
        <div className="grid grid-cols-8 gap-2">
          {recentColorSlots.map((recentColor, index) => (
            <button
              key={index}
              onClick={() => recentColor && handleColorSelect(recentColor)}
              disabled={!recentColor}
              className={`w-8 h-8 rounded-lg border-2 transition-all ${
                recentColor
                  ? "hover:scale-110 border-white/20 hover:border-white/40"
                  : "border-white/10 cursor-default"
              }`}
              style={{
                backgroundColor: recentColor || "rgba(255, 255, 255, 0.1)",
              }}
              title={recentColor || "Empty"}
            />
          ))}
        </div>
      </div>

      {/* Color Picker Section */}
      <div>
        <label className="text-xs text-[#B8B8B8] font-medium mb-2 block">
          Color Picker
        </label>
        <div
          onMouseUp={handlePickerChangeComplete}
          onTouchEnd={handlePickerChangeComplete}
        >
          <HexColorPicker
            color={color}
            onChange={handlePickerChange}
            style={{ width: "100%" }}
          />
        </div>
      </div>

      {/* Hex Input */}
      <div>
        <label className="text-xs text-[#B8B8B8] font-medium mb-1 block">
          Hex Value
        </label>
        <input
          type="text"
          value={hexInput}
          onChange={(e) => {
            const value = e.target.value;
            setHexInput(value); // Allow free typing

            // Only update color if valid hex
            const hexWithHash = value.startsWith("#") ? value : `#${value}`;
            if (/^#[0-9A-Fa-f]{6}$/.test(hexWithHash)) {
              handleColorSelect(hexWithHash);
            }
          }}
          onBlur={() => {
            // On blur, reset to current color if invalid
            setHexInput(color);
          }}
          className="w-full px-3 py-2 bg-[var(--color-panel)] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#8A63D2]/50 font-mono"
          placeholder="#3b82f6"
          maxLength={7}
        />
      </div>

      {/* Preset Colors Section */}
      <div>
        <label className="text-xs text-[#B8B8B8] font-medium mb-2 block">
          Preset Colors
        </label>
        <div className="grid grid-cols-7 gap-2">
          {PRESET_COLORS.map((presetColor) => (
            <button
              key={presetColor}
              onClick={() => handleColorSelect(presetColor)}
              className={`w-8 h-8 rounded-lg border-2 transition-all hover:scale-110 ${
                color.toLowerCase() === presetColor.toLowerCase()
                  ? "border-white/80 ring-2 ring-[#8A63D2]"
                  : "border-white/20 hover:border-white/40"
              }`}
              style={{ backgroundColor: presetColor }}
              title={presetColor}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

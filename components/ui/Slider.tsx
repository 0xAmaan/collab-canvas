"use client";

/**
 * Slider Component
 * Range input with styled track and thumb
 */

interface SliderProps {
  label?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}

export const Slider = ({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  suffix = "",
}: SliderProps) => {
  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-xs text-[#B8B8B8] font-medium">{label}</label>
          <span className="text-xs text-white/70">
            {value}
            {suffix}
          </span>
        </div>
      )}
      <input
        type="range"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        min={min}
        max={max}
        step={step}
        className="w-full h-1 bg-[var(--color-panel)] rounded-lg appearance-none cursor-pointer slider-thumb"
        style={{
          background: `linear-gradient(to right, #8A63D2 0%, #8A63D2 ${((value - min) / (max - min)) * 100}%, var(--color-panel) ${((value - min) / (max - min)) * 100}%, var(--color-panel) 100%)`,
        }}
      />
      <style jsx>{`
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #8a63d2;
          cursor: pointer;
          border: 2px solid var(--color-sidebar);
        }
        input[type="range"]::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #8a63d2;
          cursor: pointer;
          border: 2px solid var(--color-sidebar);
        }
      `}</style>
    </div>
  );
};

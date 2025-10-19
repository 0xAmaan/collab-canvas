"use client";

/**
 * Number Input Component
 * Numeric input with up/down arrows and keyboard support
 */

import { useState, useEffect } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

interface NumberInputProps {
  label?: string;
  value?: number;
  placeholder?: string;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}

export const NumberInput = ({
  label,
  value,
  placeholder,
  onChange,
  min,
  max,
  step = 1,
  suffix,
}: NumberInputProps) => {
  const [inputValue, setInputValue] = useState(
    value !== undefined ? value.toString() : "",
  );

  // Sync with external value changes
  useEffect(() => {
    setInputValue(value !== undefined ? value.toString() : "");
  }, [value]);

  const handleChange = (newValue: string) => {
    // Only update local input value, don't trigger onChange yet
    setInputValue(newValue);
  };

  const applyValue = () => {
    // Parse and validate when user is done typing
    const num = parseFloat(inputValue);
    if (!isNaN(num)) {
      let finalValue = num;
      if (min !== undefined) finalValue = Math.max(min, finalValue);
      if (max !== undefined) finalValue = Math.min(max, finalValue);
      onChange(finalValue);
    } else if (value !== undefined) {
      // Reset to previous value if invalid
      setInputValue(value.toString());
    }
  };

  const handleIncrement = () => {
    const current = value ?? 0;
    const newValue = current + step;
    const finalValue = max !== undefined ? Math.min(max, newValue) : newValue;
    onChange(finalValue);
  };

  const handleDecrement = () => {
    const current = value ?? 0;
    const newValue = current - step;
    const finalValue = min !== undefined ? Math.max(min, newValue) : newValue;
    onChange(finalValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      handleIncrement();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      handleDecrement();
    } else if (e.key === "Enter") {
      e.preventDefault();
      applyValue();
      (e.target as HTMLInputElement).blur(); // Remove focus after applying
    }
  };

  return (
    <div className="space-y-1">
      {label && (
        <label className="text-xs text-[#B8B8B8] font-medium">{label}</label>
      )}
      <div className="relative flex items-center">
        <input
          type="text"
          value={inputValue}
          placeholder={placeholder}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={applyValue}
          className="w-full h-7 px-2 pr-8 bg-[var(--color-panel)] border border-white/8 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#8A63D2]/50 placeholder:text-white/30"
        />
        {suffix && (
          <span className="absolute right-8 text-xs text-white/40 pointer-events-none">
            {suffix}
          </span>
        )}
        <div className="absolute right-0 flex flex-col">
          <button
            onClick={handleIncrement}
            className="px-1 h-3.5 flex items-center justify-center hover:bg-white/10 text-white/50 hover:text-white/80 transition-colors"
            title="Increment"
          >
            <ChevronUp className="w-3 h-3" />
          </button>
          <button
            onClick={handleDecrement}
            className="px-1 h-3.5 flex items-center justify-center hover:bg-white/10 text-white/50 hover:text-white/80 transition-colors"
            title="Decrement"
          >
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

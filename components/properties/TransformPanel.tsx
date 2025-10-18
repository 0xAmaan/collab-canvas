"use client";

/**
 * Transform Panel Component
 * Controls for rotation, scale, and flip
 */

import { NumberInput } from "@/components/ui/NumberInput";
import type { Shape } from "@/types/shapes";

interface TransformPanelProps {
  shapes: Shape[];
  selectedShapeIds: string[];
  onUpdate: (shapeId: string, updates: Partial<Shape>) => Promise<void>;
}

export const TransformPanel = ({
  shapes,
  selectedShapeIds,
  onUpdate,
}: TransformPanelProps) => {
  const selectedShapes = shapes.filter((s) => selectedShapeIds.includes(s._id));

  if (selectedShapes.length === 0) return null;

  const firstShape = selectedShapes[0];
  const angleValue = firstShape.angle ?? 0;

  // Check if values are mixed
  const isMixedAngle = selectedShapes.some(
    (s) => (s.angle ?? 0) !== angleValue,
  );

  const handleUpdate = async (field: string, value: number) => {
    for (const shapeId of selectedShapeIds) {
      await onUpdate(shapeId, { [field]: value });
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-[11px] uppercase text-[#888888] font-semibold tracking-wide">
        Transform
      </h3>

      {/* Rotation */}
      <NumberInput
        label="Rotation"
        value={isMixedAngle ? undefined : angleValue}
        placeholder={isMixedAngle ? "Mixed" : "0"}
        onChange={(val) => handleUpdate("angle", val)}
        min={-180}
        max={180}
        step={1}
        suffix="°"
      />

      {/* Flip Buttons - Future Enhancement */}
      {/* <div className="flex gap-2">
        <button className="flex-1 px-3 py-2 bg-[#2C2C2C] hover:bg-[#383838] border border-white/10 rounded-lg text-xs text-white/70 hover:text-white transition-colors">
          Flip H
        </button>
        <button className="flex-1 px-3 py-2 bg-[#2C2C2C] hover:bg-[#383838] border border-white/10 rounded-lg text-xs text-white/70 hover:text-white transition-colors">
          Flip V
        </button>
      </div> */}
    </div>
  );
};

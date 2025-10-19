"use client";

/**
 * Position Panel Component
 * Controls for X, Y, Width, Height, and aspect ratio lock
 */

import { useState } from "react";
import { Lock, Unlock } from "lucide-react";
import { NumberInput } from "@/components/ui/NumberInput";
import { PropertySection } from "@/components/ui/PropertySection";
import type { Shape } from "@/types/shapes";

interface PositionPanelProps {
  shapes: Shape[];
  selectedShapeIds: string[];
  onUpdate: (shapeId: string, updates: Partial<Shape>) => Promise<void>;
}

export const PositionPanel = ({
  shapes,
  selectedShapeIds,
  onUpdate,
}: PositionPanelProps) => {
  const [aspectRatioLocked, setAspectRatioLocked] = useState(false);

  const selectedShapes = shapes.filter((s) => selectedShapeIds.includes(s._id));

  if (selectedShapes.length === 0) return null;

  // Get values (single select or mixed)
  const firstShape = selectedShapes[0];
  const hasPositionX = "x" in firstShape;
  const hasPositionY = "y" in firstShape;
  const hasDimensions = "width" in firstShape && "height" in firstShape;

  // Check if values are mixed
  const xValue = hasPositionX ? (firstShape as any).x : undefined;
  const yValue = hasPositionY ? (firstShape as any).y : undefined;
  const widthValue = hasDimensions ? (firstShape as any).width : undefined;
  const heightValue = hasDimensions ? (firstShape as any).height : undefined;

  const isMixedX =
    hasPositionX &&
    selectedShapes.some((s) => "x" in s && (s as any).x !== xValue);
  const isMixedY =
    hasPositionY &&
    selectedShapes.some((s) => "y" in s && (s as any).y !== yValue);
  const isMixedWidth =
    hasDimensions &&
    selectedShapes.some((s) => "width" in s && (s as any).width !== widthValue);
  const isMixedHeight =
    hasDimensions &&
    selectedShapes.some(
      (s) => "height" in s && (s as any).height !== heightValue,
    );

  const handleUpdate = async (field: string, value: number) => {
    for (const shapeId of selectedShapeIds) {
      const shape = shapes.find((s) => s._id === shapeId);
      if (!shape) continue;

      const updates: any = { [field]: value };

      // Handle aspect ratio lock
      if (
        aspectRatioLocked &&
        hasDimensions &&
        (field === "width" || field === "height")
      ) {
        const currentWidth = (shape as any).width;
        const currentHeight = (shape as any).height;
        const aspectRatio = currentWidth / currentHeight;

        if (field === "width") {
          updates.height = Math.round(value / aspectRatio);
        } else if (field === "height") {
          updates.width = Math.round(value * aspectRatio);
        }
      }

      await onUpdate(shapeId, updates);
    }
  };

  return (
    <PropertySection title="Position & Size">
      {/* Position */}
      {(hasPositionX || hasPositionY) && (
        <div className="grid grid-cols-2 gap-3">
          {hasPositionX && (
            <NumberInput
              label="X"
              value={isMixedX ? undefined : xValue}
              placeholder={isMixedX ? "Mixed" : "0"}
              onChange={(val) => handleUpdate("x", val)}
              step={1}
            />
          )}
          {hasPositionY && (
            <NumberInput
              label="Y"
              value={isMixedY ? undefined : yValue}
              placeholder={isMixedY ? "Mixed" : "0"}
              onChange={(val) => handleUpdate("y", val)}
              step={1}
            />
          )}
        </div>
      )}

      {/* Dimensions */}
      {hasDimensions && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <NumberInput
              label="W"
              value={isMixedWidth ? undefined : widthValue}
              placeholder={isMixedWidth ? "Mixed" : "0"}
              onChange={(val) => handleUpdate("width", val)}
              min={1}
              step={1}
            />
            <NumberInput
              label="H"
              value={isMixedHeight ? undefined : heightValue}
              placeholder={isMixedHeight ? "Mixed" : "0"}
              onChange={(val) => handleUpdate("height", val)}
              min={1}
              step={1}
            />
          </div>

          {/* Aspect Ratio Lock */}
          <button
            onClick={() => setAspectRatioLocked(!aspectRatioLocked)}
            className={`flex items-center gap-2 text-xs transition-colors cursor-pointer ${
              aspectRatioLocked
                ? "text-primary"
                : "text-white/50 hover:text-white/70"
            }`}
            title="Lock aspect ratio"
          >
            {aspectRatioLocked ? (
              <Lock className="w-4 h-4 flex-shrink-0" />
            ) : (
              <Unlock className="w-4 h-4 flex-shrink-0" />
            )}
            <span className="leading-4">Lock aspect ratio</span>
          </button>
        </>
      )}
    </PropertySection>
  );
};

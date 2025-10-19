/**
 * Individual layer item in the layers panel
 * Shows shape icon, name, and drag handle
 */

"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Square,
  Circle,
  Minus,
  Type,
  PenTool,
  Hexagon,
} from "lucide-react";
import type { Shape } from "@/types/shapes";

interface LayerItemProps {
  shape: Shape;
  displayName: string;
  isSelected: boolean;
  onClick: () => void;
}

const SHAPE_ICONS = {
  rectangle: Square,
  circle: Circle,
  ellipse: Circle,
  line: Minus,
  text: Type,
  path: PenTool,
  polygon: Hexagon,
};

export const LayerItem = ({
  shape,
  displayName,
  isSelected,
  onClick,
}: LayerItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: shape._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const ShapeIcon = SHAPE_ICONS[shape.type] || Square;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer
        transition-colors group
        ${
          isSelected
            ? "bg-primary/20 text-primary border border-primary/30"
            : "hover:bg-white/5 text-white/80 hover:text-white border border-transparent"
        }
      `}
      onClick={onClick}
    >
      {/* Drag Handle */}
      <button
        className="cursor-grab active:cursor-grabbing p-0.5 hover:bg-white/10 rounded"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-4 h-4 text-white/40" />
      </button>

      {/* Shape Icon */}
      <div
        className="w-5 h-5 flex items-center justify-center"
        style={{ color: shape.type === "path" ? shape.stroke : shape.fill }}
      >
        <ShapeIcon className="w-4 h-4" />
      </div>

      {/* Shape Name */}
      <span className="text-sm flex-1 truncate">{displayName}</span>
    </div>
  );
};

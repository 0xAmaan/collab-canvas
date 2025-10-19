/**
 * Layers Panel Component
 * Displays all shapes ordered by z-index with drag-and-drop reordering
 */

"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { Shape } from "@/types/shapes";
import type { Canvas as FabricCanvas } from "fabric";
import { LayerItem } from "./LayerItem";
import {
  generateLayerName,
  calculateNewZIndices,
} from "@/lib/canvas/layer-utils";

interface LayersPanelProps {
  shapes: Shape[];
  selectedShapeIds: string[];
  canvas: FabricCanvas | null;
  onReorderShapes: (updates: Array<{ id: string; zIndex: number }>) => void;
}

export const LayersPanel = ({
  shapes,
  selectedShapeIds,
  canvas,
  onReorderShapes,
}: LayersPanelProps) => {
  // Sort shapes by zIndex (descending = front to back in UI)
  const sortedShapes = useMemo(() => {
    return [...shapes].sort((a, b) => (b.zIndex ?? 0) - (a.zIndex ?? 0));
  }, [shapes]);

  // Refs to track layer items for auto-scrolling
  const layerItemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Auto-scroll to selected layer when selection changes
  useEffect(() => {
    if (selectedShapeIds.length > 0) {
      const firstSelectedId = selectedShapeIds[0];
      const layerElement = layerItemRefs.current.get(firstSelectedId);

      if (layerElement) {
        layerElement.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }
    }
  }, [selectedShapeIds]);

  // Configure drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts (prevents accidental drags)
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Handle drag end
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      console.log("🎯 Drag end:", { active: active.id, over: over?.id });

      if (!over || active.id === over.id) {
        console.log("❌ No valid drop target");
        return;
      }

      // Find old and new indices
      const oldIndex = sortedShapes.findIndex((s) => s._id === active.id);
      const newIndex = sortedShapes.findIndex((s) => s._id === over.id);

      console.log("📍 Indices:", { oldIndex, newIndex });

      if (oldIndex === -1 || newIndex === -1) {
        console.log("❌ Invalid indices");
        return;
      }

      // Get current zIndices
      const movedShape = sortedShapes[oldIndex];
      const targetShape = sortedShapes[newIndex];

      // Simple swap: only update the two shapes involved
      // This avoids updating all shapes and is much more efficient
      const updates = [
        {
          id: movedShape._id,
          zIndex: targetShape.zIndex ?? 0,
        },
        {
          id: targetShape._id,
          zIndex: movedShape.zIndex ?? 0,
        },
      ];

      console.log("📦 Z-index updates (optimized):", updates);

      // Apply updates
      onReorderShapes(updates);
    },
    [sortedShapes, onReorderShapes],
  );

  // Handle layer click - select shape on canvas
  const handleLayerClick = useCallback(
    (shapeId: string) => {
      if (!canvas) return;

      // Find the Fabric object for this shape
      const objects = canvas.getObjects();
      const fabricObj = objects.find((obj) => {
        const data = obj.get("data") as { shapeId?: string } | undefined;
        return data?.shapeId === shapeId;
      });

      if (fabricObj) {
        canvas.setActiveObject(fabricObj);
        canvas.requestRenderAll();
      }
    },
    [canvas],
  );

  if (shapes.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center px-4 h-full">
        <p className="text-sm text-white/40 text-center">
          No shapes yet. Create a shape to see it here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-2 py-2">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sortedShapes.map((s) => s._id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-1">
            {sortedShapes.map((shape) => (
              <div
                key={shape._id}
                ref={(el) => {
                  if (el) {
                    layerItemRefs.current.set(shape._id, el);
                  } else {
                    layerItemRefs.current.delete(shape._id);
                  }
                }}
              >
                <LayerItem
                  shape={shape}
                  displayName={generateLayerName(shape, shapes)}
                  isSelected={selectedShapeIds.includes(shape._id)}
                  onClick={() => handleLayerClick(shape._id)}
                />
              </div>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};

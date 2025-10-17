/**
 * Custom hook for managing shapes with Convex real-time sync
 * Implements optimistic updates for immediate UI feedback
 */

import { useCallback, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { Shape } from "@/types/shapes";

interface OptimisticShape extends Shape {
  _isOptimistic?: boolean;
}

export function useShapes() {
  // Subscribe to all shapes from Convex (real-time)
  const convexShapes = useQuery(api.shapes.getShapes) ?? [];

  // Local optimistic updates
  const [optimisticShapes, setOptimisticShapes] = useState<OptimisticShape[]>(
    [],
  );

  // Convex mutations
  const createShapeMutation = useMutation(api.shapes.createShape);
  const moveShapeMutation = useMutation(api.shapes.moveShape);
  const updateShapeMutation = useMutation(api.shapes.updateShape);
  const deleteShapeMutation = useMutation(api.shapes.deleteShape);

  // Convert Convex shapes to our Shape type
  const shapes: Shape[] = [
    ...convexShapes.map((s) => ({
      _id: s._id,
      type: "rectangle" as const,
      x: s.x,
      y: s.y,
      width: s.width,
      height: s.height,
      angle: s.angle ?? 0,
      fillColor: s.fill,
      createdBy: s.createdBy,
      createdAt: s.createdAt,
      lastModified: s.lastModified,
      lastModifiedBy: s.createdBy,
    })),
    // Add optimistic shapes that haven't synced yet
    ...optimisticShapes.filter((opt) => opt._isOptimistic),
  ];

  /**
   * Create a new shape with optimistic update
   */
  const createShape = useCallback(
    async (shape: Omit<Shape, "_id">) => {
      // Generate temporary ID for optimistic update
      const tempId = `temp_${Date.now()}_${Math.random()}`;

      // Add optimistic shape immediately
      const optimisticShape: OptimisticShape = {
        ...shape,
        _id: tempId,
        _isOptimistic: true,
      };

      setOptimisticShapes((prev) => [...prev, optimisticShape]);

      try {
        // Call Convex mutation
        const realId = await createShapeMutation({
          x: shape.x,
          y: shape.y,
          width: shape.width,
          height: shape.height,
          fill: shape.fillColor,
        });

        // Remove optimistic shape once real one arrives
        setOptimisticShapes((prev) => prev.filter((s) => s._id !== tempId));

        return realId;
      } catch (error) {
        console.error("Failed to create shape:", error);
        // Remove optimistic shape on error
        setOptimisticShapes((prev) => prev.filter((s) => s._id !== tempId));
        throw error;
      }
    },
    [createShapeMutation],
  );

  /**
   * Move a shape with optimistic update
   */
  const moveShape = useCallback(
    async (shapeId: string, x: number, y: number) => {
      try {
        // Optimistically update in Convex query (it will update immediately)
        await moveShapeMutation({
          shapeId: shapeId as Id<"shapes">,
          x,
          y,
        });
      } catch (error) {
        console.error("Failed to move shape:", error);
        throw error;
      }
    },
    [moveShapeMutation],
  );

  /**
   * Update a shape (position, size, etc.) with optimistic update
   */
  const updateShape = useCallback(
    async (
      shapeId: string,
      updates: {
        x?: number;
        y?: number;
        width?: number;
        height?: number;
        angle?: number;
        fill?: string;
      },
    ) => {
      try {
        await updateShapeMutation({
          shapeId: shapeId as Id<"shapes">,
          ...updates,
        });
      } catch (error) {
        console.error("Failed to update shape:", error);
        throw error;
      }
    },
    [updateShapeMutation],
  );

  /**
   * Delete a shape with optimistic update
   */
  const deleteShape = useCallback(
    async (shapeId: string) => {
      try {
        await deleteShapeMutation({
          shapeId: shapeId as Id<"shapes">,
        });
      } catch (error) {
        console.error("Failed to delete shape:", error);
        throw error;
      }
    },
    [deleteShapeMutation],
  );

  return {
    shapes,
    createShape,
    moveShape,
    updateShape,
    deleteShape,
    isLoading: convexShapes === undefined,
  };
}

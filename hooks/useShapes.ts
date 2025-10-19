/**
 * Custom hook for managing shapes with Convex real-time sync
 * Implements optimistic updates for immediate UI feedback
 */

import { useCallback, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { Shape } from "@/types/shapes";

type OptimisticShape = Shape & {
  _isOptimistic?: boolean;
};

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
    ...convexShapes.map((s): Shape => {
      const baseShape = {
        _id: s._id,
        fillColor: s.fill,
        angle: s.angle ?? 0,
        createdBy: s.createdBy,
        createdAt: s.createdAt,
        lastModified: s.lastModified,
        lastModifiedBy: s.createdBy,
      };

      switch (s.type) {
        case "rectangle":
          return {
            ...baseShape,
            type: "rectangle",
            x: s.x ?? 0,
            y: s.y ?? 0,
            width: s.width ?? 0,
            height: s.height ?? 0,
          };
        case "circle":
          return {
            ...baseShape,
            type: "circle",
            x: s.x ?? 0,
            y: s.y ?? 0,
            width: s.width ?? 0,
            height: s.height ?? 0,
          };
        case "ellipse":
          return {
            ...baseShape,
            type: "ellipse",
            x: s.x ?? 0,
            y: s.y ?? 0,
            width: s.width ?? 0,
            height: s.height ?? 0,
          };
        case "line":
          return {
            ...baseShape,
            type: "line",
            x1: s.x1 ?? 0,
            y1: s.y1 ?? 0,
            x2: s.x2 ?? 0,
            y2: s.y2 ?? 0,
          };
        case "text":
          return {
            ...baseShape,
            type: "text",
            x: s.x ?? 0,
            y: s.y ?? 0,
            text: s.text ?? "",
            fontSize: s.fontSize ?? 16,
            fontFamily: s.fontFamily ?? "Inter",
          };
        case "path":
          return {
            ...baseShape,
            type: "path",
            pathData: s.pathData ?? "[]",
            stroke: s.stroke ?? "#000000",
            strokeWidth: s.strokeWidth ?? 2,
            x: s.x ?? 0,
            y: s.y ?? 0,
            width: s.width ?? 0,
            height: s.height ?? 0,
          };
        case "polygon":
          return {
            ...baseShape,
            type: "polygon",
            points: s.points ?? [],
            x: s.x ?? 0,
            y: s.y ?? 0,
            width: s.width ?? 0,
            height: s.height ?? 0,
          };
        default:
          // Fallback to rectangle if type is unknown
          return {
            ...baseShape,
            type: "rectangle",
            x: s.x ?? 0,
            y: s.y ?? 0,
            width: s.width ?? 0,
            height: s.height ?? 0,
          };
      }
    }),
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
      const optimisticShape = {
        ...shape,
        _id: tempId,
        _isOptimistic: true,
      } as OptimisticShape;

      setOptimisticShapes((prev) => [...prev, optimisticShape]);

      try {
        console.log("[useShapes] Creating shape with data:", shape);

        // Build mutation args based on shape type
        const mutationArgs: any = {
          type: shape.type,
        };

        // Add type-specific fields
        switch (shape.type) {
          case "rectangle":
          case "circle":
          case "ellipse":
            mutationArgs.fill = shape.fillColor;
            mutationArgs.x = (shape as any).x;
            mutationArgs.y = (shape as any).y;
            mutationArgs.width = (shape as any).width;
            mutationArgs.height = (shape as any).height;
            break;
          case "line":
            mutationArgs.fill = shape.fillColor;
            mutationArgs.x1 = (shape as any).x1;
            mutationArgs.y1 = (shape as any).y1;
            mutationArgs.x2 = (shape as any).x2;
            mutationArgs.y2 = (shape as any).y2;
            break;
          case "text":
            mutationArgs.fill = shape.fillColor;
            mutationArgs.x = (shape as any).x;
            mutationArgs.y = (shape as any).y;
            mutationArgs.text = (shape as any).text;
            mutationArgs.fontSize = (shape as any).fontSize;
            mutationArgs.fontFamily = (shape as any).fontFamily;
            break;
          case "path":
            console.log("🔵 [useShapes PATH] Building mutation args for path:");
            console.log("  - x:", (shape as any).x);
            console.log("  - y:", (shape as any).y);
            console.log("  - width:", (shape as any).width);
            console.log("  - height:", (shape as any).height);
            console.log(
              "  - pathData length:",
              (shape as any).pathData?.length,
            );
            console.log("  - stroke:", (shape as any).stroke);
            console.log("  - strokeWidth:", (shape as any).strokeWidth);
            console.log("  - fillColor (WILL NOT SEND):", shape.fillColor);

            // CRITICAL: Do NOT send fill for paths - they should be stroke-only
            mutationArgs.x = (shape as any).x;
            mutationArgs.y = (shape as any).y;
            mutationArgs.width = (shape as any).width;
            mutationArgs.height = (shape as any).height;
            mutationArgs.pathData = (shape as any).pathData;
            mutationArgs.stroke = (shape as any).stroke;
            mutationArgs.strokeWidth = (shape as any).strokeWidth;
            // NOTE: We store fillColor in our Shape type for metadata/consistency,
            // but we do NOT send it to Convex for paths

            console.log(
              "✅ [useShapes PATH] Final mutationArgs (no fill):",
              mutationArgs,
            );
            break;
        }

        console.log(
          "[useShapes] Mutation args to send to Convex:",
          mutationArgs,
        );

        // Call Convex mutation
        const realId = await createShapeMutation(mutationArgs);

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
        text?: string;
        fontSize?: number;
        fontFamily?: string;
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

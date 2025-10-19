import type { FabricObject, Canvas as FabricCanvas } from "fabric";
import type { Shape } from "@/types/shapes";
import { shapeValidators } from "@/lib/canvas/shape-validators";
import { CreateShapeCommand } from "@/lib/commands/CreateShapeCommand";

interface FinalizeOptions {
  canvas: FabricCanvas;
  object: FabricObject;
  shapeType: Shape["type"];
  extractShapeData: (obj: FabricObject) => Partial<Shape>;
  userId: string;
  createShape: any;
  deleteShape: any;
  history: any;
}

/**
 * Generic shape finalization logic
 * Validates, creates in Convex, and links shapeId to Fabric object
 */
export const finalizeShape = async ({
  canvas,
  object,
  shapeType,
  extractShapeData,
  userId,
  createShape,
  deleteShape,
  history,
}: FinalizeOptions): Promise<string | null> => {
  // Validate shape meets minimum size requirements
  const validator = shapeValidators[shapeType as keyof typeof shapeValidators];
  if (validator && !validator(object as any)) {
    canvas.remove(object);
    return null;
  }

  try {
    // Extract shape-specific data
    const specificData = extractShapeData(object);

    // Create base shape data
    const shapeData = {
      type: shapeType,
      ...specificData,
      createdBy: userId,
      createdAt: Date.now(),
      lastModified: Date.now(),
      lastModifiedBy: userId,
    };

    // Use command pattern for undo/redo
    const command = new CreateShapeCommand(
      shapeData as any,
      createShape,
      deleteShape,
    );

    await history.execute(command);

    // Link shapeId to Fabric object
    const shapeId = (command as any).shapeId;
    if (shapeId) {
      object.set("data", { shapeId });
    }

    return shapeId;
  } catch (error) {
    console.error(`Failed to create ${shapeType}:`, error);
    canvas.remove(object);
    return null;
  }
};

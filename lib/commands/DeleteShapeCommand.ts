/**
 * Command for deleting a shape
 * Supports undo (restore) and redo (delete again)
 */

import type { Command } from "@/lib/commands/types";
import type { Shape } from "@/types/shapes";

type ShapeData = Omit<Shape, "_id">;

export class DeleteShapeCommand implements Command {
  private shapeId: string;
  private readonly shapeData: ShapeData;
  private readonly createShapeFn: (data: ShapeData) => Promise<string>;
  private readonly deleteShapeFn: (shapeId: string) => Promise<void>;

  constructor(
    shapeData: Shape,
    createShapeFn: (data: ShapeData) => Promise<string>,
    deleteShapeFn: (shapeId: string) => Promise<void>,
  ) {
    const { _id, ...dataWithoutId } = shapeData;
    this.shapeId = _id;
    this.shapeData = dataWithoutId;
    this.createShapeFn = createShapeFn;
    this.deleteShapeFn = deleteShapeFn;
  }

  async execute(): Promise<void> {
    await this.deleteShapeFn(this.shapeId);
  }

  async undo(): Promise<void> {
    this.shapeId = await this.createShapeFn(this.shapeData);
  }

  async redo(): Promise<void> {
    try {
      await this.deleteShapeFn(this.shapeId);
    } catch (error) {
      // Ignore if shape was already deleted
      if (
        error instanceof Error &&
        !error.message?.includes("nonexistent document")
      ) {
        throw error;
      }
    }
  }
}

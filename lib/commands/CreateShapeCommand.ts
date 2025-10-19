/**
 * Command for creating a shape
 * Supports undo (delete) and redo (recreate)
 */

import type { Command } from "@/lib/commands/types";
import type { Shape } from "@/types/shapes";

type ShapeData = Omit<Shape, "_id">;

export class CreateShapeCommand implements Command {
  private shapeId: string | null = null;
  private readonly shapeData: ShapeData;
  private readonly createShapeFn: (data: ShapeData) => Promise<string>;
  private readonly deleteShapeFn: (shapeId: string) => Promise<void>;

  constructor(
    shapeData: ShapeData,
    createShapeFn: (data: ShapeData) => Promise<string>,
    deleteShapeFn: (shapeId: string) => Promise<void>,
  ) {
    this.shapeData = shapeData;
    this.createShapeFn = createShapeFn;
    this.deleteShapeFn = deleteShapeFn;
  }

  async execute(): Promise<void> {
    this.shapeId = await this.createShapeFn(this.shapeData);
  }

  async undo(): Promise<void> {
    if (!this.shapeId) return;

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

  async redo(): Promise<void> {
    this.shapeId = await this.createShapeFn(this.shapeData);
  }

  getShapeId(): string | null {
    return this.shapeId;
  }
}

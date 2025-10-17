/**
 * Command for deleting a shape
 * Supports undo (restore shape) and redo (delete again)
 */

import type { Command } from "./types";
import type { Shape } from "@/types/shapes";

export class DeleteShapeCommand implements Command {
  private shapeData: Omit<Shape, "_id">;
  private shapeId: string;
  private createShapeFn: (data: Omit<Shape, "_id">) => Promise<string>;
  private deleteShapeFn: (shapeId: string) => Promise<void>;

  constructor(
    shapeData: Shape,
    createShapeFn: (data: Omit<Shape, "_id">) => Promise<string>,
    deleteShapeFn: (shapeId: string) => Promise<void>,
  ) {
    this.shapeId = shapeData._id;
    // Store shape data without the ID
    const { _id, ...dataWithoutId } = shapeData;
    this.shapeData = dataWithoutId;
    this.createShapeFn = createShapeFn;
    this.deleteShapeFn = deleteShapeFn;
  }

  async execute(): Promise<void> {
    await this.deleteShapeFn(this.shapeId);
  }

  async undo(): Promise<void> {
    // Restore the shape - will get a new ID but same properties
    this.shapeId = await this.createShapeFn(this.shapeData);
  }

  async redo(): Promise<void> {
    await this.deleteShapeFn(this.shapeId);
  }
}

/**
 * Command for updating a shape (position, size, rotation, color)
 * Supports undo (restore old values) and redo (apply new values)
 */

import type { Command } from "@/lib/commands/types";

interface ShapeUpdates {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  angle?: number;
  fill?: string;
}

export class UpdateShapeCommand implements Command {
  private shapeId: string;
  private oldValues: ShapeUpdates;
  private newValues: ShapeUpdates;
  private updateShapeFn: (
    shapeId: string,
    updates: ShapeUpdates,
  ) => Promise<void>;

  constructor(
    shapeId: string,
    oldValues: ShapeUpdates,
    newValues: ShapeUpdates,
    updateShapeFn: (shapeId: string, updates: ShapeUpdates) => Promise<void>,
  ) {
    this.shapeId = shapeId;
    this.oldValues = oldValues;
    this.newValues = newValues;
    this.updateShapeFn = updateShapeFn;
  }

  async execute(): Promise<void> {
    await this.updateShapeFn(this.shapeId, this.newValues);
  }

  async undo(): Promise<void> {
    await this.updateShapeFn(this.shapeId, this.oldValues);
  }

  async redo(): Promise<void> {
    await this.updateShapeFn(this.shapeId, this.newValues);
  }
}

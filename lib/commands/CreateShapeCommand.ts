/**
 * Command for creating a shape
 * Supports undo (delete) and redo (create again)
 */

import type { Command } from "@/lib/commands/types";
import type { Shape } from "@/types/shapes";

interface ShapeData {
  type:
    | "rectangle"
    | "circle"
    | "ellipse"
    | "line"
    | "text"
    | "path"
    | "polygon";
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  pathData?: string;
  stroke?: string;
  points?: { x: number; y: number }[];
  angle?: number;
  strokeWidth?: number;
  strokeColor?: string;
  fillColor: string;
  createdBy: string;
  createdAt: number;
  lastModified: number;
  lastModifiedBy: string;
}

export class CreateShapeCommand implements Command {
  private shapeId: string | null = null;
  private shapeData: ShapeData;
  private createShapeFn: (data: Omit<Shape, "_id">) => Promise<string>;
  private deleteShapeFn: (shapeId: string) => Promise<void>;

  constructor(
    shapeData: ShapeData,
    createShapeFn: (data: Omit<Shape, "_id">) => Promise<string>,
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
    if (this.shapeId) {
      try {
        await this.deleteShapeFn(this.shapeId);
      } catch (error) {
        // If shape was already deleted, that's okay - just log it
        if (
          error instanceof Error &&
          error.message?.includes("nonexistent document")
        ) {
          // Shape already deleted, no action needed
        } else {
          throw error;
        }
      }
    }
  }

  async redo(): Promise<void> {
    if (this.shapeId) {
      // Create shape again - will get a new ID
      this.shapeId = await this.createShapeFn(this.shapeData);
    }
  }

  getShapeId(): string | null {
    return this.shapeId;
  }
}

/**
 * Command for creating a shape
 * Supports undo (delete) and redo (create again)
 */

import type { Command } from "./types";
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
    console.log("[CreateShapeCommand] Executing with data:", this.shapeData);
    this.shapeId = await this.createShapeFn(this.shapeData);
    console.log("[CreateShapeCommand] Created shape with ID:", this.shapeId);
    console.log(
      "[CreateShapeCommand] ID type check - starts with 'temp_'?",
      this.shapeId?.startsWith("temp_"),
    );
  }

  async undo(): Promise<void> {
    if (this.shapeId) {
      try {
        console.log(
          "[CreateShapeCommand] Attempting to undo (delete) shape:",
          this.shapeId,
        );
        await this.deleteShapeFn(this.shapeId);
        console.log(
          "[CreateShapeCommand] Successfully deleted shape:",
          this.shapeId,
        );
      } catch (error: any) {
        // If shape was already deleted, that's okay - just log it
        if (error.message?.includes("nonexistent document")) {
          console.log(
            "[CreateShapeCommand] Shape already deleted:",
            this.shapeId,
          );
        } else {
          console.error(
            "[CreateShapeCommand] Failed to delete shape:",
            this.shapeId,
            error,
          );
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
}

/**
 * Presence types for multiplayer cursor tracking
 */

import type { Id } from "@/convex/_generated/dataModel";

/**
 * Cursor position in canvas coordinates
 */
export interface CursorPosition {
  x: number;
  y: number;
}

/**
 * Presence record matching Convex schema
 */
export interface Presence {
  _id: Id<"presence">;
  _creationTime: number;
  userId: string;
  userName: string;
  cursorX: number;
  cursorY: number;
  color: string;
  lastActive: number;
}

/**
 * Active user with cursor information
 */
export interface ActiveUser {
  userId: string;
  userName: string;
  cursorX: number;
  cursorY: number;
  color: string;
}

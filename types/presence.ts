/**
 * Presence types for multiplayer cursor tracking
 */

import type { Id } from "@/convex/_generated/dataModel";

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

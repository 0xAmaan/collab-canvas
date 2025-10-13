import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Database Schema for CollabCanvas MVP
export default defineSchema({
  // Shapes table - stores all rectangle shapes on the canvas
  shapes: defineTable({
    x: v.number(), // X position on canvas
    y: v.number(), // Y position on canvas
    width: v.number(), // Shape width
    height: v.number(), // Shape height
    fill: v.string(), // Fill color (hex)
    createdBy: v.string(), // User ID (from Clerk)
    createdAt: v.number(), // Timestamp
    lastModified: v.number(), // Last modified timestamp
  }).index("by_created_at", ["createdAt"]),

  // Presence table - tracks online users and their cursor positions
  presence: defineTable({
    userId: v.string(), // User ID (from Clerk)
    userName: v.string(), // User display name
    cursorX: v.number(), // Cursor X position
    cursorY: v.number(), // Cursor Y position
    color: v.string(), // Assigned user color (for cursor)
    lastActive: v.number(), // Last activity timestamp
  })
    .index("by_user", ["userId"])
    .index("by_last_active", ["lastActive"]),
});

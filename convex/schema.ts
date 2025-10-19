import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Database Schema for CollabCanvas
export default defineSchema({
  // Shapes table - stores all shapes on the canvas (rectangle, circle, ellipse, line, text)
  shapes: defineTable({
    type: v.union(
      v.literal("rectangle"),
      v.literal("circle"),
      v.literal("ellipse"),
      v.literal("line"),
      v.literal("text"),
      v.literal("path"),
      v.literal("polygon"), // Polygon shape type
    ), // Shape type
    // Common position/size fields (used by rectangle, circle, ellipse, text)
    x: v.optional(v.number()), // X position on canvas
    y: v.optional(v.number()), // Y position on canvas
    width: v.optional(v.number()), // Shape width
    height: v.optional(v.number()), // Shape height
    // Line-specific fields (two-point system)
    x1: v.optional(v.number()), // Line start X
    y1: v.optional(v.number()), // Line start Y
    x2: v.optional(v.number()), // Line end X
    y2: v.optional(v.number()), // Line end Y
    // Text-specific fields
    text: v.optional(v.string()), // Text content
    fontSize: v.optional(v.number()), // Font size
    fontFamily: v.optional(v.string()), // Font family
    // Path-specific fields (for pencil/pen tool)
    pathData: v.optional(v.string()), // SVG path data as JSON string
    stroke: v.optional(v.string()), // Stroke color for paths
    strokeWidth: v.optional(v.number()), // Stroke width for paths
    // Polygon-specific fields
    points: v.optional(v.array(v.object({ x: v.number(), y: v.number() }))), // Array of polygon vertices
    // Common styling
    fill: v.optional(v.string()), // Fill color (hex) - also used for text color and line stroke. Optional for paths which use stroke instead.
    angle: v.optional(v.number()), // Rotation angle in degrees (0-360)
    // Metadata
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

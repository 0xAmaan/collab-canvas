import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Shape Mutations and Queries
 * Handles all shape operations on the shared canvas
 */

// ============================================================================
// MUTATIONS (Write Operations)
// ============================================================================

/**
 * Create a new shape on the canvas
 * Supports: rectangle, circle, ellipse, line, text
 */
export const createShape = mutation({
  args: {
    type: v.union(
      v.literal("rectangle"),
      v.literal("circle"),
      v.literal("ellipse"),
      v.literal("line"),
      v.literal("text"),
    ),
    // Common fields
    x: v.optional(v.number()),
    y: v.optional(v.number()),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    // Line fields
    x1: v.optional(v.number()),
    y1: v.optional(v.number()),
    x2: v.optional(v.number()),
    y2: v.optional(v.number()),
    // Text fields
    text: v.optional(v.string()),
    fontSize: v.optional(v.number()),
    fontFamily: v.optional(v.string()),
    // Styling
    fill: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify user is authenticated
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      throw new Error("Not authenticated");
    }

    // Insert new shape into database
    const shapeId = await ctx.db.insert("shapes", {
      type: args.type,
      x: args.x,
      y: args.y,
      width: args.width,
      height: args.height,
      x1: args.x1,
      y1: args.y1,
      x2: args.x2,
      y2: args.y2,
      text: args.text,
      fontSize: args.fontSize,
      fontFamily: args.fontFamily,
      fill: args.fill,
      createdBy: user.subject, // Clerk user ID
      createdAt: Date.now(),
      lastModified: Date.now(),
    });

    return shapeId;
  },
});

/**
 * Update shape properties (position, size, color)
 * Used for comprehensive shape updates
 */
export const updateShape = mutation({
  args: {
    shapeId: v.id("shapes"),
    x: v.optional(v.number()),
    y: v.optional(v.number()),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    angle: v.optional(v.number()),
    fill: v.optional(v.string()),
    // Line fields
    x1: v.optional(v.number()),
    y1: v.optional(v.number()),
    x2: v.optional(v.number()),
    y2: v.optional(v.number()),
    // Text fields
    text: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify user is authenticated
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      throw new Error("Not authenticated");
    }

    // Build update object with only provided fields
    const updates: any = {
      lastModified: Date.now(),
    };

    if (args.x !== undefined) updates.x = args.x;
    if (args.y !== undefined) updates.y = args.y;
    if (args.width !== undefined) updates.width = args.width;
    if (args.height !== undefined) updates.height = args.height;
    if (args.angle !== undefined) updates.angle = args.angle;
    if (args.fill !== undefined) updates.fill = args.fill;
    if (args.x1 !== undefined) updates.x1 = args.x1;
    if (args.y1 !== undefined) updates.y1 = args.y1;
    if (args.x2 !== undefined) updates.x2 = args.x2;
    if (args.y2 !== undefined) updates.y2 = args.y2;
    if (args.text !== undefined) updates.text = args.text;

    // Update the shape
    await ctx.db.patch(args.shapeId, updates);

    return args.shapeId;
  },
});

/**
 * Move a shape to a new position
 * Optimized for the most common operation (dragging shapes)
 * Separated from updateShape for performance
 */
export const moveShape = mutation({
  args: {
    shapeId: v.id("shapes"),
    x: v.number(),
    y: v.number(),
  },
  handler: async (ctx, args) => {
    // Verify user is authenticated
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      throw new Error("Not authenticated");
    }

    // Quick update - only position and timestamp
    await ctx.db.patch(args.shapeId, {
      x: args.x,
      y: args.y,
      lastModified: Date.now(),
    });

    return args.shapeId;
  },
});

/**
 * Delete a shape from the canvas
 * Called when user presses Delete/Backspace with shape selected
 */
export const deleteShape = mutation({
  args: {
    shapeId: v.id("shapes"),
  },
  handler: async (ctx, args) => {
    // Verify user is authenticated
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      throw new Error("Not authenticated");
    }

    // Delete the shape
    await ctx.db.delete(args.shapeId);

    return args.shapeId;
  },
});

// ============================================================================
// QUERIES (Read Operations)
// ============================================================================

/**
 * Get all shapes on the canvas
 * This is the main subscription point - Convex will push updates to all clients
 * Shapes are ordered by creation time (rendering order)
 */
export const getShapes = query({
  handler: async (ctx) => {
    // Get all shapes ordered by creation time
    const shapes = await ctx.db
      .query("shapes")
      .withIndex("by_created_at", (q) => q)
      .collect();

    return shapes;
  },
});

/**
 * Get a single shape by ID
 * Useful for detail views or specific operations
 */
export const getShape = query({
  args: {
    shapeId: v.id("shapes"),
  },
  handler: async (ctx, args) => {
    const shape = await ctx.db.get(args.shapeId);
    return shape;
  },
});

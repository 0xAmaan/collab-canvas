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
 * Create a new rectangle shape on the canvas
 * Called when user clicks canvas in rectangle creation mode
 */
export const createShape = mutation({
  args: {
    x: v.number(),
    y: v.number(),
    width: v.number(),
    height: v.number(),
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
      x: args.x,
      y: args.y,
      width: args.width,
      height: args.height,
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

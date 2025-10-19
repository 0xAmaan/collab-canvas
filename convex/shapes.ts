import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

/**
 * Shape Mutations and Queries
 * Handles all shape operations on the shared canvas
 */

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if user has access to a project
 * Returns project data and ownership status
 * Throws error if no access
 */
async function checkProjectAccess(ctx: any, projectId: Id<"projects">) {
  const project = await ctx.db.get(projectId);
  if (!project) {
    throw new Error("Project not found");
  }

  const user = await ctx.auth.getUserIdentity();
  const isOwner = user?.subject === project.ownerId;
  const canAccess = isOwner || project.isPublic;

  if (!canAccess) {
    throw new Error("No access to this project");
  }

  return { project, isOwner };
}

// ============================================================================
// MUTATIONS (Write Operations)
// ============================================================================

/**
 * Create a new shape on the canvas
 * Supports: rectangle, circle, ellipse, line, text, path
 */
export const createShape = mutation({
  args: {
    projectId: v.id("projects"),
    type: v.union(
      v.literal("rectangle"),
      v.literal("circle"),
      v.literal("ellipse"),
      v.literal("line"),
      v.literal("text"),
      v.literal("path"),
      v.literal("polygon"),
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
    // Path fields
    pathData: v.optional(v.string()),
    stroke: v.optional(v.string()),
    strokeWidth: v.optional(v.number()),
    // Polygon fields
    points: v.optional(v.array(v.object({ x: v.number(), y: v.number() }))),
    // Styling (optional for paths which use stroke instead)
    fill: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify user is authenticated
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      throw new Error("Not authenticated");
    }

    // Check project access (must have write permission)
    await checkProjectAccess(ctx, args.projectId);

    // Get max zIndex within this project to assign new shape to front
    const projectShapes = await ctx.db
      .query("shapes")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    const maxZIndex = projectShapes.reduce(
      (max, shape) => Math.max(max, shape.zIndex ?? -1),
      -1,
    );
    const newZIndex = maxZIndex + 1;

    // Insert new shape into database
    const shapeId = await ctx.db.insert("shapes", {
      projectId: args.projectId,
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
      pathData: args.pathData,
      stroke: args.stroke,
      strokeWidth: args.strokeWidth,
      points: args.points,
      fill: args.fill,
      zIndex: newZIndex,
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
    // Path fields
    pathData: v.optional(v.string()),
    stroke: v.optional(v.string()),
    strokeWidth: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Verify user is authenticated
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      throw new Error("Not authenticated");
    }

    // Check if shape exists first (prevent race condition with deletion)
    const shape = await ctx.db.get(args.shapeId);
    if (!shape) {
      // Shape was deleted, silently return (this is expected behavior)
      return args.shapeId;
    }

    // Check project access
    await checkProjectAccess(ctx, shape.projectId);

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
    if (args.pathData !== undefined) updates.pathData = args.pathData;
    if (args.stroke !== undefined) updates.stroke = args.stroke;
    if (args.strokeWidth !== undefined) updates.strokeWidth = args.strokeWidth;

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

    // Check if shape exists first (prevent race condition with deletion)
    const shape = await ctx.db.get(args.shapeId);
    if (!shape) {
      // Shape was deleted, silently return (this is expected behavior)
      return args.shapeId;
    }

    // Check project access
    await checkProjectAccess(ctx, shape.projectId);

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

    // Check if shape exists
    const shape = await ctx.db.get(args.shapeId);
    if (!shape) {
      return args.shapeId;
    }

    // Check project access
    await checkProjectAccess(ctx, shape.projectId);

    // Delete the shape
    await ctx.db.delete(args.shapeId);

    return args.shapeId;
  },
});

// ============================================================================
// QUERIES (Read Operations)
// ============================================================================

/**
 * Get all shapes on the canvas for a specific project
 * This is the main subscription point - Convex will push updates to all clients
 * Shapes are ordered by z-index (rendering order)
 * Returns empty array if project access fails
 */
export const getShapes = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    try {
      // Check project access
      await checkProjectAccess(ctx, args.projectId);

      // Get all shapes for this project
      const shapes = await ctx.db
        .query("shapes")
        .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
        .collect();

      // Sort by zIndex (handle undefined as 0, ascending order)
      shapes.sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));

      return shapes;
    } catch (error: any) {
      // Log error but return empty array instead of crashing client
      console.error("getShapes error:", error.message);
      return [];
    }
  },
});

/**
 * Get a single shape by ID
 * Useful for detail views or specific operations
 * Returns null if shape not found or access denied
 */
export const getShape = query({
  args: {
    shapeId: v.id("shapes"),
  },
  handler: async (ctx, args) => {
    try {
      const shape = await ctx.db.get(args.shapeId);
      if (!shape) {
        return null;
      }

      // Check project access
      await checkProjectAccess(ctx, shape.projectId);

      return shape;
    } catch (error: any) {
      // Log error but return null instead of crashing client
      console.error("getShape error:", error.message);
      return null;
    }
  },
});

/**
 * Update z-index of a single shape
 * Used for layer reordering operations
 */
export const updateZIndex = mutation({
  args: {
    shapeId: v.id("shapes"),
    zIndex: v.number(),
  },
  handler: async (ctx, args) => {
    // Verify user is authenticated
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      throw new Error("Not authenticated");
    }

    // Check if shape exists
    const shape = await ctx.db.get(args.shapeId);
    if (!shape) {
      return args.shapeId;
    }

    // Check project access
    await checkProjectAccess(ctx, shape.projectId);

    // Update z-index
    await ctx.db.patch(args.shapeId, {
      zIndex: args.zIndex,
      lastModified: Date.now(),
    });

    return args.shapeId;
  },
});

/**
 * Batch update z-indices for multiple shapes
 * Used for efficient layer reordering (drag-and-drop)
 */
export const reorderShapes = mutation({
  args: {
    projectId: v.id("projects"),
    updates: v.array(
      v.object({
        id: v.id("shapes"),
        zIndex: v.number(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    // Verify user is authenticated
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      throw new Error("Not authenticated");
    }

    // Check project access
    await checkProjectAccess(ctx, args.projectId);

    // Update all shapes in batch
    for (const update of args.updates) {
      const shape = await ctx.db.get(update.id);
      if (shape) {
        await ctx.db.patch(update.id, {
          zIndex: update.zIndex,
          lastModified: Date.now(),
        });
      }
    }

    return true;
  },
});

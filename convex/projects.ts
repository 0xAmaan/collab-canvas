import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

/**
 * Project Management Operations
 * Handles project CRUD with permission checks (private/public)
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

/**
 * Check if user owns a project
 * Throws error if not owner
 */
async function checkProjectOwnership(ctx: any, projectId: Id<"projects">) {
  const project = await ctx.db.get(projectId);
  if (!project) {
    throw new Error("Project not found");
  }

  const user = await ctx.auth.getUserIdentity();
  if (!user) {
    throw new Error("Not authenticated");
  }

  if (user.subject !== project.ownerId) {
    throw new Error("Only project owner can perform this action");
  }

  return project;
}

// ============================================================================
// MUTATIONS (Write Operations)
// ============================================================================

/**
 * Create a new project
 * Projects are private by default (isPublic = false)
 */
export const createProject = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify user is authenticated
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      throw new Error("Not authenticated");
    }

    // Create new project
    const projectId = await ctx.db.insert("projects", {
      name: args.name,
      ownerId: user.subject,
      isPublic: false, // Private by default
      createdAt: Date.now(),
      lastModified: Date.now(),
    });

    return projectId;
  },
});

/**
 * Update project name and/or visibility
 * Only owner can update
 */
export const updateProject = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Verify ownership
    await checkProjectOwnership(ctx, args.projectId);

    // Build update object
    const updates: any = {
      lastModified: Date.now(),
    };

    if (args.name !== undefined) {
      updates.name = args.name;
    }
    if (args.isPublic !== undefined) {
      updates.isPublic = args.isPublic;
    }

    // Update project
    await ctx.db.patch(args.projectId, updates);

    return args.projectId;
  },
});

/**
 * Delete a project and all its shapes
 * Only owner can delete
 */
export const deleteProject = mutation({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    // Verify ownership
    await checkProjectOwnership(ctx, args.projectId);

    // Delete all shapes in this project
    const shapes = await ctx.db
      .query("shapes")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    for (const shape of shapes) {
      await ctx.db.delete(shape._id);
    }

    // Delete all presence records for this project
    const presenceRecords = await ctx.db
      .query("presence")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    for (const presence of presenceRecords) {
      await ctx.db.delete(presence._id);
    }

    // Delete the project itself
    await ctx.db.delete(args.projectId);

    return args.projectId;
  },
});

/**
 * Duplicate a project (clone with all shapes)
 * Creates a new project with copies of all shapes
 */
export const duplicateProject = mutation({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    // Verify user is authenticated
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      throw new Error("Not authenticated");
    }

    // Check access to source project
    const { project } = await checkProjectAccess(ctx, args.projectId);

    // Create new project with same name + " (Copy)"
    const newProjectId = await ctx.db.insert("projects", {
      name: `${project.name} (Copy)`,
      ownerId: user.subject, // New owner is current user
      isPublic: false, // Always private for new copy
      createdAt: Date.now(),
      lastModified: Date.now(),
    });

    // Get all shapes from source project
    const shapes = await ctx.db
      .query("shapes")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    // Copy all shapes to new project
    for (const shape of shapes) {
      const { _id, _creationTime, projectId, ...shapeData } = shape;
      await ctx.db.insert("shapes", {
        ...shapeData,
        projectId: newProjectId,
        createdBy: user.subject,
        createdAt: Date.now(),
        lastModified: Date.now(),
      });
    }

    return newProjectId;
  },
});

/**
 * Update project thumbnail
 * Only owner can update
 */
export const updateProjectThumbnail = mutation({
  args: {
    projectId: v.id("projects"),
    thumbnail: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify ownership
    await checkProjectOwnership(ctx, args.projectId);

    // Update thumbnail
    await ctx.db.patch(args.projectId, {
      thumbnail: args.thumbnail,
      lastModified: Date.now(),
    });

    return args.projectId;
  },
});

// ============================================================================
// QUERIES (Read Operations)
// ============================================================================

/**
 * Get all projects owned by current user
 * Sorted by last modified (newest first)
 * Returns empty array if not authenticated (allows graceful loading)
 */
export const getMyProjects = query({
  handler: async (ctx) => {
    try {
      // Verify user is authenticated
      const user = await ctx.auth.getUserIdentity();
      if (!user) {
        // Return empty array instead of throwing - allows page to load
        // User will be redirected by middleware if they need to authenticate
        console.log(
          "getMyProjects: User not authenticated, returning empty array",
        );
        return [];
      }

      // Get all projects owned by user, sorted by last modified
      const projects = await ctx.db
        .query("projects")
        .withIndex("by_owner", (q) => q.eq("ownerId", user.subject))
        .collect();

      // Sort by lastModified descending (newest first)
      projects.sort((a, b) => b.lastModified - a.lastModified);

      return projects;
    } catch (error: any) {
      // Log error but return empty array instead of crashing client
      console.error("getMyProjects error:", error.message);
      return [];
    }
  },
});

/**
 * Get a single project by ID
 * Checks permissions (owner or public)
 * Returns null if project doesn't exist or user doesn't have access
 */
export const getProject = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    try {
      const { project, isOwner } = await checkProjectAccess(
        ctx,
        args.projectId,
      );
      return { ...project, isOwner };
    } catch (error: any) {
      // Log the error for debugging but don't throw to client
      console.error("getProject error:", error.message);

      // Return null instead of throwing - allows client to handle gracefully
      // This prevents "Server Error" in production
      return null;
    }
  },
});

/**
 * Get all public projects (for discovery)
 * Optional feature for browsing public canvases
 */
export const getPublicProjects = query({
  handler: async (ctx) => {
    const projects = await ctx.db
      .query("projects")
      .filter((q) => q.eq(q.field("isPublic"), true))
      .collect();

    // Sort by lastModified descending (newest first)
    projects.sort((a, b) => b.lastModified - a.lastModified);

    return projects;
  },
});

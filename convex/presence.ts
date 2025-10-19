import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Presence Mutations and Queries
 * Tracks online users and their cursor positions for multiplayer features
 */

// ============================================================================
// MUTATIONS (Write Operations)
// ============================================================================

/**
 * Join the canvas - create or update presence record
 * Called when user enters a project
 * Idempotent - safe to call multiple times
 */
export const joinCanvas = mutation({
  args: {
    projectId: v.id("projects"),
    userName: v.string(),
    color: v.string(), // Cursor color assigned by client
  },
  handler: async (ctx, args) => {
    // Verify user is authenticated
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      throw new Error("Not authenticated");
    }

    const userId = user.subject;

    // Check if presence record already exists for this user in this project
    const existing = await ctx.db
      .query("presence")
      .withIndex("by_user_project", (q) =>
        q.eq("userId", userId).eq("projectId", args.projectId),
      )
      .first();

    if (existing) {
      // Update existing presence record
      await ctx.db.patch(existing._id, {
        userName: args.userName,
        color: args.color,
        lastActive: Date.now(),
      });
      return existing._id;
    } else {
      // Create new presence record
      const presenceId = await ctx.db.insert("presence", {
        projectId: args.projectId,
        userId,
        userName: args.userName,
        cursorX: 0,
        cursorY: 0,
        color: args.color,
        lastActive: Date.now(),
      });
      return presenceId;
    }
  },
});

/**
 * Update cursor position
 * High-frequency operation - called on every mouse move (throttled to 50ms on client)
 * Lightweight update - only cursor coordinates and timestamp
 */
export const updatePresence = mutation({
  args: {
    projectId: v.id("projects"),
    cursorX: v.number(),
    cursorY: v.number(),
  },
  handler: async (ctx, args) => {
    // Verify user is authenticated
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      throw new Error("Not authenticated");
    }

    const userId = user.subject;

    // Find user's presence record for this project
    const presence = await ctx.db
      .query("presence")
      .withIndex("by_user_project", (q) =>
        q.eq("userId", userId).eq("projectId", args.projectId),
      )
      .first();

    if (!presence) {
      // Silently return - this is normal during tab switches when presence was cleaned up
      // The visibility change handler will automatically rejoin when tab becomes visible
      return null;
    }

    // Update cursor position and activity timestamp
    await ctx.db.patch(presence._id, {
      cursorX: args.cursorX,
      cursorY: args.cursorY,
      lastActive: Date.now(),
    });

    return presence._id;
  },
});

/**
 * Heartbeat - keep presence alive
 * Called every 5 seconds to prevent stale presence records
 * Only updates timestamp - no other data
 */
export const heartbeat = mutation({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    // Verify user is authenticated
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      throw new Error("Not authenticated");
    }

    const userId = user.subject;

    // Find user's presence record for this project
    const presence = await ctx.db
      .query("presence")
      .withIndex("by_user_project", (q) =>
        q.eq("userId", userId).eq("projectId", args.projectId),
      )
      .first();

    if (!presence) {
      // Silently fail - user may have left and cron cleaned up
      return null;
    }

    // Update only the lastActive timestamp
    await ctx.db.patch(presence._id, {
      lastActive: Date.now(),
    });

    return presence._id;
  },
});

/**
 * Leave the canvas - remove presence record
 * Called on unmount (best effort via beforeunload)
 * Ensures clean exit when possible
 */
export const leaveCanvas = mutation({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    // Verify user is authenticated
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      // Not authenticated - nothing to clean up
      return null;
    }

    const userId = user.subject;

    // Find and delete user's presence record for this project
    const presence = await ctx.db
      .query("presence")
      .withIndex("by_user_project", (q) =>
        q.eq("userId", userId).eq("projectId", args.projectId),
      )
      .first();

    if (presence) {
      await ctx.db.delete(presence._id);
      return presence._id;
    }

    return null;
  },
});

// ============================================================================
// QUERIES (Read Operations)
// ============================================================================

/**
 * Get all active users for a specific project
 * Returns users with recent activity (within last 30 seconds)
 * This is the main subscription point for multiplayer cursors and presence panel
 */
export const getActiveUsers = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    // Calculate cutoff time (30 seconds ago)
    const cutoffTime = Date.now() - 30 * 1000;

    // Get all presence records for this project with recent activity
    const activeUsers = await ctx.db
      .query("presence")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    // Filter to only recent activity (last 30 seconds)
    return activeUsers.filter((user) => user.lastActive >= cutoffTime);
  },
});

/**
 * Get presence for a specific user
 * Useful for debugging or user-specific tracking
 */
export const getUserPresence = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const presence = await ctx.db
      .query("presence")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    return presence;
  },
});

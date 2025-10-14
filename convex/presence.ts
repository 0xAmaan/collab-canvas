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
 * Called when user enters the dashboard
 * Idempotent - safe to call multiple times
 */
export const joinCanvas = mutation({
  args: {
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

    // Check if presence record already exists
    const existing = await ctx.db
      .query("presence")
      .withIndex("by_user", (q) => q.eq("userId", userId))
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

    // Find user's presence record
    const presence = await ctx.db
      .query("presence")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!presence) {
      // Return null instead of throwing to prevent console spam during race conditions
      // This happens when tab is hidden for too long and presence gets cleaned up
      // The visibility change handler will rejoin when tab becomes visible again
      console.warn(
        `[updatePresence] Presence record not found for user ${userId}. User may need to rejoin.`,
      );
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
  handler: async (ctx) => {
    // Verify user is authenticated
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      throw new Error("Not authenticated");
    }

    const userId = user.subject;

    // Find user's presence record
    const presence = await ctx.db
      .query("presence")
      .withIndex("by_user", (q) => q.eq("userId", userId))
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
  handler: async (ctx) => {
    // Verify user is authenticated
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      // Not authenticated - nothing to clean up
      return null;
    }

    const userId = user.subject;

    // Find and delete user's presence record
    const presence = await ctx.db
      .query("presence")
      .withIndex("by_user", (q) => q.eq("userId", userId))
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
 * Get all active users
 * Returns users with recent activity (within last 30 seconds)
 * This is the main subscription point for multiplayer cursors and presence panel
 */
export const getActiveUsers = query({
  handler: async (ctx) => {
    // Calculate cutoff time (30 seconds ago)
    const cutoffTime = Date.now() - 30 * 1000;

    // Get all presence records with recent activity
    const activeUsers = await ctx.db
      .query("presence")
      .withIndex("by_last_active", (q) => q.gte("lastActive", cutoffTime))
      .collect();

    return activeUsers;
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

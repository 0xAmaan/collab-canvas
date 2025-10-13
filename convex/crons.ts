import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";

/**
 * Cron Jobs for Background Maintenance
 * Handles cleanup of stale presence records (ghost cursors)
 */

// ============================================================================
// INTERNAL MUTATIONS (Called by Cron Jobs)
// ============================================================================

/**
 * Clean up stale presence records
 * Removes users who haven't been active in the last 30 seconds
 * Handles cases where users disconnect without calling leaveCanvas
 * (browser crashes, network failures, etc.)
 */
export const cleanupStalePresence = internalMutation({
  handler: async (ctx) => {
    // Calculate cutoff time (30 seconds ago)
    const cutoffTime = Date.now() - 30 * 1000;

    // Find all stale presence records
    const staleRecords = await ctx.db
      .query("presence")
      .withIndex("by_last_active", (q) => q.lt("lastActive", cutoffTime))
      .collect();

    // Delete all stale records
    let deletedCount = 0;
    for (const record of staleRecords) {
      await ctx.db.delete(record._id);
      deletedCount++;
    }

    // Log cleanup results (visible in Convex dashboard logs)
    if (deletedCount > 0) {
      console.log(`Cleaned up ${deletedCount} stale presence record(s)`);
    }

    return { deletedCount };
  },
});

// ============================================================================
// CRON JOB CONFIGURATION
// ============================================================================

const crons = cronJobs();

/**
 * Run presence cleanup every 10 seconds
 * Ensures ghost cursors don't persist longer than 30 seconds
 * Frequent execution for responsive multiplayer experience
 */
crons.interval(
  "cleanup-stale-presence",
  { seconds: 10 }, // Run every 10 seconds
  internal.crons.cleanupStalePresence,
);

export default crons;

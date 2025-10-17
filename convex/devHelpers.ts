/**
 * Development helper functions
 * ONLY USE IN DEVELOPMENT - NOT FOR PRODUCTION
 */

import { mutation } from "./_generated/server";

/**
 * Delete all shapes from the database
 * Useful for clearing test data during development
 */
export const deleteAllShapes = mutation({
  handler: async (ctx) => {
    const shapes = await ctx.db.query("shapes").collect();
    
    for (const shape of shapes) {
      await ctx.db.delete(shape._id);
    }
    
    return { deleted: shapes.length };
  },
});

/**
 * Delete all presence data
 * Useful for clearing stale presence data
 */
export const deleteAllPresence = mutation({
  handler: async (ctx) => {
    const presence = await ctx.db.query("presence").collect();
    
    for (const p of presence) {
      await ctx.db.delete(p._id);
    }
    
    return { deleted: presence.length };
  },
});


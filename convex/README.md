# Convex Backend Documentation

## Overview

This directory contains all Convex backend code for CollabCanvas MVP. The backend handles:
- Real-time shape synchronization
- User presence tracking (multiplayer cursors)
- Authentication with Clerk
- Background cleanup jobs

## Files

### `schema.ts`
Defines the database schema with two tables:
- **shapes**: Stores all rectangle shapes on the canvas
- **presence**: Tracks online users and cursor positions

### `auth.config.ts`
Configures Clerk + Convex authentication integration using JWT tokens.

### `shapes.ts`
Shape operations for the collaborative canvas.

**Mutations:**
- `createShape(x, y, width, height, fill)` - Create new rectangle
- `updateShape(shapeId, ...)` - Update any shape properties
- `moveShape(shapeId, x, y)` - Fast position update (optimized)
- `deleteShape(shapeId)` - Delete a shape

**Queries:**
- `getShapes()` - Get all shapes (main subscription point)
- `getShape(shapeId)` - Get single shape by ID

### `presence.ts`
Multiplayer presence and cursor tracking.

**Mutations:**
- `joinCanvas(userName, color)` - User joins (idempotent)
- `updatePresence(cursorX, cursorY)` - Update cursor position
- `heartbeat()` - Keep presence alive (called every 5s)
- `leaveCanvas()` - User leaves (best-effort)

**Queries:**
- `getActiveUsers()` - Get users active in last 30 seconds
- `getUserPresence(userId)` - Get specific user's presence

### `crons.ts`
Background maintenance jobs.

**Jobs:**
- `cleanupStalePresence` - Runs every 10 seconds, removes inactive users

## Architecture Decisions

### Authentication
- Every mutation validates user authentication via Clerk
- Uses `ctx.auth.getUserIdentity()` to get Clerk user ID
- Unauthenticated requests throw errors

### Conflict Resolution
- **"Last Write Wins"** strategy for MVP simplicity
- Convex's consistency model ensures ordered writes
- Timestamps track when changes occurred

### Performance Optimizations
1. **Separate `moveShape` mutation** - Moving is 90% of operations
2. **Indexed queries** - All queries use database indexes
3. **Lightweight updates** - Heartbeat only updates timestamp
4. **Batch cleanup** - Cron removes stale records efficiently

### Presence Cleanup Strategy
Three-layer approach ensures no ghost cursors persist:
1. **Client heartbeat**: Updates every 5 seconds
2. **Query filtering**: `getActiveUsers` filters to last 30 seconds
3. **Cron cleanup**: Background job removes stale records every 10 seconds

## Data Flow

### Shape Creation
```
User clicks canvas →
Client calls createShape() →
Convex mutation executes with auth check →
Database updated →
Convex pushes update to all subscribed clients →
All users see new shape (<100ms)
```

### Cursor Movement
```
User moves mouse →
Client throttles to 50ms →
Client calls updatePresence() →
Convex updates presence record →
Other clients receive update via getActiveUsers subscription →
Cursors render at new position (<50ms)
```

### Stale Presence Cleanup
```
User's browser crashes (no cleanup) →
Heartbeat stops updating lastActive →
After 30 seconds, cron job runs →
Detects lastActive > 30s old →
Deletes presence record →
Cursor disappears from other users' screens
```

## Testing

### Convex Dashboard Testing
1. Go to [dashboard.convex.dev](https://dashboard.convex.dev)
2. Navigate to **Functions** tab
3. Test each mutation/query with sample data
4. Check **Logs** tab for cron job execution

### Automated Testing
Run the test script from project root:
```bash
bun run test:convex
```

The test uses `Bun.env` to read environment variables from `.env.local`. Make sure you have `NEXT_PUBLIC_CONVEX_URL` configured.

### Real-Time Testing
1. Open 2 browser windows with different users
2. Create/move shapes in one window
3. Verify they appear in the other (<100ms)
4. Move cursor and verify it appears in real-time

## Common Issues

### "Not authenticated" errors
- Ensure Clerk is properly configured
- Check that `CLERK_JWT_ISSUER_DOMAIN` is set
- Verify user is logged in before calling mutations

### Stale cursors not cleaning up
- Check Convex dashboard logs for cron execution
- Verify cron job runs every 10 seconds
- Ensure `lastActive` timestamp is being updated

### Shapes not syncing
- Verify Convex dev server is running (`bunx convex dev`)
- Check browser console for subscription errors
- Test queries in Convex dashboard first

## Performance Metrics

Target performance (defined in PRD):
- **Shape sync latency**: <100ms
- **Cursor update latency**: <50ms
- **Presence updates**: 20 updates/second max (50ms throttle)
- **Cron frequency**: Every 10 seconds
- **Presence timeout**: 30 seconds

## Future Enhancements

Post-MVP improvements:
- Add optimistic locking for shape updates
- Implement CRDT/OT for conflict-free edits
- Add shape history/versioning
- Implement undo/redo with operation log
- Add per-user canvases/rooms
- Batch shape operations for better performance

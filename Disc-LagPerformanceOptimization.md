IMPLEMENT THIS LATER. NOT A CURRENT PRIORITY

- Deep dive on this, understand it, and figure out how to improve for Convex. Use Bun Websockets potentially?

🎯 Why It Feels Laggy

Look at Canvas.tsx:378-381:

// Throttle to 100ms (10 updates per second)
const now = Date.now();
if (now - lastMoveUpdateRef.current < 100) return;
lastMoveUpdateRef.current = now;

What's happening:

- User A drags a shape → object:moving fires at 60fps
- Only 1 out of every 6 frames gets sent to Convex (100ms throttle = 10 updates/sec)
- User B receives updates every 100ms → Sees the shape "jump" in 100ms intervals
- Result: Choppy, laggy experience for remote users

★ Insight ─────────────────────────────────────
Why throttle exists: Without throttling, you'd send 60 network requests per second while dragging! That would:
1. Overwhelm Convex with mutation requests
2. Drain your API quota (each mutation counts toward rate limits)
3. Increase latency (network congestion)
4. Cost money (more function invocations)

The current architecture trades smoothness for efficiency. It's a deliberate design decision, not a bug!
─────────────────────────────────────────────────

---
🚀 Your Proposed Architecture - Real-Time Creation & Movement

You asked: "Can we create the shape on mousedown, then show the resize live on browser B as well?"

Short answer: Yes, but with tradeoffs! Let me explain the architecture changes needed:

---
Option 1: WebSocket-Based Real-Time Movement (No Throttling)

Instead of using Convex mutations for every movement, use a separate real-time channel for ephemeral position
updates:

// New architecture flow:

┌─────────────────────────────────────────────────────┐
│  User A: Drags shape                                │
│    ↓                                                 │
│  object:moving fires (60fps)                        │
│    ↓                                                 │
│  Send position to WebSocket channel (NOT Convex)    │  ← New!
│    ↓                                                 │
│  User B receives via WebSocket (60fps)              │  ← Smooth!
│    ↓                                                 │
│  User B's canvas updates in real-time               │
│    ↓                                                 │
│  Mouse up → THEN save final position to Convex      │  ← Database only gets final state
└─────────────────────────────────────────────────────┘

How it works:

1. Create presence-like "ephemeral state" channel:
- Similar to cursor positions (which update every 50ms)
- Send shape positions through this channel
- Don't save every position to database
2. Database only stores final state:
- object:moving → Send via WebSocket (ephemeral)
- object:modified → Save to Convex (permanent)

Example implementation structure:

// In usePresence.ts - add shape position to presence record
const presenceRecord = {
userId,
userName,
cursorX,
cursorY,
activeShapeId: "shape_123",      // ← New field
activeShapeX: 450,                // ← New field
activeShapeY: 300,                // ← New field
lastActive: Date.now(),
};

// During drag:
// User A: Update presence with shape position every 16ms (60fps)
updatePresence({ activeShapeId, activeShapeX, activeShapeY });

// User B: Query presence, render temporary "ghost" shape
const allUsers = useQuery(api.presence.getActiveUsers);
allUsers.forEach(user => {
if (user.activeShapeId) {
    // Render semi-transparent "ghost" of User A's dragging shape
    renderGhostShape(user.activeShapeId, user.activeShapeX, user.activeShapeY);
}
});

---
Option 2: Operational Transformation (OT) / CRDT

This is what Figma and Google Docs use. It's complex but provides the smoothest experience:

// Every user maintains local state
// Changes are broadcast as "operations"

Operation examples:
- { type: "move", shapeId: "123", dx: 5, dy: 3 }
- { type: "resize", shapeId: "123", width: 200 }

// Other users apply operations immediately (optimistic)
// Conflict resolution happens automatically

Pros: Silky smooth, works offlineCons: Very complex to implement (weeks of work)

---
Option 3: Increase Throttle Rate (Quick Win)

Simplest solution: reduce throttle from 100ms → 16ms (60fps):

// Canvas.tsx:378
if (now - lastMoveUpdateRef.current < 16) return; // Was 100ms, now 16ms

Tradeoffs:

- ✅ Feels 6× smoother instantly
- ❌ 6× more Convex mutations (more API calls, higher cost)
- ❌ Higher database load
- ⚠️ May hit Convex rate limits faster

---
Option 4: Hybrid Approach (Recommended)

Combine Option 1 and 3:

1. Create shape on mousedown (like you suggested)
2. Broadcast position via presence during drag (ephemeral, 60fps)
3. Save to Convex only on mouseup (permanent)

Why this is best:

- ✅ Smooth for remote users (60fps position updates)
- ✅ Cheap (presence updates are lightweight)
- ✅ Database stays clean (only final positions saved)
- ✅ Works with existing Convex setup

---
📐 Implementation Roadmap for Hybrid Approach

Here's how you'd architect it (I won't code it, just explain):

Step 1: Extend Presence Schema

// convex/schema.ts
presence: defineTable({
userId: v.string(),
userName: v.string(),
cursorX: v.number(),
cursorY: v.number(),
color: v.string(),
lastActive: v.number(),

// NEW: Ephemeral shape drag state
draggingShapeId: v.optional(v.string()),
draggingShapeX: v.optional(v.number()),
draggingShapeY: v.optional(v.number()),
draggingShapeWidth: v.optional(v.number()),
draggingShapeHeight: v.optional(v.number()),
})

Step 2: Update Presence During Drag

// Canvas.tsx - object:moving handler
fabricCanvas.on("object:moving", async (opt) => {
if (!opt.target) return;

const data = opt.target.get("data") as { shapeId?: string } | undefined;
const shapeId = data?.shapeId;

if (!shapeId) return;

// Update presence (throttled to 16ms = 60fps)
const now = Date.now();
if (now - lastMoveUpdateRef.current < 16) return;
lastMoveUpdateRef.current = now;

// Send ephemeral position via presence (NOT database mutation)
updateDraggingPosition({
    shapeId,
    x: opt.target.left || 0,
    y: opt.target.top || 0,
    width: opt.target.width || 0,
    height: opt.target.height || 0,
});
});

// object:modified handler - save to database ONCE
fabricCanvas.on("object:modified", async (opt) => {
// ... existing code ...

// Clear dragging state from presence
clearDraggingPosition();

// Save final position to Convex
await updateShapeInConvex(shapeId, { x, y, width, height });
});

Step 3: Render Ephemeral Shapes

// Canvas.tsx - sync effect
useEffect(() => {
if (!fabricCanvasRef.current) return;

// Render shapes from database (permanent)
shapes.forEach(shape => {
    // ... existing shape rendering ...
});

// Render shapes being dragged by other users (ephemeral)
otherUsers.forEach(user => {
    if (user.draggingShapeId) {
    // Find the shape on canvas
    const fabricObj = fabricObjectMap.get(user.draggingShapeId);

    if (fabricObj && fabricObj !== activeObject) {
        // Update position in real-time (60fps!)
        fabricObj.set({
        left: user.draggingShapeX,
        top: user.draggingShapeY,
        width: user.draggingShapeWidth,
        height: user.draggingShapeHeight,
        });

        // Optional: Add visual indicator (e.g., pulsing border)
        fabricObj.set({
        stroke: user.color,
        strokeWidth: 2,
        opacity: 0.8,
        });
    }
    }
});

fabricCanvasRef.current.requestRenderAll();
}, [shapes, otherUsers]);

---
🎯 Comparison: Current vs Hybrid Architecture

| Aspect            | Current (Throttled Mutations) | Hybrid (Presence + Final Save) |
|-------------------|-------------------------------|--------------------------------|
| Smoothness        | 10 updates/sec (choppy)       | 60 updates/sec (silky)         |
| Database writes   | 10/sec while dragging         | 1 write on mouseup             |
| API cost          | Moderate                      | Low                            |
| Network traffic   | Moderate                      | Low (presence is lightweight)  |
| Complexity        | Simple                        | Moderate                       |
| Conflict handling | Automatic (last write wins)   | Need to handle race conditions |

---
🔍 Why Convex's Current Architecture Works This Way

Convex is optimized for queries, not high-frequency mutations:

- Queries (useQuery): Real-time subscriptions, super fast, cheap
- Mutations: Transactional, expensive, rate-limited

That's why cursor positions use presence (query-based) instead of mutations!

Your idea to use the same pattern for shape dragging is spot-on and aligns with Convex's design philosophy.

---
✅ Summary

Your intuition is 100% correct! The current architecture feels laggy because:

1. 100ms throttling limits updates to 10/second
2. Every drag movement hits the database (expensive)
3. Database updates are slower than WebSocket presence updates

The Hybrid Approach (Option 4) would give you Figma-like smoothness by:

1. Using presence for ephemeral drag state (60fps)
2. Saving to database only on mouseup (1 write)
3. Keeping costs low and performance high

This is a significant architectural improvement that would make your app feel professional and responsive! 🚀
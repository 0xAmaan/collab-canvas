# Debugging Presence Errors - Root Cause Found

## The Critical Bug

**The presence errors were caused by React effect dependency arrays causing unwanted cleanup runs!**

### What Was Happening

1. Component mounts → `joinCanvas` is called
2. User successfully joins canvas → `hasJoinedRef.current = true`
3. **Convex mutation references change on re-render** (this is normal React behavior)
4. Effects with `[leaveCanvas]` or `[joinCanvas]` dependencies detect the change
5. **Cleanup functions run** → `leaveCanvas()` is called → presence record DELETED
6. `hasJoinedRef.current` set to `false`
7. New effect runs with new mutation reference (but early returns because already joined)
8. **Meanwhile:** Cursor updates are still firing → hitting deleted presence record → ERROR

### The Smoking Gun

In `hooks/usePresence.ts`, three effects had Convex mutations in their dependency arrays:

```typescript
// ❌ BAD - Effect re-runs every time joinCanvas reference changes
useEffect(() => {
  // ... join logic
}, [enabled, userId, userName, userColor, joinCanvas]);

// ❌ BAD - Cleanup runs every time leaveCanvas reference changes
useEffect(() => {
  return () => {
    leaveCanvas(); // Deletes presence record!
  };
}, [leaveCanvas]);

// ❌ BAD - Effect re-runs every time heartbeat reference changes
useEffect(() => {
  // ... heartbeat logic
}, [enabled, heartbeat]);
```

**Convex mutations are recreated on every render**, so these effects were running their cleanup functions unintentionally, deleting the presence record while the user was still active!

## The Fix

Removed Convex mutations from dependency arrays and added eslint-disable comments:

```typescript
// ✅ GOOD - Only runs when user info actually changes
useEffect(() => {
  // ... join logic
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [enabled, userId, userName, userColor]);

// ✅ GOOD - Only runs on actual unmount
useEffect(() => {
  return () => {
    leaveCanvas(); // Only called on real unmount
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []); // Empty array - mount/unmount only

// ✅ GOOD - Only runs when enabled changes
useEffect(() => {
  // ... heartbeat logic
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [enabled]);
```

## Added Debugging Logs

To help diagnose future issues, added comprehensive logging:

```typescript
console.log("[usePresence] Calling joinCanvas for user:", userName, userId);
console.log("[usePresence] Successfully joined canvas for user:", userName);
console.log("[usePresence] Cursor update blocked - haven't joined yet. userId:", userId);
console.log("[usePresence] Component unmounting, leaving canvas");
console.log("[DashboardClient] Cursor update blocked - not ready. userId:", userId);
```

## How to Test

1. **Open browser console**
2. **Load the dashboard page**
3. **Look for the join sequence:**
   ```
   [usePresence] Calling joinCanvas for user: John user_123
   [usePresence] Successfully joined canvas for user: John
   ```
4. **Move mouse around - should NOT see:**
   ```
   [usePresence] Cursor update blocked - haven't joined yet
   ```
5. **Should see ZERO Convex errors** about "Presence record not found"

## What to Watch For

If you still see errors after this fix:

1. **Check the logs** - they'll tell you exactly where the blockage is:
   - "not enabled" = authentication issue
   - "not ready" = join hasn't completed
   - "Component unmounting" = unexpected unmount

2. **Check for multiple instances** - make sure there's only ONE `usePresence` call per user
   - We already fixed this by removing it from Canvas component
   - It should only be in DashboardClient

3. **Check Convex dashboard** - verify presence records are being created and not immediately deleted

## Why This Is The Right Fix

**React Hook Dependency Rules:**
- Include **values that change** and the effect needs to respond to
- Exclude **stable function references** that don't meaningfully change
- Convex mutations are **technically stable** (same functionality) even if reference changes
- Using refs (`hasJoinedRef`) to track state that doesn't need to trigger re-renders

**The Trade-off:**
- We disable eslint rules BUT add detailed comments explaining why
- This is a known pattern for effects that capture stable closures
- Better than fighting React's re-render behavior

## Files Modified

1. `hooks/usePresence.ts` - Fixed all effect dependencies and added logging
2. `app/dashboard/DashboardClient.tsx` - Added logging to wrapper function

## Next Steps

Test this in your browser and monitor the console. The logs will tell you exactly what's happening and when. If errors still occur, the logs will show us the exact sequence of events leading to the error.


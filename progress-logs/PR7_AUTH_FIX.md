# PR #7: Authentication Error Fix

**Date:** October 14, 2025  
**Issue:** Convex "Not authenticated" error on `presence:joinCanvas`

## Problem Description

The application was throwing this error:
```
[CONVEX M(presence:joinCanvas)] [Request ID: 8e786f0b41669d1f] Server Error
Uncaught Error: Not authenticated
    at handler (../convex/presence.ts:29:19)
```

## Root Cause

The `usePresence` hook was attempting to call `joinCanvas` mutation before Clerk had finished loading the authentication state. This happened because:

1. The Canvas component defaulted `userId` to `"anonymous"` when not provided
2. The `usePresence` hook was always `enabled: true`
3. The hook would immediately try to join the canvas on mount, even before authentication was ready
4. Convex mutations require authentication, causing the error

## Solution

Added authentication checks in two places:

### 1. Canvas Component (`components/canvas/Canvas.tsx`)

Added a check to only enable presence when we have a valid authenticated userId:

```typescript
// Only enable presence when we have a valid userId (not anonymous)
const isAuthenticated = userId !== "anonymous" && !!userId;
const { otherUsers, updateCursorPosition } = usePresence({
  userId,
  userName,
  userColor,
  enabled: isAuthenticated, // Only enable when authenticated
});
```

### 2. Presence Hook (`hooks/usePresence.ts`)

Added additional safety check in the join effect:

```typescript
// Join canvas on mount
useEffect(() => {
  if (!enabled || hasJoinedRef.current) return;
  
  // Additional safety check: don't join if userId is invalid
  if (!userId || userId === "anonymous") return;
  
  // ... rest of join logic
}, [enabled, userId, userName, userColor, joinCanvas]);
```

## Benefits

1. **No More Errors:** Prevents the "Not authenticated" error on initial load
2. **Graceful Degradation:** App works correctly while waiting for authentication
3. **Better UX:** No console errors visible to users
4. **Defensive Programming:** Multiple layers of protection against invalid state

## Testing

After this fix:
- ✅ No authentication errors on page load
- ✅ Presence works correctly once authentication completes
- ✅ Multiplayer cursors appear as expected
- ✅ No regressions in functionality

## Files Modified

1. `components/canvas/Canvas.tsx` - Added `isAuthenticated` check
2. `hooks/usePresence.ts` - Added userId validation in join effect

---

**Status:** ✅ Fixed  
**Verified:** Yes - error no longer appears


# PR12: Fix Presence Record Not Found Errors ✅

## Problem
When switching between browser tabs, users were experiencing "Presence record not found" errors. The issue occurred because:

1. **Background tab throttling**: When a tab loses focus, browsers throttle JavaScript execution
2. **Failed heartbeats**: The 5-second heartbeat interval couldn't keep `lastActive` updated in throttled background tabs
3. **Cron cleanup**: After 30 seconds of inactivity, the cron job would delete the presence record
4. **Continued cursor updates**: Fabric.js continued firing `mouse:move` events even in background tabs
5. **Race condition**: When switching back to the tab, cursor updates would fire before the rejoin process completed

This resulted in console errors like:
```
[CONVEX M(presence:updatePresence)] [Request ID: fa2416c1c8b47a1b] Server Error
Uncaught Error: Presence record not found. Call joinCanvas first.
```

## Solution

Implemented a multi-layered fix using the **Page Visibility API** to reliably detect and handle tab visibility changes:

### 1. Window Visibility Tracking (`hooks/usePresence.ts`)
- Added `isWindowVisibleRef` to track window visibility state using `document.hidden`
- Initialized with `typeof document !== "undefined" ? !document.hidden : true` for SSR compatibility

### 2. Block Cursor Updates When Hidden
**In `hooks/usePresence.ts` (throttledUpdatePresence):**
- Added checks for `document.hidden` and `isWindowVisibleRef.current`
- Cursor updates are completely blocked when the tab is in the background
- Multiple guards ensure no updates slip through

**In `components/canvas/Canvas.tsx` (mouse:move handler):**
- Added `if (!document.hidden)` check before calling `updateCursorPosition`
- Prevents cursor updates from even reaching the presence hook when hidden

### 3. Stop Heartbeat When Hidden
- Modified heartbeat effect to skip execution when `document.hidden === true`
- Saves resources and acknowledges that the tab is genuinely inactive
- Heartbeat returns early with log message instead of attempting to update

### 4. Visibility Change Handler
- **Replaced** focus event handler with `visibilitychange` event handler
- Page Visibility API is more reliable than focus events for tab switches
- Automatically rejoins when tab becomes visible again
- Updates `isWindowVisibleRef.current` on every visibility change
- Uses existing `isRejoiningRef` flag to prevent race conditions

### 5. Graceful Error Handling (`convex/presence.ts`)
- Changed `updatePresence` mutation to return `null` instead of throwing when presence record not found
- Logs warning with `console.warn` instead of throwing error
- Prevents console spam during race conditions
- Client-side visibility handler will trigger rejoin when appropriate

## Files Modified

1. **`hooks/usePresence.ts`**
   - Added `isWindowVisibleRef` for visibility tracking
   - Enhanced `throttledUpdatePresence` with visibility guards
   - Modified heartbeat to skip when hidden
   - Replaced focus handler with visibilitychange handler

2. **`components/canvas/Canvas.tsx`**
   - Added `document.hidden` check in `mouse:move` handler before cursor updates

3. **`convex/presence.ts`**
   - Made `updatePresence` return null instead of throwing on missing presence
   - Added warning log for debugging

## Why This Works

1. **Page Visibility API** specifically tracks tab visibility (not just window focus)
2. **Multi-layer blocking** ensures no cursor updates fire when tab is hidden
3. **Stopped heartbeats** acknowledge inactive state and save resources
4. **Atomic rejoining** via `isRejoiningRef` prevents race conditions
5. **Graceful degradation** with null returns instead of errors reduces console spam
6. **Immediate detection** via `visibilitychange` event (no polling/throttling delays)

## Testing Instructions

1. Open two browser tabs/windows with different users (e.g., amaan and amaan2)
2. Both users should see each other's cursors ✅
3. Focus Tab 1 and wait 35+ seconds
4. Tab 2's cursor should disappear from Tab 1 (expected behavior)
5. **Critical Test**: Move mouse in Tab 1 while Tab 2 is still unfocused in background
6. Switch back to Tab 2 (make it visible)
7. **Expected**: NO "Presence record not found" errors in console ✅
8. Tab 2 should automatically rejoin
9. Both cursors should reappear and work normally
10. Repeat in reverse direction to verify bidirectional fix

## Console Logs to Expect

When tab becomes hidden:
```
[usePresence] Visibility changed: hidden
[usePresence] Tab became hidden - cursor updates will be blocked
[usePresence] Cursor update blocked - window is hidden
[usePresence] Heartbeat skipped - window is hidden
```

When tab becomes visible again:
```
[usePresence] Visibility changed: visible
[usePresence] Tab became visible, checking if rejoin needed...
[usePresence] Not joined - rejoining now
[usePresence] Rejoined successfully on visibility change
```

## Technical Details

### Page Visibility API
- `document.hidden` - Boolean indicating if page is hidden
- `document.visibilityState` - String: "visible", "hidden", "prerender", "unloaded"
- `visibilitychange` event - Fires when visibility state changes
- Works for: tab switches, window minimization, OS-level app switching
- More reliable than `focus`/`blur` events for tab management

### Browser Behavior
- Background tabs: JavaScript throttled to ~1 execution per second or less
- `setInterval` in background: Can be delayed by 30+ seconds
- Page Visibility API: Events fire immediately on state change
- `document.hidden`: Accurate real-time visibility state

## Benefits

1. ✅ **No more "Presence record not found" errors**
2. ✅ **Cleaner console output** (warnings instead of errors)
3. ✅ **Better resource management** (no wasted heartbeats/updates when hidden)
4. ✅ **More reliable tab switching** (Page Visibility API)
5. ✅ **Automatic recovery** (rejoins seamlessly when tab becomes visible)
6. ✅ **No cursor update spam** in background tabs

## Related Issues

This fix resolves the core issue described where:
- User switches to inactive browser tab
- Sees 2-3 "Presence record not found" errors
- Has to manually trigger presence rejoin

Now the system:
- Prevents cursor updates when tab is hidden
- Automatically rejoins when tab becomes visible
- Handles the transition gracefully without errors

## Additional Fix: Window Focus Tracking

### Problem Discovered During Testing
After the initial fix, inactive browser cursors were NOT disappearing after 30 seconds because:
- `document.hidden` only detects tab switches within the same browser window
- When using separate browser windows, `document.hidden` stays `false` even when the window is unfocused
- Heartbeat continued running in background windows, keeping presence alive

### Solution: Track Window Focus
Added `isWindowFocusedRef` to track browser window focus using:
- `document.hasFocus()` - checks if entire browser window has focus
- `window.addEventListener('blur')` - detects when window loses focus
- `window.addEventListener('focus')` - detects when window gains focus

### Changes Made
1. Added `isWindowFocusedRef` ref initialized with `document.hasFocus()`
2. Enhanced heartbeat to skip when window is unfocused OR hidden
3. Added cursor update guard to block when window is unfocused
4. Added blur event listener to set `isWindowFocusedRef.current = false`
5. Enhanced focus event listener to set `isWindowFocusedRef.current = true`
6. Updated visibility change handler to track both visibility and focus

### Result
✅ **Inactive browser windows now properly stop sending heartbeats**
✅ **Presence records get cleaned up after 30 seconds of inactivity**
✅ **Active windows stay alive with regular heartbeats**
✅ **Seamless rejoin when switching back to inactive windows**
✅ **No more "Presence record not found" errors**

## Final Testing Results
- ✅ No errors when switching between browsers
- ✅ Inactive cursors disappear after 30 seconds
- ✅ Active cursors remain visible indefinitely
- ✅ Smooth rejoining when refocusing inactive browsers
- ✅ Cursor position preserved and sent after rejoin


# Test Plan: Real-time Sync & Delete Feature

## Prerequisites
- Two browser windows/tabs (or incognito mode for second user)
- Dev server running (`npm run dev`)
- Both users logged in with different accounts

## Test 1: Real-time Shape Creation

**Steps:**
1. Open Tab 1 (User A) at http://localhost:3002/dashboard
2. Open Tab 2 (User B) at http://localhost:3002/dashboard (incognito)
3. In Tab 1: Switch to rectangle tool (press 'R' or click rectangle icon)
4. In Tab 1: Click and drag to create a rectangle

**Expected Result:**
- ✅ Rectangle appears immediately in Tab 1 (optimistic update)
- ✅ Rectangle appears in Tab 2 within ~100ms (real-time sync)
- ✅ No refresh needed

## Test 2: Real-time Shape Movement

**Steps:**
1. Ensure both tabs are open with at least one shape visible
2. In Tab 1: Click rectangle tool to switch to select mode (or press Escape)
3. In Tab 1: Click and drag a shape to a new position
4. Watch Tab 2 (don't interact with it)

**Expected Result:**
- ✅ Shape moves smoothly in Tab 1 during drag
- ✅ After releasing mouse, shape position updates in Tab 2 within ~100ms
- ✅ No refresh needed
- ✅ Shape stays in new position after sync

**Previous Bug:** You had to manually refresh Tab 2 to see the new position.

## Test 3: Multiple Rapid Movements

**Steps:**
1. In Tab 1: Rapidly drag a shape around to multiple positions
2. Observe Tab 2

**Expected Result:**
- ✅ Each movement syncs to Tab 2
- ✅ No conflicts or shape jumping
- ✅ Final position matches in both tabs

## Test 4: Delete with Delete Key

**Steps:**
1. In Tab 1: Select a shape (click on it - should show blue border)
2. Press the Delete key
3. Observe both tabs

**Expected Result:**
- ✅ Shape disappears immediately from Tab 1
- ✅ Shape disappears from Tab 2 within ~100ms
- ✅ No errors in console

## Test 5: Delete with Backspace Key

**Steps:**
1. In Tab 1: Select a different shape
2. Press the Backspace key
3. Observe both tabs

**Expected Result:**
- ✅ Shape disappears immediately from Tab 1
- ✅ Shape disappears from Tab 2 within ~100ms
- ✅ No errors in console

## Test 6: Delete Without Selection

**Steps:**
1. In Tab 1: Click on empty canvas area (deselect any shape)
2. Press Delete or Backspace

**Expected Result:**
- ✅ Nothing happens (no errors)
- ✅ No shapes deleted

## Test 7: Concurrent Editing

**Steps:**
1. In Tab 1: Create a shape (Shape A)
2. In Tab 2: Create a shape (Shape B) at a different position
3. In Tab 1: Move Shape A
4. In Tab 2: Move Shape B
5. In Tab 1: Delete Shape A
6. In Tab 2: Delete Shape B

**Expected Result:**
- ✅ All operations sync correctly
- ✅ Both users can work simultaneously
- ✅ No shapes disappear unexpectedly
- ✅ No conflicts or errors

## Test 8: Drag Conflict Prevention

**Steps:**
1. In Tab 1: Start dragging a shape (hold mouse button down)
2. In Tab 2: Move the same shape while Tab 1 is still dragging
3. In Tab 1: Release the mouse button

**Expected Result:**
- ✅ Tab 1's drag is not interrupted by Tab 2's update
- ✅ After Tab 1 releases, the position syncs
- ✅ Last edit wins (Tab 1's final position)

## Test 9: Page Refresh Persistence

**Steps:**
1. Create several shapes in Tab 1
2. Move some shapes around
3. Delete one shape
4. Refresh Tab 1 (Cmd+R / Ctrl+R)

**Expected Result:**
- ✅ All shapes reload from database
- ✅ Positions match before refresh
- ✅ Deleted shape stays deleted

## Console Checks

Throughout all tests, check browser console for:
- ❌ No "Failed to sync shape movement" errors
- ❌ No "Failed to delete shape" errors
- ❌ No React/TypeScript errors
- ✅ Clean console (normal Convex connection messages OK)

## Performance Check

- Sync latency should be < 200ms in most cases
- No noticeable lag when dragging shapes locally
- Multiple rapid operations should not crash the app

## Edge Cases

### Test: Delete Shape Being Dragged by Another User
1. Tab 1: Start dragging Shape A
2. Tab 2: Delete Shape A (while Tab 1 is dragging)
3. Expected: Shape disappears from Tab 2, Tab 1 completes drag, then shape disappears from Tab 1 on sync

### Test: Create Shape While Another User is Moving
1. Tab 1: Start moving a shape
2. Tab 2: Create a new shape
3. Expected: Both operations complete successfully, no conflicts


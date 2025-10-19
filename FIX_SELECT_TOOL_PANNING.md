# Fix: Select Tool Panning vs Selection Behavior

## Problem Analysis

**Current Issue**: On the Move/Select tool, clicking and dragging on empty canvas space triggers panning instead of creating a selection box (multi-select rectangle).

**Root Cause**: Lines 1024-1031 in `Canvas.tsx`:
```typescript
// Enable panning when clicking empty space (removed Alt requirement for pan)
if (!opt.target) {
  isPanningRef.current = true;
  fabricCanvas.selection = false; // Disable selection during pan
  lastPosXRef.current = e.clientX;
  lastPosYRef.current = e.clientY;
  fabricCanvas.setCursor("grabbing");
}
```

This code was likely added to make panning easier, but it breaks Fabric.js's native multi-select behavior.

---

## Expected Behavior (Figma-style)

### Select/Move Tool:
1. **Click empty space + drag** → Draw selection box (multi-select)
2. **Click object** → Select single object
3. **Click object + drag** → Move object
4. **Shift + click objects** → Add to selection
5. **NO panning on click-drag** (use Hand tool or Alt+drag for panning)

### Hand Tool:
1. **Click + drag** → Pan canvas (already working ✓)
2. **No selection** (already working ✓)

---

## Solution Plan

### Fabric.js Native Selection Box

According to Fabric.js documentation, the canvas has a built-in selection box feature controlled by:
- `canvas.selection = true` → Enables selection box on empty space drag
- `canvas.selection = false` → Disables selection box

The selection box is Fabric.js's `_groupSelector` which automatically:
- Appears when dragging on empty space
- Shows a visual rectangle
- Selects all objects within the rectangle
- Creates an `ActiveSelection` object with all selected objects

### What Needs to Change

**Remove problematic code** in select mode mouse:down handler:
```typescript
// DELETE THIS SECTION (lines 1024-1031):
if (!opt.target) {
  isPanningRef.current = true;
  fabricCanvas.selection = false;
  lastPosXRef.current = e.clientX;
  lastPosYRef.current = e.clientY;
  fabricCanvas.setCursor("grabbing");
}
```

**Keep Alt+drag panning** (optional convenience feature):
```typescript
// Keep this section for Alt+drag pan in select mode:
if (!opt.target && e.altKey) {
  isPanningRef.current = true;
  fabricCanvas.selection = false;
  lastPosXRef.current = e.clientX;
  lastPosYRef.current = e.clientY;
  fabricCanvas.setCursor("grabbing");
}
```

---

## Implementation Steps

### Step 1: Update `mouse:down` handler in Canvas.tsx

**Current code (lines 966-1032)**:
```typescript
// Select mode with panning and Alt+drag duplication
if (activeToolRef.current === "select") {
  // Alt+drag duplication: Clone the shape and drag the duplicate
  if (e.altKey && opt.target) {
    // ... duplication code ...
    return;
  }

  // If clicking on an object (not Alt), we're dragging a shape
  if (opt.target) {
    isDraggingShapeRef.current = true;
    return;
  }

  // Enable panning when clicking empty space (removed Alt requirement for pan)
  if (!opt.target) {  // ← PROBLEM: This triggers on ANY empty click
    isPanningRef.current = true;
    fabricCanvas.selection = false;
    lastPosXRef.current = e.clientX;
    lastPosYRef.current = e.clientY;
    fabricCanvas.setCursor("grabbing");
  }
}
```

**Fixed code**:
```typescript
// Select mode with Alt+drag features
if (activeToolRef.current === "select") {
  // Alt+drag duplication: Clone the shape and drag the duplicate
  if (e.altKey && opt.target) {
    // ... keep existing duplication code ...
    return;
  }

  // Alt+drag panning: Pan canvas when clicking empty space with Alt
  if (e.altKey && !opt.target) {
    isPanningRef.current = true;
    fabricCanvas.selection = false; // Temporarily disable selection box
    lastPosXRef.current = e.clientX;
    lastPosYRef.current = e.clientY;
    fabricCanvas.setCursor("grabbing");
    return;
  }

  // If clicking on an object (not Alt), we're dragging a shape
  if (opt.target) {
    isDraggingShapeRef.current = true;
    return;
  }

  // If clicking empty space without Alt, let Fabric.js handle selection box
  // (No code needed - Fabric.js will automatically show selection rectangle)
}
```

### Step 2: Verify selection is enabled in tool change effect

**Check lines 1605-1654** - ensure selection is enabled for select mode:
```typescript
const isSelectMode = activeTool === "select";
fabricCanvasRef.current.selection = isSelectMode; // ✓ Already correct
```

### Step 3: Test multi-select functionality

After the fix, test:
1. ✓ Click-drag on empty space → Shows selection box
2. ✓ Selection box selects multiple shapes
3. ✓ Alt+drag on empty space → Pans canvas
4. ✓ Alt+drag on object → Duplicates object
5. ✓ Click on object → Selects it
6. ✓ Drag object → Moves it
7. ✓ Hand tool still pans

---

## Benefits of This Fix

### ✅ Proper Figma-like Behavior
- Select tool focuses on selection/manipulation
- Hand tool focuses on panning
- Clear separation of concerns

### ✅ Multi-Select Capability
- Users can select multiple objects with selection box
- Shift+click to add to selection still works
- Move/transform multiple objects at once

### ✅ Still Convenient
- Alt+drag panning available in select mode (bonus feature)
- Hand tool provides dedicated panning (H key or Spacebar)
- Best of both worlds

### ✅ Follows Fabric.js Patterns
- Uses native `canvas.selection` feature
- Leverages built-in `_groupSelector`
- Less custom code to maintain

---

## Alternative Considered

**Option A** (Current): Pan on click-drag in select mode
- ❌ Breaks multi-select
- ❌ Confusing - select tool doesn't select
- ❌ Makes hand tool redundant

**Option B** (Recommended): Selection box on click-drag, Alt+pan optional
- ✅ Multi-select works
- ✅ Clear tool purposes
- ✅ Alt+drag pan still available
- ✅ Hand tool for dedicated panning

---

## Code Changes Required

**File**: `components/canvas/Canvas.tsx`

**Line ~1024-1031**: Remove or modify

**From**:
```typescript
// Enable panning when clicking empty space (removed Alt requirement for pan)
if (!opt.target) {
  isPanningRef.current = true;
  fabricCanvas.selection = false;
  lastPosXRef.current = e.clientX;
  lastPosYRef.current = e.clientY;
  fabricCanvas.setCursor("grabbing");
}
```

**To**:
```typescript
// Alt+drag panning: Pan canvas when clicking empty space with Alt
if (e.altKey && !opt.target) {
  isPanningRef.current = true;
  fabricCanvas.selection = false; // Temporarily disable selection box
  lastPosXRef.current = e.clientX;
  lastPosYRef.current = e.clientY;
  fabricCanvas.setCursor("grabbing");
  return;
}

// If clicking empty space without Alt, let Fabric.js handle selection box
// (Fabric.js will automatically draw selection rectangle when dragging)
```

---

## Testing Checklist

After implementing:
- [ ] Select tool: Click-drag empty space shows selection box
- [ ] Select tool: Selection box selects multiple objects
- [ ] Select tool: Click object selects it
- [ ] Select tool: Drag object moves it
- [ ] Select tool: Alt+drag empty space pans canvas
- [ ] Select tool: Alt+drag object duplicates it
- [ ] Hand tool: Click-drag pans canvas
- [ ] Hand tool: Cannot select objects
- [ ] Spacebar temporary hand: Pans while held
- [ ] Multiplayer cursors still work
- [ ] Zoom still works

---

## Conclusion

This is a simple fix that restores Fabric.js's native multi-select functionality while maintaining convenient Alt+drag panning in select mode. The Hand tool provides dedicated panning for users who prefer it.

**Feasibility**: ✅ 100% feasible - just need to modify one condition in the mouse:down handler.

**Impact**: 🎯 High - fixes a major UX issue where users can't multi-select objects.

**Risk**: ⚠️ Low - minimal code change, leverages native Fabric.js behavior.


# Hover Selection Preview Plan

**Date**: 2025-10-18  
**Goal**: Show selection controls (resize/rotate handles) when hovering over objects in select mode

---

## Problem Analysis

### Current Behavior
- User hovers over shape → No visual feedback
- User clicks shape → Selection controls appear
- **Issue**: Not intuitive which shape will be selected

### Desired Behavior (Figma-like)
- User hovers over shape → Show selection border/controls (preview)
- User clicks shape → Shape becomes selected (already works)
- **Result**: Clear visual feedback before clicking

---

## Fabric.js Research Results

### ✅ Available Events
1. **`mouse:over`** - Fired when mouse enters an object
2. **`mouse:out`** - Fired when mouse leaves an object

### ✅ Available Properties
Objects have visual properties we can manipulate:
- `hasBorders` - Show/hide border rectangle
- `hasControls` - Show/hide resize/rotate handles
- `borderColor` - Color of the border
- `borderOpacityWhenMoving` - Opacity during interaction

### ⚠️ Consideration: Active vs Hover State
- **`setActiveObject(obj)`** - Makes object selected (triggers selection events)
- **Manual border rendering** - Show borders without selection

We want **hover preview** without triggering selection, so we'll use manual border/control visibility.

---

## Solution Approach

### Option A: Show Borders on Hover (Recommended)
**Method**: Listen to `mouse:over` / `mouse:out`, temporarily show borders

```typescript
canvas.on('mouse:over', (e) => {
  if (activeTool === 'select' && e.target) {
    e.target.set({
      strokeWidth: 2,
      stroke: '#3b82f6', // Blue highlight
    });
    canvas.renderAll();
  }
});

canvas.on('mouse:out', (e) => {
  if (e.target) {
    e.target.set({
      strokeWidth: 0,
      stroke: null,
    });
    canvas.renderAll();
  }
});
```

**Pros**:
- Simple implementation
- Visual feedback without controls clutter
- Matches design tool patterns

**Cons**:
- Doesn't show resize/rotate handles
- Modifies object appearance temporarily

### Option B: Show Selection Box on Hover (Full Preview)
**Method**: Create a semi-transparent overlay showing selection controls

```typescript
let hoverPreview: fabric.Rect | null = null;

canvas.on('mouse:over', (e) => {
  if (activeTool === 'select' && e.target) {
    const bounds = e.target.getBoundingRect();
    hoverPreview = new fabric.Rect({
      left: bounds.left,
      top: bounds.top,
      width: bounds.width,
      height: bounds.height,
      fill: 'transparent',
      stroke: '#3b82f6',
      strokeWidth: 2,
      strokeDashArray: [5, 5],
      selectable: false,
      evented: false,
    });
    canvas.add(hoverPreview);
    canvas.renderAll();
  }
});
```

**Pros**:
- Shows clear bounding box
- Non-intrusive (overlay)
- Doesn't modify original object

**Cons**:
- Doesn't show actual controls
- Extra object management

### Option C: Temporarily Activate Object (Not Recommended)
**Method**: Use `setActiveObject()` on hover

```typescript
canvas.on('mouse:over', (e) => {
  if (activeTool === 'select' && e.target) {
    canvas.setActiveObject(e.target);
    canvas.renderAll();
  }
});
```

**Pros**:
- Shows actual selection controls
- Uses native Fabric.js behavior

**Cons**:
- Triggers selection events (breaks expectations)
- Confusing UX (looks selected but isn't)
- May break multi-select workflows

---

## Recommended Implementation

**Hybrid Approach**: Show blue border + subtle glow on hover

### Implementation Steps

1. **Add hover state tracking** (ref to avoid re-renders)
2. **Listen to `mouse:over` event** in select mode
3. **Add visual highlight** (border/stroke)
4. **Listen to `mouse:out` event** to remove highlight
5. **Handle edge cases** (don't highlight during drag, during creation, etc.)

### Code Structure

```typescript
// Track hovered object
const hoveredObjectRef = useRef<FabricObject | null>(null);

// In canvas initialization useEffect:
fabricCanvas.on('mouse:over', (opt) => {
  // Only in select mode
  if (activeToolRef.current !== 'select') return;
  
  // Only for objects, not during drag
  if (opt.target && !isDraggingShapeRef.current) {
    // Store reference
    hoveredObjectRef.current = opt.target;
    
    // Add hover effect
    opt.target.set({
      strokeWidth: 2,
      stroke: '#3b82f6', // Blue
    });
    
    fabricCanvas.requestRenderAll();
  }
});

fabricCanvas.on('mouse:out', (opt) => {
  if (opt.target && opt.target === hoveredObjectRef.current) {
    // Remove hover effect
    opt.target.set({
      strokeWidth: 0,
      stroke: undefined,
    });
    
    hoveredObjectRef.current = null;
    fabricCanvas.requestRenderAll();
  }
});
```

---

## Edge Cases to Handle

### ✅ Don't Highlight When:
1. **Not in select mode** (hand, rectangle, etc. tools active)
2. **Currently dragging** an object
3. **Currently creating** a shape
4. **Object already selected** (it has controls already)
5. **During multi-select box drag**
6. **During pan** (Alt+drag)

### ✅ Clear Hover State When:
1. Tool changes (select → hand)
2. Object deleted while hovered
3. Canvas cleared
4. Mouse leaves canvas entirely

---

## Visual Design

### Hover State Styling
```typescript
{
  stroke: '#3b82f6',        // Blue - matches selection color
  strokeWidth: 2,            // Visible but not too thick
  strokeDashArray: [5, 5],   // Dashed for "preview" feel (optional)
}
```

### Alternative: Subtle Glow
```typescript
{
  shadow: {
    color: '#3b82f6',
    blur: 10,
    offsetX: 0,
    offsetY: 0,
  }
}
```

---

## Performance Considerations

### ✅ Optimization
- Use `requestRenderAll()` not `renderAll()` (batches renders)
- Only attach listeners in select mode
- Remove listeners when switching tools
- Use refs to avoid state updates

### ✅ Throttling
- Mouse over/out events are already throttled by browser
- No additional throttling needed for hover

---

## Testing Checklist

### Hover Preview
- [ ] Hover over shape in select mode → Shows border
- [ ] Move mouse away → Border disappears
- [ ] Hover while dragging → No border (doesn't interfere)
- [ ] Hover in hand mode → No border
- [ ] Hover in rectangle mode → No border

### Selection (no regression)
- [ ] Click shape → Still selects normally
- [ ] Multi-select → Still works
- [ ] Drag shape → Still works
- [ ] Resize shape → Still works

### Edge Cases
- [ ] Tool switch while hovering → Clears hover state
- [ ] Delete object while hovering → No errors
- [ ] Rapid hover/unhover → No flicker

---

## Alternative Considerations

### If User Wants Full Controls on Hover
We could show the actual selection controls (resize handles) by:
1. Creating a separate "preview" layer
2. Drawing custom controls at object corners
3. Making them non-interactive

This is more complex but provides full preview of what selection will look like.

**Recommendation**: Start with border highlight, gather feedback, then add controls if needed.

---

## Implementation Priority

1. ✅ **Phase 1**: Simple border highlight on hover (quick win)
2. 🔄 **Phase 2**: Add selection handles preview if requested
3. 🔄 **Phase 3**: Animate transitions (fade in/out)

---

## Figma Comparison

**Figma's behavior**:
- Hover → Thin blue border appears
- Click → Selection controls appear (resize handles, etc.)
- Our implementation matches this pattern ✓

---

## Code Location

**File**: `components/canvas/Canvas.tsx`
**Section**: Canvas initialization useEffect (after existing event listeners)
**Lines**: ~650-850 (mouse event handlers)

---

## Conclusion

**Feasibility**: ✅ 100% feasible using Fabric.js `mouse:over` / `mouse:out` events

**Approach**: Add blue border on hover in select mode only

**Impact**: 🎯 High - Improves shape selection UX significantly

**Complexity**: ⚠️ Low - ~30 lines of code

**Risk**: ✅ Low - Non-breaking addition with proper edge case handling

Ready to implement!


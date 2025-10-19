## Feature 1: Export Canvas as PNG/SVG

**Difficulty: 2/10** | **Time: 2-3 hours** | **Points: +2**

### Implementation

Use Fabric.js built-in export methods:

- `canvas.toDataURL()` for PNG export
- `canvas.toSVG()` for SVG export

### Files to modify:

- Create `lib/canvas/export-utils.ts` - export functions
- Add export button to `components/toolbar/ZoomControls.tsx` or create new `ExportButton.tsx`
- Add keyboard shortcut (Cmd+E) to `hooks/useKeyboard.ts`

### Technical approach:

```typescript
// Export PNG
const dataURL = fabricCanvas.toDataURL({
  format: 'png',
  quality: 1,
  multiplier: 2 // 2x resolution for quality
});

// Export SVG
const svg = fabricCanvas.toSVG();
```

Download via anchor element with blob URL.



---

## Feature 2: Enhanced Color Picker with Recent Colors

**Difficulty: 4/10** | **Time: 3-4 hours** | **Points: +2**

### Current issue:

Color picker dropdown in `StylePanel.tsx` (line 72-114) goes below viewport. Needs to:

1. Position to the LEFT of the properties panel
2. Add full HSL/RGB color picker (not just hex)
3. Track recent colors (last 8-10 used)
4. Store recent colors in localStorage

### Implementation:

- Install `react-colorful` or `react-color` package for full color picker
- Create `components/ui/EnhancedColorPicker.tsx`
- Add recent colors state with localStorage persistence
- Fix positioning: use `absolute right-full mr-2` instead of `top-full`

### Files to modify:

- `components/properties/StylePanel.tsx` - update dropdown positioning
- Create `components/ui/EnhancedColorPicker.tsx` - new component
- Create `hooks/useRecentColors.ts` - localStorage hook
- Update `constants/colors.ts` - add recent colors logic

### Technical approach:

```typescript
// Position picker to left of panel
<div className="absolute right-full top-0 mr-2 z-50">
  <HexColorPicker color={color} onChange={setColor} />
  <RecentColors colors={recentColors} onSelect={handleSelect} />
  <PresetColors colors={PRESET_COLORS} onSelect={handleSelect} />
</div>
```

---




## Feature 3: Layers Panel with Z-Index Management

**Difficulty: 7/10** | **Time: 6-8 hours** | **Points: +3-6**

### Database Schema Changes Required: YES

Need to add `zIndex` field to shapes table:

```typescript
// convex/schema.ts - shapes table
zIndex: v.number(), // Rendering order (higher = front)
```

### Implementation Steps:

1. **Schema Migration** (1 hour)

   - Add `zIndex` field to `convex/schema.ts`
   - Create migration script to assign zIndex to existing shapes (oldest = 0, newest = max)
   - Update `convex/shapes.ts` mutations to handle zIndex

2. **Layers Panel UI** (3-4 hours)

   - Create `components/layers/LayersPanel.tsx`
   - Display shape list ordered by zIndex (top to bottom = front to back)
   - Drag-to-reorder functionality using `@dnd-kit/core`
   - Shape visibility toggles (lock/unlock, show/hide)
   - Rename shape capability

3. **Z-Index Controls** (2-3 hours)

   - Add toolbar buttons: "Bring to Front" (Cmd+]), "Send to Back" (Cmd+[)
   - Add "Bring Forward" (Cmd+Shift+]), "Send Backward" (Cmd+Shift+[)
   - Update `Canvas.tsx` to respect zIndex when rendering
   - Create `convex/shapes.ts` mutations: `updateZIndex`, `bringToFront`, `sendToBack`

### Files to create/modify:

- `convex/schema.ts` - add zIndex field
- `convex/shapes.ts` - add z-index mutations
- `components/layers/LayersPanel.tsx` - new component
- `components/layers/LayerItem.tsx` - individual layer row
- `lib/canvas/layer-utils.ts` - z-index calculation utilities
- `hooks/useKeyboard.ts` - add z-index shortcuts

### Technical approach:

```typescript
// Fabric.js respects add order for z-index
// Re-order objects: canvas.moveTo(object, newIndex)

// Query shapes ordered by zIndex
const shapes = await ctx.db
  .query("shapes")
  .withIndex("by_zIndex")
  .collect();
```

---
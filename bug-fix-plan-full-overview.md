# CollabCanvas Bug Fix Plan

## Critical Root Cause: Schema/Type Mismatch 🔥

**The primary issue:** Your schema uses `fill` but TypeScript types use `fillColor`, causing cascading validation errors.

**Files affected:**

- `convex/schema.ts` - defines `fill: v.optional(v.string())`
- `types/shapes.ts` - all interfaces use `fillColor: string`
- All components using shapes

**Impact:** This single mismatch causes:

- Fill color updates failing (validation error)
- Potential shape update failures
- Delete UI errors (trying to update non-existent shapes)

---

## Bugs Categorized by Complexity

### TIER 1: Simple Fixes (15 min total) ⭐

**Low complexity, high confidence, minimal code changes**

#### 1.1 AI Sidebar Width (+20px)

- **File:** `components/ai/AIChatSidebar.tsx`
- **Change:** Increase width from current to +20px
- **Complexity:** 1/10

#### 1.2 Remove ColorPicker from Bottom Toolbar

- **File:** `components/toolbar/BottomToolbar.tsx`
- **Change:** Remove color picker component/prop
- **Important:** Verify sidebar color picker works correctly after removal
- **Complexity:** 1/10

#### 1.3 Right Sidebar Section Reordering

- **File:** `components/properties/PropertiesSidebar.tsx`
- **Change:** Reorder to Position → Size → Transform → Appearance
- **Complexity:** 1/10

---

### TIER 2: Core Schema Fix (30 min) 🔧

**Medium complexity, high confidence, requires careful migration**

#### 2.1 Unify `fill` vs `fillColor` Naming

**Decision needed:** Keep `fill` (schema) or `fillColor` (types)?

- **Option A:** Rename all `fillColor` → `fill` in types/components (recommended)
- **Option B:** Rename `fill` → `fillColor` in schema (requires migration)

**Recommended: Option A** (no DB migration needed)

**Files to update:**

1. `types/shapes.ts` - Change `fillColor` → `fill` in all interfaces
2. `components/canvas/Shape.tsx` - Update `fillColor` references
3. `components/properties/StylePanel.tsx` - Change `fillColor` → `fill`
4. `components/canvas/tools/*.ts` - Update all tool files
5. All other component references

**Complexity:** 4/10 (tedious but straightforward find/replace)

**Confidence:** 10/10 (will fix multiple errors at once)

#### 2.2 Add `polygon` to createShape Validator

- **File:** `convex/shapes.ts`
- **Change:** Add `v.literal("polygon")` to createShape args union (line 19-26)
- **Complexity:** 2/10

---

### TIER 3: Property Panel Fixes (45 min) 🎨

**Medium complexity, high confidence**

#### 3.1 Fix Property Panel Updates (depends on 2.1)

**Root cause:** Using wrong field names causes all updates to fail

**Files:**

- `components/properties/PositionPanel.tsx` - Works correctly
- `components/properties/TransformPanel.tsx` - Works correctly  
- `components/properties/StylePanel.tsx` - Fix after schema unification

**After fix 2.1, verify all panels work correctly**

**Complexity:** 3/10

#### 3.2 Standardize Right Sidebar Styling

**File:** `components/properties/PropertiesSidebar.tsx`

**Changes needed:**

- Consistent dividers between sections
- Section headers: gray → white text (`text-[#888888]` → `text-white`)
- Equal divider widths
- Proper spacing

**Complexity:** 3/10

---

### TIER 4: UI/UX Polish (1 hour) ✨

**Low-medium complexity, straightforward changes**

#### 4.1 Keyboard Shortcuts UI Redesign

**File:** `components/ui/KeyboardShortcutsHelp.tsx`

**Changes:**

- Make modal more compact (reduce padding/spacing)
- Remove input borders, use plain text labels
- Group shortcuts by category with dividers
- Increase icon sizes (use `lucide-react` if available)
- Remove purple theme or make configurable

**Complexity:** 4/10

#### 4.2 Text Tool: Exit to Select Mode

**File:** `components/canvas/tools/useTextTool.ts`

**Current behavior (line 44-78):** Clicking out creates new text

**Desired:** Switch to select tool after editing

**Change:** In `onMouseDown`, check if clicking out of active text → call tool change callback

**Complexity:** 3/10

#### 4.3 Remove Text Hover Highlight

**File:** Likely in `components/canvas/Canvas.tsx` or global CSS

**Change:** Remove blue bold highlight on text hover (crosshair cursor is sufficient)

**Complexity:** 2/10

#### 4.4 Purple Theme → Configurable Primary Color

**Create:** `constants/theme.ts` with `PRIMARY_COLOR`

**Files to update:**

- `components/ai/AIChatSidebar.tsx` - AI Assistant label
- `components/ai/ChatInput.tsx` - Send button, input outline
- `components/ui/KeyboardShortcutsHelp.tsx` - Icon background
- Any other purple (`#8A63D2`, `bg-primary`, etc.)

**Complexity:** 3/10

---

### TIER 5: Shape Rendering Bugs (1.5 hours) 🐛

**Medium-high complexity, requires investigation**

#### 5.1 Line Disappearing on Hover

**File:** `components/canvas/Shape.tsx`

**Likely cause:** Lines use `stroke` not `fill`, but hover effect may set `strokeWidth: 0`

**Investigation needed:**

1. Check hover handlers in Canvas.tsx
2. Line rendering uses `fillColor` for stroke (line 84, 185)
3. After fix 2.1 (`fillColor` → `fill`), verify line stroke is set correctly

**Complexity:** 5/10

**Depth:** Medium (may need to trace hover event handlers)

#### 5.2 Circle/Ellipse Resize Visual Lag

**File:** `components/canvas/Canvas.tsx`, shape update handlers

**Likely cause:** Canvas not re-rendering immediately after resize, or conflicting updates from DB

**Investigation needed:**

1. Check `object:modified` handler
2. Verify immediate `canvas.renderAll()` after resize
3. Check if DB update overwrites local changes
4. May need optimistic UI updates

**Complexity:** 6/10

**Depth:** Medium-high (state sync between local canvas and DB)

#### 5.3 Pencil/Path Not Persisting to DB

**Files:**

- `components/canvas/tools/usePencilTool.ts`
- `convex/shapes.ts`

**Investigation needed:**

1. Check if `finalizePath` is called correctly
2. Verify `pathData` serialization (should be JSON string)
3. Check if `createShape` mutation accepts path data
4. Verify path rendering after reload

**Complexity:** 5/10

**Depth:** Medium (need to trace path creation flow)

---

### TIER 6: Multi-Select Issues (1 hour) 🎯

**Medium-high complexity**

#### 6.1 Multi-Selection "Completely Broken"

**File:** `components/canvas/tools/useSelectTool.ts`, `components/canvas/Canvas.tsx`

**Current implementation looks correct** (lines 37-48 in useSelectTool.ts enable Fabric.js multi-select)

**Investigation needed:**

1. Reproduce exact issue (what doesn't work?)
2. Check if `canvas.selection = true` is being overridden
3. Verify Fabric.js ActiveSelection is handled correctly
4. Check shape update/delete handlers support multi-select

**Complexity:** 6/10

**Depth:** Medium-high (need specific reproduction steps)

---

### TIER 7: Advanced Issues (1.5 hours) 🔬

**High complexity, deep investigation needed**

#### 7.1 Delete Shape UI Error (depends on 2.1)

**Error:** "Update on nonexistent document ID" after delete

**Root cause theory:**

1. Delete triggers UI update
2. UI tries to update shape that no longer exists
3. Likely in property panel watching deleted shape

**Investigation:**

1. After fixing 2.1, check if error persists
2. If yes, find which component updates on delete
3. Add safeguards to skip updates for deleted shapes

**Complexity:** 7/10

**Depth:** High (race condition in reactive state)

#### 7.2 Connection Status Accuracy

**File:** `hooks/useConnectionStatus.ts`

**Current implementation** uses `isWebSocketConnected` which should be accurate

**Investigation needed:**

1. Test actual behavior when WiFi disconnected
2. Check if Convex reports connection correctly
3. May need to add network state listener
4. Consider adding manual ping/health check

**Complexity:** 6/10

**Depth:** Medium-high (external dependency on Convex behavior)

#### 7.3 Left Sidebar Resize Issue

**Likely file:** Layout component or CSS

**Investigation needed:**

1. Find sidebar component
2. Check if width is stored/restored correctly
3. Verify CSS transitions don't affect dimensions

**Complexity:** 5/10

#### 7.4 Canvas Resize Lag

**Performance optimization**

**Investigation needed:**

1. Profile resize performance
2. May need to debounce canvas resize
3. Check if shapes re-render unnecessarily

**Complexity:** 6/10

**Depth:** Medium (performance profiling required)

---

## Recommended Execution Order

### Phase 1: Foundation (30-45 min)

**Critical path - fixes root cause**

1. Fix 2.1: Unify `fill`/`fillColor` naming
2. Fix 2.2: Add polygon to createShape validator
3. Test: Create shapes, update colors, delete shapes

### Phase 2: Quick Wins (30 min)

**High-impact, low-effort fixes**

4. All TIER 1 fixes (UI tweaks)
5. Fix 3.2: Standardize sidebar styling
6. Fix 4.2: Text tool exit behavior

### Phase 3: Deep Bugs (2-3 hours)

**Requires investigation**

7. Fix 5.1: Line disappearing
8. Fix 5.2: Circle/ellipse resize
9. Fix 5.3: Pencil persistence
10. Fix 6.1: Multi-select
11. Fix 7.1: Delete UI error

### Phase 4: Polish (1 hour)

**Nice-to-haves**

12. Fix 4.1: Keyboard shortcuts UI
13. Fix 4.3: Text hover highlight
14. Fix 4.4: Theme colors
15. Fix 7.2: Connection status
16. Fix 7.3: Sidebar resize
17. Fix 7.4: Canvas performance

---

## Risk Assessment

**High Confidence (will fix on first try):**

- TIER 1 all
- TIER 2 all  
- TIER 3 all
- TIER 4: 4.2, 4.4

**Medium Confidence (may need iteration):**

- TIER 4: 4.1, 4.3
- TIER 5: 5.1, 5.3
- TIER 6: 6.1

**Low Confidence (need deep investigation):**

- TIER 5: 5.2
- TIER 7: 7.1, 7.2, 7.4

**Unknown (need more info from user):**

- TIER 6: 6.1 (need specific repro steps)
- TIER 7: 7.3 (need to find component)

---

## Future Considerations: Schema Rearchitecture 🏗️

**Note:** This should be done AFTER all current bugs are fixed.

### Current Schema Issues

The current schema (`convex/schema.ts`) has some architectural issues:

1. **Optional fields everywhere** - Using optional fields for shape-specific properties:

   - `x1/y1/x2/y2` only for lines
   - `points` only for polygons  
   - `pathData` only for paths
   - `text/fontSize/fontFamily` only for text

2. **Not type-safe at DB level** - Can theoretically create invalid combinations:

   - A circle with `text` field
   - A line with `points` field
   - No validation that required fields exist for each type

3. **Mixed coordinate systems** - Different shapes use different position systems:

   - Rectangles/circles/ellipses: `x, y, width, height`
   - Lines: `x1, y1, x2, y2`
   - Polygons: `points[]` array + `x, y`

### Recommended Future Approaches

**Option 1: Discriminated Unions (Recommended)**

```typescript
// Convex v1.0+ supports this
shapes: defineTable(
  v.union(
    v.object({ type: v.literal("rectangle"), x: v.number(), y: v.number(), ... }),
    v.object({ type: v.literal("line"), x1: v.number(), y1: v.number(), ... }),
    // etc
  )
)
```

**Pros:** Type-safe, clean, single table

**Cons:** More complex schema definition

**Option 2: Separate Tables**

```typescript
rectangles: defineTable({ x, y, width, height, fill, angle }),
circles: defineTable({ x, y, radius, fill, angle }),
lines: defineTable({ x1, y1, x2, y2, stroke }),
// etc
```

**Pros:** Cleanest separation, clearest types

**Cons:** More queries, harder to maintain order, more code

**Option 3: JSON Field for Shape-Specific Data**

```typescript
shapes: defineTable({
  type: v.union(...),
  fill: v.string(),
  angle: v.optional(v.number()),
  shapeData: v.string(), // JSON string with type-specific data
  createdBy: v.string(),
  createdAt: v.number(),
})
```

**Pros:** Flexible, easy to add new shape types

**Cons:** No type safety at DB level, harder to query

### Migration Requirements

Any schema change would require:

1. **Data migration script** - Convert existing shapes to new format
2. **Backward compatibility** - Support both schemas during transition period
3. **Comprehensive testing** - Test all shape types, CRUD operations
4. **Rollback plan** - In case migration fails

### Recommendation

**Wait until after all bugs are fixed**, then create a separate task for schema migration. This is a significant refactor that should not be mixed with bug fixes.

**Priority:** Low (current schema works, just not elegant)

**Effort:** 4-6 hours (planning + implementation + testing + migration)

---

## Execution Notes

**IMPORTANT:** Execute each fix step-by-step, waiting for user confirmation before proceeding to the next item. This ensures:

- Each fix is verified independently
- We can catch issues early
- No cascading problems from multiple changes

**Process:**

1. Implement fix X.X
2. Test and verify
3. Wait for user confirmation "✅ looks good, move to next"
4. Proceed to next fix
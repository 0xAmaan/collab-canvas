# CollabCanvas Refactoring Plan

> **Status**: Awaiting approval before execution
> **Approach**: Single agent, sequential phases with approval gates
> **Goal**: Reduce complexity, eliminate dead code, improve maintainability without losing functionality

---

## 📊 Current State Analysis

- **Total LOC**: ~5,635 lines across source files
- **Canvas.tsx**: 2,421 lines (monolithic, needs breakdown)
- **Console logs**: 150+ debug statements
- **Duplicate style patterns**: 19+ instances
- **Dead code**: Temporary test pages, unused toolbar component

---

## 🎯 Refactoring Phases






### **PHASE 4: Type & Import Cleanup**

**Goal**: Improve type safety, remove unused imports, organize barrel exports

#### 4.1 Remove `any` Types (10+ instances)

**Canvas.tsx type improvements:**

**Before**:
```typescript
const shapeData: any = {
  angle: shape.angle || 0,
};

const command = new CreateShapeCommand(
  shapeData as any,
  createShapeInConvex,
  deleteShapeInConvex,
);

const shapeId = (command as any).shapeId;
```

**After**:
```typescript
// Update CreateShapeCommand to expose shapeId properly
type ShapeData = Partial<Shape> & Pick<Shape, "type" | "createdBy" | "createdAt">;

const shapeData: ShapeData = {
  type: "rectangle",
  x: 0,
  y: 0,
  angle: shape.angle || 0,
  // ... type-safe properties
};

const command = new CreateShapeCommand(
  shapeData,
  createShapeInConvex,
  deleteShapeInConvex,
);

const shapeId: string | undefined = command.getShapeId();
```

**Update** `lib/commands/CreateShapeCommand.ts`:
```typescript
export class CreateShapeCommand {
  private shapeId?: string;

  // ... existing code ...

  public getShapeId(): string | undefined {
    return this.shapeId;
  }
}
```

**Result**: Better IDE autocomplete, catch errors at compile time

---

#### 4.2 Import Organization

**Run ESLint auto-fix:**
```bash
# Remove unused imports
bun run lint --fix

# Or manually:
npx eslint --fix "**/*.{ts,tsx}"
```

**Audit barrel exports** (`index.ts` files):

1. `components/toolbar/index.ts` - Keep (exports BottomToolbar, ColorPicker)
2. `components/canvas/index.ts` - Keep (exports Canvas, MultiplayerCursor)
3. `components/properties/index.ts` - Keep (exports PropertiesSidebar)
4. `components/ai/index.ts` - Keep (exports AI components)
5. `types/index.ts` - Audit (ensure all exported types are used)

---

#### 4.3 Type Consolidation

**Check for overlapping types:**

Files to audit:
- `types/shapes.ts` - Shape type definitions
- `types/canvas.ts` - Canvas-related types
- `types/presence.ts` - Presence types
- `types/viewport.ts` - Viewport types

**Action**: Merge any duplicate or redundant type definitions

---

### **PHASE 5: Component Extraction (Canvas.tsx Refactor)**

> **NOTE**: This phase will be discussed extensively before implementation

**Goal**: Break down 2,421-line Canvas.tsx into focused, maintainable components

#### Current Analysis:

**Canvas.tsx Breakdown** (by line count):
- **Lines 1-155**: Initialization, refs, state (155 lines) ✅ Keep
- **Lines 157-506**: 6 finalization functions (350 lines) → Extract to utilities (Phase 3)
- **Lines 508-696**: Delete/duplicate handlers (188 lines) → Can extract
- **Lines 699-1826**: Main Fabric.js setup & event handlers (1127 lines) → **NEEDS BREAKDOWN**
  - Lines 699-752: Canvas initialization, mouse wheel (54 lines)
  - Lines 754-1046: `mouse:down` handler (292 lines) → Extract shape creators
  - Lines 1048-1205: `mouse:move` handler (157 lines) → Extract interaction handlers
  - Lines 1207-1428: `mouse:up` handler (221 lines) → Extract finalization logic
  - Lines 1430-1815: Object events (moving, scaling, rotating, modified) (385 lines)
  - Lines 1816-1826: Hover events (11 lines)
- **Lines 1828-2247**: useEffect hooks (419 lines) → Some can extract
- **Lines 2249-2398**: Sync effect (150 lines) ✅ Keep
- **Lines 2400-2421**: Render (22 lines) ✅ Keep

#### Proposed Structure:

**We will discuss these extractions in detail before proceeding:**

1. **Shape Creation Components** (`components/canvas/creators/`):
   - `RectangleCreator.tsx`
   - `CircleCreator.tsx`
   - `EllipseCreator.tsx`
   - `LineCreator.tsx`
   - `TextCreator.tsx`
   - `PolygonCreator.tsx`
   - `PencilCreator.tsx`

2. **Interaction Handlers** (`components/canvas/interactions/`):
   - `usePanInteraction.ts`
   - `useSelectionInteraction.ts`
   - `useDuplicationInteraction.ts`

3. **Event Handlers** (`hooks/canvas/`):
   - `useObjectEvents.ts` - object:moving, object:modified, etc.
   - `useShapeCreation.ts` - Orchestrate shape creators
   - `useCanvasEvents.ts` - Mouse events

**Expected Result**: Canvas.tsx ~2,421 → ~800 lines

---

## 🎯 Success Criteria

After all phases:
- ✅ Zero functionality loss - all features work identically
- ✅ Build passes: `bun run build` succeeds
- ✅ No type errors: `bun run type-check` passes
- ✅ Reduced LOC: ~25% reduction overall
- ✅ Improved maintainability: Smaller, focused files
- ✅ Consistent styling: Centralized theme constants
- ✅ DRY code: No duplicated logic patterns

---

## 🚦 Execution Protocol

**For each phase:**
1. **Proposal**: Detailed file-by-file changes (already documented above)
2. **Approval**: **⚠️ STOP and wait for explicit user confirmation before proceeding**
3. **Execution**: Make changes
4. **Verification**:
   - User will run `bun run build` manually (dev server already running)
   - Visual test in browser (if UI changes)
   - Commit with descriptive message
5. **Summary**: Present results and **⚠️ PAUSE - Wait for approval before next phase**

**Safety measures:**
- ✅ All changes committed to git before starting
- ✅ Each phase is independently verifiable
- ✅ Can rollback individual phases if needed
- ✅ No execution without approval
- ✅ **MANDATORY PAUSE between phases - do not auto-continue**

**Build & Lint Protocol:**
- User runs `bun run build` manually to verify (dev server already running)
- Only run linting when specifically needed (not every phase)
- User will request linting if desired

---

## 📝 Notes

- **Context directory preserved** - User will revisit later
- **ZoomControls kept** - Actively used in AccountSection
- **Progress logs removed** - User already deleted
- **Temporary page to remove** - Test no longer needed
- **Toolbar.tsx to remove** - Replaced by BottomToolbar.tsx

---

**Status**: ✅ Plan approved, awaiting Phase 1 execution approval

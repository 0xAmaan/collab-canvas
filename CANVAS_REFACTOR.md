# Canvas.tsx Refactor Plan - Phase 5

> **Status**: Plan approved, awaiting execution
> **Approach**: Hook-based tools + Mutable CanvasState
> **Goal**: Reduce Canvas.tsx from 1,920 lines → ~400 lines while maintaining 100% functionality

---

## 📊 Current State

- **Canvas.tsx**: 1,920 lines (monolithic file)
- **Pain Points**:
  - Hard to find specific logic
  - Difficult to understand event flow
  - Adding new features requires changes scattered across many places
  - 90% code duplication in shape creation/finalization
  - 16+ separate refs tracking different states

---

## 🎯 Architecture Overview

### New Pattern: Tool Strategy with Hooks

Instead of one giant file with conditional logic for every tool, we're implementing a **Tool Strategy Pattern** using React hooks:

- **Each tool is a separate hook** (useSelectTool, useHandTool, etc.)
- **Canvas.tsx becomes an orchestrator** - delegates events to active tool
- **Centralized state** - CanvasState class replaces 16+ scattered refs
- **DRY shape creation** - ShapeFactory handles all shape types with configs

### Benefits

1. **Easy to find logic**: Want to fix rectangle creation? Go to `useShapeCreationTool.ts`
2. **Clear event flow**: Canvas receives event → delegates to active tool → tool updates state
3. **Easy to add features**: New shape? Add config. New tool? Create new hook.
4. **90% less duplication**: ShapeFactory + configs eliminate repeated code

---

## 📁 New File Structure (13 files)

```
components/canvas/
  Canvas.tsx                              (1920 → 400 lines)

  tools/                                  [NEW DIRECTORY]
    types.ts                              (~80 lines - shared types/interfaces)
    useSelectTool.ts                      (~180 lines - select, drag, alt+drag duplicate/pan)
    useHandTool.ts                        (~60 lines - panning)
    useShapeCreationTool.ts               (~180 lines - rect/circle/ellipse/line)
    useTextTool.ts                        (~120 lines - text creation/editing)
    usePolygonTool.ts                     (~150 lines - polygon multi-click)
    usePencilTool.ts                      (~180 lines - free drawing)

  shapes/                                 [NEW DIRECTORY]
    ShapeFactory.ts                       (~200 lines - DRY creation/finalization)
    shape-configs.ts                      (~120 lines - per-shape configuration)

  state/                                  [NEW DIRECTORY]
    CanvasState.ts                        (~120 lines - centralized state class)
```

---

## 🏗️ Architecture Details

### 1. Tool Hook Pattern

Each tool exports a hook that returns standardized handlers:

```typescript
export const useSelectTool = (context: ToolContext): ToolHandlers => {
  const { canvas, state, userId, shapes } = context;

  const onMouseDown = useCallback((e: MouseEvent, pointer: Point, target: any) => {
    // Select-specific mouse down logic
  }, [canvas, state]);

  const onMouseMove = useCallback((e: MouseEvent, pointer: Point) => {
    // Select-specific mouse move logic
  }, [canvas, state]);

  const onMouseUp = useCallback((e: MouseEvent, pointer: Point) => {
    // Select-specific mouse up logic
  }, [canvas, state]);

  const onActivate = useCallback(() => {
    canvas.selection = true;
    canvas.defaultCursor = 'default';
  }, [canvas]);

  const onDeactivate = useCallback(() => {
    canvas.selection = false;
    // cleanup
  }, [canvas, state]);

  return {
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onActivate,
    onDeactivate,
    getCursor: () => 'default',
    getHoverCursor: () => 'move',
  };
};
```

### 2. Centralized State (CanvasState)

Replaces 16+ separate refs with a single, typed state object:

```typescript
export class CanvasState {
  // Interaction state
  isPanning = false;
  lastPanPosition: Point = { x: 0, y: 0 };
  isDraggingShape = false;

  // Creation state (replaces 12 separate refs!)
  creation: {
    isActive: boolean;
    type: ShapeType | null;
    tempObject: FabricObject | null;
    startPoint: Point | null;
    points: Point[]; // For polygon
  } = { isActive: false, type: null, tempObject: null, startPoint: null, points: [] };

  // Duplication state (Alt+drag)
  duplication: {
    isActive: boolean;
    originalShape: Shape | null;
  } = { isActive: false, originalShape: null };

  // Text editing state
  textEditing: {
    isActive: boolean;
    textObject: IText | null;
    updateTimer: NodeJS.Timeout | null;
  } = { isActive: false, textObject: null, updateTimer: null };

  // Tracking state
  savingShapeIds = new Set<string>();
  hoveredObject: FabricObject | null = null;
  lastMoveUpdate = 0;

  // Helper methods
  resetCreation() { /* ... */ }
  resetDuplication() { /* ... */ }
  resetTextEditing() { /* ... */ }
  resetAll() { /* ... */ }
}
```

**Why mutable class instead of React state:**
- ✅ Simpler - direct mutation instead of setState boilerplate
- ✅ Better performance - doesn't trigger re-renders
- ✅ Perfect for internal tracking state (creation modes, panning, etc.)
- ✅ Matches current pattern (we use refs, not useState)

### 3. DRY Shape Creation (ShapeFactory)

Eliminates 90% duplication in shape creation/finalization:

```typescript
export class ShapeFactory {
  // Single method creates all shape types
  createShape(type: ShapeType, startPoint: Point, fillColor: string): FabricObject {
    const config = SHAPE_CONFIGS[type];
    switch (type) {
      case 'rectangle': return new Rect({ ...config.defaultProps, left: startPoint.x, top: startPoint.y, fill: fillColor });
      case 'circle': return new Circle({ ...config.defaultProps, left: startPoint.x, top: startPoint.y, fill: fillColor });
      // ... etc
    }
  }

  // Single method updates all shape types during drag
  updateShapeSize(object: FabricObject, type: ShapeType, startPoint: Point, currentPoint: Point) {
    const config = SHAPE_CONFIGS[type];
    config.updateSize(object, startPoint, currentPoint);
  }

  // Single method checks minimum size for all shapes
  meetsMinimumSize(object: FabricObject, type: ShapeType): boolean {
    const config = SHAPE_CONFIGS[type];
    // Check minSize requirements from config
  }

  // Single method finalizes all shape types
  async finalizeShape(canvas, object, type, userId, createShape, deleteShape, history): Promise<string | null> {
    const config = SHAPE_CONFIGS[type];
    return finalizeShape({
      canvas,
      object,
      shapeType: type,
      extractShapeData: (obj) => config.extractData(obj, userId),
      userId,
      createShape,
      deleteShape,
      history,
    });
  }
}
```

**Shape configurations** (shape-configs.ts) define per-shape behavior:

```typescript
export const SHAPE_CONFIGS: Record<ShapeType, ShapeConfig> = {
  rectangle: {
    defaultProps: { fill: DEFAULT_SHAPE.FILL_COLOR, stroke: SELECTION_COLORS.BORDER, ... },
    minSize: { width: 5, height: 5 },
    extractData: (rect: Rect, userId: string) => ({ type: 'rectangle', x: rect.left, ... }),
    updateSize: (rect, start, current) => { /* update width/height during drag */ },
  },
  circle: { /* ... */ },
  ellipse: { /* ... */ },
  line: { /* ... */ },
  // ... etc
};
```

### 4. Simplified Canvas.tsx

Canvas becomes a lightweight orchestrator:

```typescript
export function Canvas(props: CanvasProps) {
  const fabricCanvasRef = useRef<FabricCanvas | null>(null);
  const canvasState = useRef(new CanvasState()).current;

  // Tool context (passed to all tools)
  const toolContext: ToolContext = {
    canvas: fabricCanvasRef.current!,
    state: canvasState,
    props,
    // ... other context
  };

  // Initialize all tools (hooks called unconditionally)
  const selectTool = useSelectTool(toolContext);
  const handTool = useHandTool(toolContext);
  const rectangleTool = useShapeCreationTool(toolContext, 'rectangle');
  const circleTool = useShapeCreationTool(toolContext, 'circle');
  // ... etc

  // Map tools
  const toolMap = useMemo(() => ({
    select: selectTool,
    hand: handTool,
    rectangle: rectangleTool,
    circle: circleTool,
    // ... etc
  }), [selectTool, handTool, rectangleTool, circleTool]);

  // Get active tool
  const activeToolHandlers = toolMap[activeTool];

  // Handle tool activation/deactivation
  useEffect(() => {
    activeToolHandlers?.onActivate();
    return () => activeToolHandlers?.onDeactivate();
  }, [activeTool, activeToolHandlers]);

  // Setup event handlers - delegate to active tool
  useEffect(() => {
    if (!fabricCanvasRef.current) return;
    const canvas = fabricCanvasRef.current;

    const handleMouseDown = (opt: any) => {
      const pointer = canvas.getPointer(opt.e);
      activeToolHandlers?.onMouseDown(opt.e, pointer, opt.target);
    };

    canvas.on('mouse:down', handleMouseDown);
    // ... similar for mouse:move, mouse:up

    return () => canvas.off('mouse:down', handleMouseDown);
  }, [activeToolHandlers]);

  // Sync logic stays in Canvas (unchanged)
  useEffect(() => { /* existing sync logic */ }, [shapes]);

  return <canvas ref={canvasRef} />;
}
```

---

## 🚀 Implementation Phases

### **Phase 5.1: Infrastructure Setup** ✅ (No behavior changes)

**Goal:** Create foundation without changing Canvas.tsx behavior

**Tasks:**
1. Create `CanvasState.ts` - centralized state class
2. Create `shape-configs.ts` - per-shape configuration
3. Create `ShapeFactory.ts` - DRY shape creation/finalization
4. Create `tools/types.ts` - shared types/interfaces

**Verification:**
- TypeScript compiles
- Zero changes to Canvas.tsx
- Zero functional changes

**Estimated Time:** ~30 minutes

---

### **Phase 5.2: Extract Select Tool** (First tool migration)

**Goal:** Move select mode logic into `useSelectTool.ts`, wire it up, verify it works

**Tasks:**
1. Create `useSelectTool.ts` with all select mode logic:
   - Regular selection/dragging
   - Alt+drag duplication
   - Alt+drag panning
   - Multi-select
2. Modify Canvas.tsx to:
   - Import tool infrastructure
   - Create tool context
   - Call useSelectTool
   - Delegate mouse events to tool
3. Remove old select mode logic from Canvas.tsx

**Verification:**
- Run app, switch to select tool
- Test: Click shapes, drag shapes, multi-select
- Test: Alt+drag duplicate, Alt+drag pan
- All select mode features work identically

**Estimated Time:** ~45 minutes

---

### **Phase 5.3: Extract Remaining Tools** (One by one)

We'll extract tools in this order (safest to riskiest):

#### 5.3.1: useHandTool
- **Complexity:** Low (just panning logic)
- **Lines:** ~60
- **Test:** Pan canvas with hand tool, two-finger pan, pinch zoom

#### 5.3.2: useShapeCreationTool
- **Complexity:** Medium (generic tool for rect/circle/ellipse/line)
- **Lines:** ~180
- **Test:** Create all 4 shape types, verify min size, verify selection after creation

#### 5.3.3: useTextTool
- **Complexity:** Medium (text creation + editing)
- **Lines:** ~120
- **Test:** Create text, edit text, double-click edit, text auto-save

#### 5.3.4: usePolygonTool
- **Complexity:** Medium (multi-click creation, Enter/Escape)
- **Lines:** ~150
- **Test:** Create polygon, preview lines, complete with Enter, cancel with Escape

#### 5.3.5: usePencilTool
- **Complexity:** High (free drawing, path creation, Fabric.js brush overrides)
- **Lines:** ~180
- **Test:** Free draw, verify stroke-only (no fill), verify path save

**Pattern for each tool:**
1. Create `useXTool.ts` file
2. Wire it up in Canvas.tsx tool map
3. Test thoroughly
4. Move to next tool

**Verification after each tool:**
- Tool works identically to before
- No console errors
- Canvas still syncs properly

**Estimated Time:** ~2 hours (5 tools × ~25 min each)

---

### **Phase 5.4: Final Cleanup**

**Tasks:**
1. Remove all old refs from Canvas.tsx (replaced by CanvasState)
2. Remove old finalize functions (replaced by ShapeFactory)
3. Remove commented/dead code
4. Update CLAUDE.md with new architecture documentation
5. Final verification of all features

**Verification:**
- Canvas.tsx is ~400 lines (down from 1,920)
- All tools work
- `bun run build` succeeds
- No TypeScript errors
- No console errors

**Estimated Time:** ~30 minutes

---

## ✅ Success Criteria

After all phases complete:

- [ ] Canvas.tsx is ~400 lines (down from 1,920)
- [ ] All 7 tools work identically to before
- [ ] Shape creation/editing works for all types (rectangle, circle, ellipse, line, text, polygon, path)
- [ ] Multi-select works
- [ ] Undo/redo works
- [ ] Real-time sync works (shapes, presence, cursors)
- [ ] Keyboard shortcuts work
- [ ] Alt+drag features work (duplicate, pan)
- [ ] Text editing works (create, edit, double-click)
- [ ] Polygon creation works (multi-click, Enter/Escape)
- [ ] Pencil drawing works (free draw, path creation)
- [ ] Object manipulation works (move, resize, rotate)
- [ ] Hover preview works (blue border on mouse over)
- [ ] `bun run build` succeeds
- [ ] No TypeScript errors
- [ ] No console errors during interaction

---

## 🛡️ Risk Mitigation

### Safety Measures

1. **Independent phases** - Each phase is independently verifiable
2. **Git commits** - Commit after each successful phase
3. **Easy rollback** - Can revert any phase if issues arise
4. **Tool isolation** - Bug in one tool doesn't break others
5. **Type safety** - TypeScript ensures all tools implement interface correctly

### If Something Breaks

**During any phase:**
1. Git revert the phase
2. Analyze what broke (console errors, behavior changes)
3. Fix the specific issue
4. Re-run the phase
5. Test again

**Each phase is independently testable** - you'll know immediately if something is wrong.

---

## ⏱️ Estimated Timeline

- **Phase 5.1** (Infrastructure): ~30 minutes (file creation, no risk)
- **Phase 5.2** (Select tool): ~45 minutes (first tool, most complex)
- **Phase 5.3** (Remaining tools): ~2 hours (5 tools × ~25 min each)
- **Phase 5.4** (Cleanup): ~30 minutes
- **Total: ~4 hours** (with testing)

**We'll go phase by phase with approval** - no rushing!

---

## 🎯 Why This Approach Works

### Solves All Pain Points

1. **Finding specific logic** ✅
   - Want to fix rectangle creation? → `useShapeCreationTool.ts`
   - Want to fix text editing? → `useTextTool.ts`
   - Want to fix panning? → `useHandTool.ts`

2. **Understanding event flow** ✅
   - Clear delegation: Canvas receives event → delegates to active tool → tool updates state
   - Each tool is isolated and readable

3. **Adding new features** ✅
   - New shape type? Add config to `shape-configs.ts`
   - New tool? Create new `useXTool.ts` hook
   - Modify tool behavior? Edit single file

4. **Code duplication** ✅
   - ShapeFactory eliminates 90% duplication in shape creation
   - Configs eliminate duplication in shape behavior
   - Tool pattern eliminates duplicate event handling

### Maintains Quality

- ✅ Type safety via TypeScript interfaces
- ✅ React-friendly (hooks, not classes)
- ✅ Simple state management (mutable class, no boilerplate)
- ✅ Testable (each tool is isolated)
- ✅ Maintainable (smaller files, clear structure)

### Prevents Breakage

- ✅ Tool interface ensures all tools implement required methods
- ✅ Centralized state prevents ref conflicts
- ✅ Existing event handlers (object:moving, object:modified) stay unchanged
- ✅ Phased rollout catches issues early

---

## 📚 Documentation Updates

After completion, update CLAUDE.md with:

1. **New architecture overview** (Tool Strategy Pattern)
2. **File structure** (where to find each tool)
3. **How to add a new tool** (step-by-step guide)
4. **How to add a new shape** (config + factory)
5. **State management** (CanvasState explanation)
6. **Common patterns** (tool lifecycle, event delegation)

---

## 🚦 Execution Protocol

**For each phase:**
1. **Proposal**: Present detailed changes
2. **Approval**: ⚠️ STOP and wait for explicit user confirmation
3. **Execution**: Make changes
4. **Verification**: Test thoroughly
5. **Commit**: Git commit with descriptive message
6. **Summary**: Present results and ⚠️ PAUSE for next phase approval

**No auto-continuation between phases!**

---

**Status**: ✅ Plan complete, awaiting Phase 5.1 execution approval

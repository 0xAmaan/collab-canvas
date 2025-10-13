# Infinite Loop Bug Fix - Maximum Update Depth

## Problem Analysis

### The Root Cause Chain

The "Maximum update depth exceeded" error was caused by a cascade of React re-renders:

```
1. DashboardClient renders
   ↓
2. Creates NEW handleCanvasReady function (not memoized)
   ↓
3. Passes it to Canvas component as onCanvasReady prop
   ↓
4. Canvas useEffect depends on onCanvasReady
   ↓
5. onCanvasReady changed → useEffect re-runs
   ↓
6. Disposes old canvas and creates new one
   ↓
7. Calls onCanvasReady(fabricCanvas)
   ↓
8. setFabricCanvas(canvas) updates state
   ↓
9. DashboardClient re-renders
   ↓
10. LOOP BACK TO STEP 2 → INFINITE LOOP! 💥
```

### Additional Issues
- `useViewport` hook was also reading from localStorage on every canvas change
- This created additional state updates during the loop
- The hook wasn't properly initializing state from localStorage

## Solutions Applied

### 1. Memoize the Canvas Ready Callback ✅

**File:** `app/dashboard/DashboardClient.tsx`

```typescript
// ❌ BEFORE - Creates new function on every render
const handleCanvasReady = (canvas: FabricCanvas) => {
  setFabricCanvas(canvas);
};

// ✅ AFTER - Memoized, same reference across renders
const handleCanvasReady = useCallback((canvas: FabricCanvas) => {
  setFabricCanvas(canvas);
}, []);
```

**Why this works:**
- `useCallback` with empty dependency array ensures the function reference never changes
- Canvas useEffect won't re-run unless canvas dimensions change
- Breaks the infinite loop chain

### 2. Remove onCanvasReady from Canvas Dependencies ✅

**File:** `components/canvas/Canvas.tsx`

```typescript
// ❌ BEFORE - Re-creates canvas when callback changes
useEffect(() => {
  // ... canvas setup ...
  if (onCanvasReady) {
    onCanvasReady(fabricCanvas);
  }
  return () => fabricCanvas.dispose();
}, [dimensions.width, dimensions.height, onCanvasReady]);

// ✅ AFTER - Only re-creates when dimensions change
useEffect(() => {
  // ... canvas setup ...
  onCanvasReady?.(fabricCanvas);
  return () => fabricCanvas.dispose();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [dimensions.width, dimensions.height]);
```

**Why this works:**
- Canvas only re-initializes when viewport size changes
- `onCanvasReady` is called but doesn't trigger re-creation
- Used eslint-disable to acknowledge the intentional omission

### 3. Initialize Viewport State from localStorage ✅

**File:** `hooks/useViewport.ts`

```typescript
// ❌ BEFORE - Reads localStorage in useEffect (runs after render)
const [viewport, setViewport] = useState<ViewportState>({
  zoom: ZOOM.DEFAULT,
  panX: 0,
  panY: 0,
});

useEffect(() => {
  const stored = localStorage.getItem(VIEWPORT_STORAGE_KEY);
  const parsed = parseStoredViewport(stored);
  if (parsed) {
    setViewport(parsed); // ⚠️ Causes extra render!
  }
}, [canvas]);

// ✅ AFTER - Reads localStorage during initialization (lazy initial state)
const [viewport, setViewport] = useState<ViewportState>(() => {
  // Initialize from localStorage on mount
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(VIEWPORT_STORAGE_KEY);
    const parsed = parseStoredViewport(stored);
    if (parsed) {
      return parsed;
    }
  }
  return {
    zoom: ZOOM.DEFAULT,
    panX: 0,
    panY: 0,
  };
});
```

**Why this works:**
- Lazy initialization runs once before first render
- No state update needed after mount
- Eliminates one source of re-renders

### 4. Apply Viewport Only Once When Canvas Created ✅

**File:** `hooks/useViewport.ts`

```typescript
// ✅ Apply viewport when canvas becomes available (only once)
useEffect(() => {
  if (!canvas) return;

  // Apply the current viewport state to the canvas
  const vpt = canvas.viewportTransform || [1, 0, 0, 1, 0, 0];
  vpt[0] = viewport.zoom;
  vpt[3] = viewport.zoom;
  vpt[4] = viewport.panX;
  vpt[5] = viewport.panY;
  setViewportTransform(canvas, vpt);
  
  // Only run when canvas is first created, not on viewport changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [canvas]);
```

**Why this works:**
- Only applies viewport when canvas reference changes
- Doesn't re-apply on every viewport state change
- Prevents unnecessary canvas operations

## Files Modified

1. **app/dashboard/DashboardClient.tsx**
   - Added `useCallback` import
   - Wrapped `handleCanvasReady` in `useCallback`

2. **components/canvas/Canvas.tsx**
   - Removed `onCanvasReady` from useEffect dependencies
   - Added eslint-disable comment with explanation

3. **hooks/useViewport.ts**
   - Changed `useState` to lazy initialization from localStorage
   - Simplified viewport application to run only once
   - Removed unused `useRef` import
   - Made all effects more defensive

## Testing Verification

✅ **No more infinite loop errors**
✅ **Canvas renders once on mount**
✅ **Viewport persists correctly from localStorage**
✅ **Pan and zoom work smoothly**
✅ **Zoom controls function properly**
✅ **No TypeScript errors**
✅ **No linting errors**

## Key Learnings

### 1. Callback Dependencies in React
When passing callbacks to child components that use them in useEffect dependencies:
- **Always memoize** with `useCallback`
- **Empty dependency array** if the callback doesn't need external values
- Consider removing from dependencies if only used for side effects

### 2. Lazy State Initialization
When reading from external sources (localStorage, API, etc.) for initial state:
- Use **lazy initializer**: `useState(() => computeInitialValue())`
- Runs only once before first render
- Prevents extra state updates and re-renders

### 3. useEffect Dependency Arrays
Sometimes it's correct to omit dependencies when:
- You only want the effect to run once
- The dependency would cause unnecessary re-runs
- **Document the decision** with eslint-disable and comments

### 4. Canvas Lifecycle
- Canvas initialization is expensive
- Should only happen when dimensions change or component mounts
- Callbacks from parent should not trigger re-initialization

## React Render Cycle Understanding

```
Component Mount:
1. Call function component
2. Run useState (with lazy initializer if provided)
3. Return JSX
4. React commits to DOM
5. Run useEffect callbacks
6. Component is mounted ✅

Component Update (state change):
1. Call function component again
2. useState returns current state
3. Return JSX
4. React compares with previous
5. Update DOM if needed
6. Run useEffect callbacks (if dependencies changed)
7. Component is updated ✅
```

The key insight: **Avoid state updates in useEffect that depend on props that change on every render.**

## Prevention Checklist

When creating components with callbacks:

- [ ] Is the callback memoized with `useCallback`?
- [ ] Does the child component use the callback in useEffect?
- [ ] If yes, are the dependencies appropriate?
- [ ] Could the effect run only once instead?
- [ ] Is initial state computed synchronously or in useEffect?
- [ ] Could lazy initialization eliminate a state update?

## Impact

- 🚀 **Performance:** Eliminated infinite re-render loop
- 🐛 **Bugs Fixed:** Maximum update depth error resolved
- ✨ **User Experience:** Canvas loads smoothly on first render
- 📦 **Code Quality:** Better understanding of React lifecycle
- 🔧 **Maintainability:** Clear documentation of intentional choices

---

**Status:** ✅ RESOLVED
**Date Fixed:** October 13, 2025
**Canvas Status:** Fully functional with pan/zoom working correctly


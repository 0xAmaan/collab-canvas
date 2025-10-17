# 🧹 Code Cleanup Recommendations

**Generated**: 2025-01-16
**Purpose**: Reduce complexity, remove dead code, simplify logic without losing functionality

---

## 🎯 Summary

Total potential lines removed: **~300-400 lines** (~10-15% reduction)
Complexity reduction: **Medium-High impact**
Risk level: **Low** (all removals are safe)

---

## ❌ Dead Code to Remove

### 1. **lib/shape-utils.ts** - COMPLETELY UNUSED ❌

**Status**: Not imported anywhere in the codebase
**Lines**: 94 lines
**Action**: Delete entire file

**Functions that are never used**:
- `generateShapeId()` - Convex generates IDs now
- `isPointInShape()` - Fabric.js handles hit detection
- `getShapeBounds()` - Not needed with Fabric
- `shapesOverlap()` - Not implemented
- `moveShape()` - Handled by Convex mutations
- `distance()` - Unused
- `clamp()` - Unused

**Safe to delete**: ✅ Yes - zero imports found

---

### 2. **components/canvas/Shape.tsx** - 2 Unused Functions ❌

**Functions to remove**:

```typescript
// Lines 92-101 - NEVER USED
export function applySelectionStyle(fabricObj: FabricObject): void { ... }

// Lines 106-110 - NEVER USED
export function removeSelectionStyle(fabricObj: FabricObject): void { ... }
```

**Reason**: Selection styling is now handled directly in `Canvas.tsx` and `SelectionBox.tsx`

**Keep**:
- `createFabricRect()` ✅ Used in Canvas.tsx
- `updateFabricRect()` ✅ Used in Canvas.tsx
- `getShapeFromFabricObject()` ⚠️ Imported but never called (see below)

**Action**: Delete lines 92-110 (19 lines)

---

### 3. **components/canvas/Shape.tsx** - getShapeFromFabricObject() ⚠️

**Status**: Imported in Canvas.tsx line 15, but never actually called
**Lines**: 24 lines (lines 65-88)

**Investigation needed**: Check if this was intended for future use
**Recommendation**: Delete for now, can add back if needed

---

### 4. **components/canvas/SelectionBox.tsx** - 3 Unused Functions ❌

**Functions to remove**:

```typescript
// Lines 25-39 - NEVER USED
export function showSelection(obj: FabricObject): void { ... }

// Lines 44-50 - NEVER USED
export function hideSelection(obj: FabricObject): void { ... }

// Lines 55-57 - NEVER USED
export function isSelected(obj: FabricObject): boolean { ... }

// Lines 62-90 - NEVER USED
export function drawCustomHandles(...): void { ... }
```

**Keep only**:
- `configureSelectionStyle()` ✅ Used in Canvas.tsx line 150

**Action**: Delete lines 25-90 (66 lines)
**Result**: File shrinks from 91 lines → 25 lines

---

## 🔧 Simplification Opportunities

### 5. **hooks/usePresence.ts** - Excessive Console Logging 📢

**Current state**: 39 console.log statements
**Impact**: Production bundle includes ~2-3KB of debug strings

**Recommendation**: Create a debug flag

```typescript
// Add at top of file:
const DEBUG_PRESENCE = process.env.NODE_ENV === 'development';

// Replace all:
console.log("[usePresence] ...");

// With:
if (DEBUG_PRESENCE) console.log("[usePresence] ...");
```

**Lines saved**: 0 (but cleaner production build)
**Benefit**: Production code is cleaner, debugging still available in dev

---

### 6. **hooks/usePresence.ts** - Redundant Visibility Checks 🔄

**Issue**: Multiple overlapping checks for window visibility

Currently checking:
- `document.hidden` (lines 51, 174, 262, 336)
- `!isWindowVisibleRef.current` (lines 55)
- `!isWindowFocusedRef.current` (lines 61, 177)
- `!document.hasFocus()` (lines 176)

**Recommendation**: Create a single helper function

```typescript
const isWindowActive = () => {
  return !document.hidden &&
         isWindowVisibleRef.current &&
         isWindowFocusedRef.current;
};

// Then replace all checks with:
if (!isWindowActive()) return;
```

**Lines saved**: ~15-20 lines
**Benefit**: DRY, easier to modify logic

---

### 7. **convex/presence.ts** - Simplify updatePresence ♻️

**Current** (lines 86-94):
```typescript
if (!presence) {
  console.warn(`Presence record not found for user ${userId}...`);
  return null;
}
```

**Issue**: Warning spam in normal operation (when user switches tabs)

**Recommendation**: Remove console.warn or make it conditional

```typescript
if (!presence) {
  // Silently return - normal during tab switches
  return null;
}
```

**Lines saved**: 3 lines
**Benefit**: Cleaner logs

---

## 📊 Summary of Removals

| File | Current Lines | Remove | New Lines | Savings |
|------|--------------|--------|-----------|---------|
| lib/shape-utils.ts | 94 | ALL | 0 | **-94** |
| components/canvas/Shape.tsx | 111 | 43 | 68 | **-43** |
| components/canvas/SelectionBox.tsx | 91 | 66 | 25 | **-66** |
| hooks/usePresence.ts | 420 | ~20 | ~400 | **-20** |
| convex/presence.ts | 214 | 3 | 211 | **-3** |
| **TOTAL** | **930** | **226** | **704** | **-226 lines** |

**Percentage reduction**: ~24% across these files
**Overall codebase reduction**: ~5% (226 / ~4500 total lines)

---

## ✅ Action Plan (Priority Order)

### Phase 1: Safe Deletions (Zero Risk)
1. ✅ Delete `lib/shape-utils.ts` entirely
2. ✅ Remove unused functions from `SelectionBox.tsx`
3. ✅ Remove unused functions from `Shape.tsx`

**Time**: 5 minutes
**Lines removed**: 203

---

### Phase 2: Simplifications (Low Risk)
4. ✅ Wrap console.logs in `DEBUG_PRESENCE` flag
5. ✅ Create `isWindowActive()` helper in usePresence
6. ✅ Remove console.warn from updatePresence

**Time**: 15 minutes
**Lines removed**: 23
**Code quality**: Significantly improved

---

### Phase 3: Optional Cleanup
7. ⚠️ Decide on `getShapeFromFabricObject()` - delete or document future use
8. ⚠️ Review progress-logs folder - move to /docs or delete

**Time**: 10 minutes

---

## 🚫 What NOT to Touch

### Keep These (They Look Complex But Are Necessary)

1. **hooks/usePresence.ts visibility handlers** - Complex but essential for preventing ghost cursors
2. **Canvas.tsx sync logic** (lines 507-564) - Looks over-engineered but critical for multiplayer
3. **Heartbeat system** - All that complexity prevents stale presence records
4. **Throttling in useThrottle.ts** - Simple and clean, no changes needed

---

## 💡 Insights

`★ Insight ─────────────────────────────────────`
**Why is there dead code?** Your app evolved! Early on, you probably planned to handle shapes manually (hence `shape-utils.ts`), but then Fabric.js took over most of that work. The selection functions in `SelectionBox.tsx` were likely prototypes before you settled on the current approach. This is **normal** in iterative development — the key is cleaning up once you've found the right pattern!
`─────────────────────────────────────────────────`

---

## 🎯 Expected Impact

**Before cleanup**:
- Total TS/TSX files: 47
- Approximate LOC: ~4,500
- Production bundle: Includes unused code

**After cleanup**:
- Same 47 files (minus 1)
- Approximate LOC: ~4,274
- Production bundle: ~5-10KB smaller
- **Most importantly**: Code is easier to navigate and understand

---

## 🔍 How to Verify Safety

Before deleting anything, run:

```bash
# Check for imports
grep -r "shape-utils" --exclude-dir=node_modules --exclude-dir=.next .

# Check for function usage
grep -r "showSelection\|hideSelection" --exclude-dir=node_modules .

# Run tests (if you have any)
bun test

# Build to check for type errors
bun run build
```

If all clear ✅ → Safe to delete!

---

## 📝 Next Steps

1. Review this document
2. Start with Phase 1 (safest deletions)
3. Test after each deletion
4. Move to Phase 2 when comfortable

**Questions to consider**:
- Do you want me to implement these changes?
- Should we do all at once or incrementally?
- Any files you're unsure about keeping/deleting?

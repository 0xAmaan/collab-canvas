# CollabCanvas Bug Fix Plan

## ✅ Completed Tasks

### Phase 1: Foundation (COMPLETE)
- **2.1** Unified `fill` vs `fillColor` naming - Renamed all `fillColor` → `fill` across 17 files
- **2.2** Added polygon support to createShape validator and useShapes hook
- **Polygon creation** - Fixed missing polygon data in createShape switch statement
- **Property panel updates** - Created unified `handleShapeUpdate` for instant UI feedback
- **Color picker UX** - Removed auto-close, updates apply instantly
- **Polygon stroke** - Removed black border artifact
- **Number input behavior** - Changed to apply on Enter/blur instead of every keystroke
- **Type safety** - Added fallback color for undefined fill values

---

## 🎯 Current Focus: Phase 2 - Quick Wins

### TIER 1: Simple UI Fixes (Next Up)

#### 1.1 AI Sidebar Width (+20px)
- **File:** `components/ai/AIChatSidebar.tsx`
- **Change:** Increase width by 20px
- **Complexity:** 1/10

#### 1.2 Remove ColorPicker from Bottom Toolbar
- **File:** `components/toolbar/BottomToolbar.tsx`
- **Change:** Remove color picker component (sidebar picker already works)
- **Complexity:** 1/10

#### 1.3 Right Sidebar Section Reordering
- **File:** `components/properties/PropertiesSidebar.tsx`
- **Change:** Reorder to Position → Transform → Appearance
- **Complexity:** 1/10

---

## Remaining Bugs

### TIER 3: Property Panel Styling
- **3.2** Standardize sidebar styling (dividers, headers, spacing)

### TIER 4: UI/UX Polish
- **4.1** Keyboard shortcuts UI redesign (more compact, Figma-like)
- **4.2** Text tool: exit to select mode after editing
- **4.3** Remove text hover highlight
- **4.4** Make purple theme configurable

### TIER 5: Shape Rendering
- **5.1** Line disappearing on hover
- **5.2** Circle/ellipse resize visual lag
- **5.3** Pencil/path not persisting to DB

### TIER 6: Multi-Select
- **6.1** Multi-selection issues

### TIER 7: Advanced
- **7.1** Delete shape UI error
- **7.2** Connection status accuracy
- **7.3** Left sidebar resize issue
- **7.4** Canvas resize lag

---

## Future: Schema Rearchitecture
- Consider discriminated unions or separate tables after all bugs fixed
- Priority: Low | Effort: 4-6 hours

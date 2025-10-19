# CollabCanvas - Priority Features Implementation Plan

## Overview

This plan covers the missing features needed to reach a **B grade (80+ points)** on the rubric. Current score: ~75-78 points. Target: 85+ points.

---

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

## Feature 4: Project Management System (Multi-Canvas)

**Difficulty: 8/10** | **Time: 10-12 hours** | **Points: Required for usability**

### Database Schema Changes Required: YES

Major schema restructuring needed:

```typescript
// New table: projects
projects: defineTable({
  name: v.string(),
  ownerId: v.string(), // Creator
  createdAt: v.number(),
  lastModified: v.number(),
  thumbnail: v.optional(v.string()), // Base64 preview
}).index("by_owner", ["ownerId"]),

// Update shapes table
shapes: defineTable({
  projectId: v.id("projects"), // FOREIGN KEY
  // ... existing fields
}).index("by_project", ["projectId"])
  .index("by_project_zIndex", ["projectId", "zIndex"]),

// Update presence table  
presence: defineTable({
  projectId: v.id("projects"), // Which project user is viewing
  // ... existing fields
}).index("by_project", ["projectId"]),
```

### Implementation Steps:

1. **Schema Migration** (2 hours)

   - Create projects table
   - Add projectId to shapes and presence
   - Migration: create default project for all existing shapes
   - Update all queries/mutations to filter by projectId

2. **Project Management UI** (4-5 hours)

   - Create `/app/projects/page.tsx` - project grid view
   - Create `components/projects/ProjectCard.tsx` - project preview
   - Create `components/projects/NewProjectDialog.tsx` - create/rename
   - Update routing: `/dashboard/[projectId]` instead of `/dashboard`

3. **Project CRUD Operations** (3-4 hours)

   - `convex/projects.ts` - create, list, update, delete, duplicate
   - Auto-generate thumbnails on project save
   - Project sharing/permissions (optional - can be post-MVP)

4. **Navigation Updates** (1-2 hours)

   - Add "Back to Projects" button in dashboard
   - Project switcher dropdown in toolbar
   - Update middleware to protect project routes

### Files to create/modify:

- `convex/schema.ts` - add projects table
- `convex/projects.ts` - new file for project mutations/queries
- `convex/shapes.ts` - update all queries to filter by projectId
- `convex/presence.ts` - update to track projectId
- `app/projects/page.tsx` - project list page
- `app/dashboard/[projectId]/page.tsx` - refactor dashboard with projectId
- `components/projects/*` - project UI components

---

## Feature 5: Alignment Tools

**Difficulty: 5/10** | **Time: 4-5 hours** | **Points: +3**

### Implementation:

Add alignment buttons to properties panel (only visible when 2+ shapes selected):

**Alignment Options:**

- Align Left - align all shapes to leftmost edge
- Align Center (Horizontal) - center all shapes horizontally
- Align Right - align all shapes to rightmost edge
- Align Top - align all shapes to topmost edge  
- Align Middle (Vertical) - center all shapes vertically
- Align Bottom - align all shapes to bottommost edge

**Distribution Options:**

- Distribute Horizontally - even spacing between shapes (left to right)
- Distribute Vertically - even spacing between shapes (top to bottom)

### Files to create/modify:

- Create `components/properties/AlignmentPanel.tsx`
- Create `lib/canvas/alignment-utils.ts` - alignment calculations
- Update `components/properties/PropertiesSidebar.tsx` - add alignment section
- Add keyboard shortcuts to `hooks/useKeyboard.ts`

### Technical approach:

```typescript
// Align Left: move all shapes to leftmost x
const leftmostX = Math.min(...shapes.map(s => s.x));
shapes.forEach(s => updateShape(s._id, { x: leftmostX }));

// Distribute Horizontally
const sortedByX = shapes.sort((a, b) => a.x - b.x);
const totalWidth = sortedByX[sortedByX.length-1].x - sortedByX[0].x;
const spacing = totalWidth / (shapes.length - 1);
// Apply evenly spaced positions
```

---

## Feature 6: Version Control & Restore Checkpoints (Tier 3)

**Difficulty: 9/10** | **Time: 12-15 hours** | **Points: +3**

### Database Schema Changes Required: YES

```typescript
// New table: projectSnapshots
projectSnapshots: defineTable({
  projectId: v.id("projects"),
  name: v.string(), // "Auto-save" or user-named
  createdAt: v.number(),
  createdBy: v.string(),
  thumbnail: v.optional(v.string()),
  shapesSnapshot: v.string(), // JSON stringified array of shapes
}).index("by_project", ["projectId"])
  .index("by_project_time", ["projectId", "createdAt"]),
```

### Implementation Steps:

1. **Auto-save System** (4-5 hours)

   - Background timer: snapshot every 5 minutes (only if changes detected)
   - Debounced snapshot on major changes (10+ shapes added/deleted)
   - Keep last 20 auto-saves, delete older ones
   - Store compressed JSON of all shapes

2. **Version History UI** (4-5 hours)

   - Create `components/version/VersionHistoryPanel.tsx`
   - Timeline view with timestamps
   - Preview thumbnail for each snapshot
   - "Restore" button with confirmation dialog
   - "Create Checkpoint" button for manual saves

3. **Restore Functionality** (3-4 hours)

   - Parse snapshot JSON
   - Delete all current shapes
   - Recreate shapes from snapshot
   - Maintain undo/redo support (restore = bulk delete + bulk create)
   - Show diff view (what changed between versions - optional)

4. **Performance Optimization** (1 hour)

   - Compress snapshot JSON with LZ-string
   - Lazy load old snapshots (pagination)
   - Cache recent snapshots in memory

### Files to create/modify:

- `convex/schema.ts` - add projectSnapshots table
- `convex/snapshots.ts` - snapshot CRUD operations
- `components/version/VersionHistoryPanel.tsx`
- `components/version/SnapshotItem.tsx`
- `lib/canvas/snapshot-utils.ts` - serialize/deserialize shapes
- `hooks/useAutoSave.ts` - background snapshot timer

---

## Feature 7: Improve AI Agent Reliability

**Difficulty: 6/10** | **Time: 5-6 hours** | **Points: +2-3**

### Issues to fix:

1. Add more commands (currently 5, need 8+)
2. Improve command accuracy and error handling
3. Better context awareness (know which shapes exist)
4. Multi-step command support

### New Commands to Add:

1. **delete_shape** - delete shapes by description
2. **change_color** - modify shape colors
3. **resize_shape** - resize specific shapes
4. **move_to_position** - move shapes to absolute positions
5. **duplicate_shape** - duplicate shapes by description
6. **create_group** - create multiple shapes as a group layout

### Implementation:

- Update `app/api/ai/canvas/route.ts` - add new tool definitions
- Improve system prompt with better examples
- Add command validation before execution
- Better error messages to user
- Add "undo last AI action" button

### Files to modify:

- `app/api/ai/canvas/route.ts` - add new tools, improve prompt
- `lib/ai/types.ts` - add new command types
- `lib/ai/client-executor.ts` - improve execution logic
- `components/ai/AIFeedback.tsx` - better error displays

---

## Priority Order & Timeline

### Week 1 (Core Features - Path to 80 points):

1. **Export PNG/SVG** - 2-3 hours ✓
2. **Enhanced Color Picker** - 3-4 hours ✓
3. **Alignment Tools** - 4-5 hours ✓
4. **Improve AI Agent** - 5-6 hours ✓

**Total: ~15-18 hours** → **+9-10 points** = **84-88 points (B+)**

### Week 2 (Advanced Features - Path to 90+ points):

5. **Layers Panel + Z-Index** - 6-8 hours ✓
6. **Project Management** - 10-12 hours ✓
7. **Version Control** - 12-15 hours ✓

**Total: ~28-35 hours** → **+9-12 points** = **93-100 points (A)**

---

## Additional Requirements (Pass/Fail)

### AI Development Log (Required)

**Time: 1-2 hours**

Create `AI-DEVELOPMENT-LOG.md` with 3 of these 5 sections:

1. ✅ **Tools & Workflow** - Claude, Cursor, GitHub Copilot usage
2. ✅ **Prompting Strategies** - Effective patterns used
3. ✅ **Code Analysis** - Estimate % AI vs hand-written
4. ✅ **Strengths & Limitations** - Where AI excelled/struggled
5. ✅ **Key Learnings** - Insights about AI pair programming

### Demo Video (Required)

**Time: 2-3 hours**

Record 3-5 minute video showing:

- Real-time collaboration (2 browser windows side-by-side)
- AI commands executing
- Advanced features (layers, alignment, export)
- Brief architecture walkthrough
- Upload to YouTube/Loom

---

## Technical Considerations

### Database Migration Strategy

For features requiring schema changes (3, 4, 6):

1. Use Convex's schema versioning (no manual migrations needed)
2. Deploy new schema to development environment first
3. Test with existing data
4. Use optional fields with defaults for backwards compatibility
5. Production deployment: Convex handles schema updates automatically

### Performance Impact

- **Z-Index queries**: Add index `by_project_zIndex` for fast ordering
- **Snapshots**: Compress JSON, limit to 20 recent snapshots
- **Projects**: Lazy load project list, paginate if 50+ projects
- **Export**: Run in Web Worker to avoid blocking UI

### Testing Checklist

- [ ] Test with 500+ shapes
- [ ] Test with 5+ concurrent users  
- [ ] Test z-index with 100+ layers
- [ ] Test snapshot/restore with large projects
- [ ] Test alignment with 20+ selected shapes
- [ ] Test export quality at different zoom levels
# CollabCanvas - Priority Features Implementation Plan

## Overview

This plan covers the missing features needed to reach a **B grade (80+ points)** on the rubric. Current score: ~75-78 points. Target: 85+ points.

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
# CollabCanvas Bug Fix Plan

High Level Overview
### TIER 7: Advanced
- **7.1** Delete shape UI error
- **7.2** Connection status accuracy
- **7.3** Left sidebar resize issue
- **7.4** Canvas resize lag





### TIER 4: Canvas Functionality Fix

#### Text Tool: Exit to Select Mode

**File:** `components/canvas/tools/useTextTool.ts`

**Current behavior (line 44-78):** Clicking out creates new text

**Desired:** Switch to select tool after editing

**Change:** In `onMouseDown`, check if clicking out of active text → call tool change callback

**Complexity:** 5/10 — Requires proper planning to identify the actual issue & clean solution

---



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
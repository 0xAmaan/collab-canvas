# CollabCanvas Schema Rearchitecture Plan

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
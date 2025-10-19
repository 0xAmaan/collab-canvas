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



### **PHASE 2: Style Consolidation**

**Goal**: Extract repeated Tailwind patterns into constants/components

#### Analysis of Duplicate Patterns:

**Pattern 1: Dark Panel Backgrounds** (8 occurrences)
```tsx
// Current scattered usage:
"bg-[#1E1E1E]"  // Used in: AIChatSidebar, PropertiesSidebar
"bg-[#1A1A1A]"  // Used in: ChatInput
"bg-[#282828]"  // Used in: KeyboardShortcutsHelp
"bg-[#242424]"  // Used in: KeyboardShortcutsHelp footer
"bg-[#2C2C2C]"  // Used in: ChatInput, ChatMessage, TransformPanel (x2)
"bg-[#383838]"  // Used in: BottomToolbar, ToolDropdown, TransformPanel hover
```

**Pattern 2: Interactive Button States** (6 occurrences)
```tsx
// Primary action button:
"bg-[#8A63D2] hover:bg-[#7a53c2]"  // ChatInput, KeyboardShortcutsHelp

// Secondary button:
"bg-[#2C2C2C] hover:bg-[#383838]"  // TransformPanel (x2)

// Subtle hover:
"bg-white/5 hover:bg-white/10"  // PropertiesSidebar
```

**Pattern 3: Gradient Active States** (3 occurrences)
```tsx
"bg-gradient-to-br from-blue-500 to-purple-600"
// Used in: ToolButton.tsx (L38, L55)
```

**Pattern 4: Border Styles** (15+ occurrences)
```tsx
"border border-white/10"  // Universal subtle border
"border-t border-white/10"  // Top border divider
"border-l border-white/8"   // Left sidebar border (PropertiesSidebar)
```

#### Solution: Create Design System Constants

**File**: `constants/ui-styles.ts`

```typescript
/**
 * Centralized UI style constants for consistent theming
 * Simplified color palette based on actual usage in the app
 */

// Core background colors (simplified from 6 → 3)
export const bgSidebar = "bg-[#1E1E1E]";      // Main sidebars (AI chat, properties)
export const bgPanel = "bg-[#2C2C2C]";        // Panels, inputs, nested surfaces
export const bgToolbar = "bg-[#383838]";      // Toolbars, dropdowns

// Primary action color (purple accent - used in 3 files)
export const bgPrimary = "bg-[#8A63D2]";
export const bgPrimaryHover = "hover:bg-[#7a53c2]";

// Interactive hover states
export const hoverSubtle = "bg-white/5 hover:bg-white/10";           // Subtle interactions
export const hoverPanel = "bg-[#2C2C2C] hover:bg-[#383838]";         // Panel buttons

// Gradient for active tool state (ToolButton only)
export const gradientActive = "bg-gradient-to-br from-blue-500 to-purple-600";

// Common border color
export const borderDefault = "border-white/10";
export const borderSubtle = "border-white/8";

// Focus ring (inputs)
export const focusRing = "focus:border-[#8A63D2] focus:ring-1 focus:ring-[#8A63D2]";
```

**Usage Pattern**: Import individual constants, use inline

```typescript
import { bgPanel, bgPrimary, bgPrimaryHover, borderDefault, focusRing } from "@/constants/ui-styles";

// Use inline with template literals for readability
<input className={`${bgPanel} border ${borderDefault} ${focusRing} rounded-lg px-3 py-2`} />
<button className={`${bgPrimary} ${bgPrimaryHover} px-4 py-2 rounded-lg text-white`} />
```

#### Refactoring Examples:

**Before** (`components/ai/ChatInput.tsx`):
```tsx
<div className="border-t border-white/10 p-3 bg-[#1A1A1A]">
  <input
    className="flex-1 bg-[#2C2C2C] text-white placeholder-[#666666] outline-none text-[13px] px-3 py-2 rounded-lg border border-white/10 focus:border-[#8A63D2] focus:ring-1 focus:ring-[#8A63D2] transition-colors"
  />
  <button
    className="px-3 py-2 bg-[#8A63D2] hover:bg-[#7a53c2] rounded-lg text-white text-[13px] font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
  >
</div>
```

**After**:
```tsx
import { bgPanel, bgPrimary, bgPrimaryHover, borderDefault, focusRing } from "@/constants/ui-styles";

<div className={`border-t ${borderDefault} p-3 ${bgPanel}`}>
  <input
    className={`flex-1 ${bgPanel} border ${borderDefault} ${focusRing} rounded-lg text-white placeholder-[#666666] outline-none text-[13px] px-3 py-2 transition-colors`}
  />
  <button
    className={`px-3 py-2 ${bgPrimary} ${bgPrimaryHover} rounded-lg text-white text-[13px] font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
  >
</div>
```

**Before** (`components/toolbar/ToolButton.tsx`):
```tsx
className={`
  ${active
    ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/50"
    : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
  }
`}
```

**After**:
```tsx
import { gradientActive, hoverSubtle } from "@/constants/ui-styles";

className={`
  ${active
    ? `${gradientActive} text-white shadow-lg shadow-blue-500/50`
    : `${hoverSubtle} text-white/70 hover:text-white`
  }
`}
```

#### Files to Update (15 files):
1. `components/ai/ChatInput.tsx` (3 patterns)
2. `components/ai/ChatMessage.tsx` (1 pattern)
3. `components/ai/AIChatSidebar.tsx` (1 pattern)
4. `components/toolbar/ToolButton.tsx` (2 patterns)
5. `components/toolbar/BottomToolbar.tsx` (1 pattern)
6. `components/toolbar/ToolDropdown.tsx` (1 pattern)
7. `components/properties/TransformPanel.tsx` (2 patterns)
8. `components/properties/PropertiesSidebar.tsx` (1 pattern)
9. `components/ui/KeyboardShortcutsHelp.tsx` (3 patterns)
10. Additional files as discovered

**Verification**:
- Run `grep -r "bg-\[#" --include="*.tsx" | wc -l` before/after to track reduction
- Visual regression test: Open dashboard, verify all panels/buttons look identical

---

### **PHASE 3: Code Deduplication**

**Goal**: DRY up repeated logic patterns

#### 3.1 Shape Duplication Logic (130 lines → 20 lines)

**Problem**: `DashboardClient.tsx` lines 566-696 has massive switch statement duplicating shape properties.

**Current Code** (partial):
```typescript
// DashboardClient.tsx handleDuplicateSelected
const shapesToDuplicate: typeof shapes = [];
// ... collection logic ...

for (const shapeToDuplicate of shapesToDuplicate) {
  let duplicateData: any = {
    type: shapeToDuplicate.type,
    createdBy: userId,
    createdAt: Date.now(),
    lastModified: Date.now(),
    lastModifiedBy: userId,
  };

  switch (shapeToDuplicate.type) {
    case "rectangle":
      duplicateData = {
        ...duplicateData,
        x: shapeToDuplicate.x + 10,
        y: shapeToDuplicate.y + 10,
        width: shapeToDuplicate.width,
        height: shapeToDuplicate.height,
        angle: shapeToDuplicate.angle,
        fillColor: shapeToDuplicate.fillColor,
      };
      break;
    case "circle":
      duplicateData = { /* same pattern */ };
      break;
    // ... 5 more cases with same pattern
  }
}
```

**Solution**: Create `lib/canvas/duplicate-shape.ts`

```typescript
import type { Shape } from "@/types/shapes";

const OFFSET = 10; // Duplicate offset in pixels

/**
 * Duplicates a shape with position offset
 * Handles all shape types with type-specific property copying
 */
export const duplicateShape = (
  shape: Shape,
  userId: string,
  offset = OFFSET
): Omit<Shape, "_id" | "_creationTime"> => {
  const baseShape = {
    type: shape.type,
    createdBy: userId,
    createdAt: Date.now(),
    lastModified: Date.now(),
    lastModifiedBy: userId,
  };

  // Line shapes have different coordinate system (x1, y1, x2, y2)
  if (shape.type === "line") {
    return {
      ...baseShape,
      type: "line",
      x1: (shape.x1 ?? 0) + offset,
      y1: (shape.y1 ?? 0) + offset,
      x2: (shape.x2 ?? 0) + offset,
      y2: (shape.y2 ?? 0) + offset,
      strokeWidth: shape.strokeWidth,
      strokeColor: shape.strokeColor,
    };
  }

  // Path shapes have pathData
  if (shape.type === "path") {
    return {
      ...baseShape,
      type: "path",
      x: shape.x + offset,
      y: shape.y + offset,
      width: shape.width,
      height: shape.height,
      pathData: shape.pathData,
      stroke: shape.stroke,
      strokeWidth: shape.strokeWidth,
      fillColor: shape.fillColor,
      angle: shape.angle,
    };
  }

  // Polygon shapes have points array
  if (shape.type === "polygon") {
    return {
      ...baseShape,
      type: "polygon",
      x: shape.x + offset,
      y: shape.y + offset,
      width: shape.width,
      height: shape.height,
      points: shape.points,
      fillColor: shape.fillColor,
      angle: shape.angle,
    };
  }

  // Text shapes have text-specific properties
  if (shape.type === "text") {
    return {
      ...baseShape,
      type: "text",
      x: shape.x + offset,
      y: shape.y + offset,
      text: shape.text,
      fontSize: shape.fontSize,
      fontFamily: shape.fontFamily,
      fillColor: shape.fillColor,
      angle: shape.angle,
    };
  }

  // Standard shapes (rectangle, circle, ellipse) - share same structure
  // All have x, y, width, height, angle, fillColor
  return {
    ...baseShape,
    type: shape.type as "rectangle" | "circle" | "ellipse",
    x: shape.x + offset,
    y: shape.y + offset,
    width: shape.width,
    height: shape.height,
    angle: shape.angle,
    fillColor: shape.fillColor,
  };
};

/**
 * ALTERNATIVE APPROACH: Further simplified with property groups
 * (Note: This might be over-simplified and reduce clarity)
 */
export const duplicateShapeAlt = (
  shape: Shape,
  userId: string,
  offset = 10
): Omit<Shape, "_id" | "_creationTime"> => {
  const baseShape = {
    type: shape.type,
    createdBy: userId,
    createdAt: Date.now(),
    lastModified: Date.now(),
    lastModifiedBy: userId,
  };

  // Property groups that share the same offset pattern
  const hasStandardPosition = ["rectangle", "circle", "ellipse", "text", "path", "polygon"].includes(shape.type);
  const hasLinePosition = shape.type === "line";

  if (hasLinePosition) {
    return { ...baseShape, ...shape, x1: shape.x1 + offset, y1: shape.y1 + offset, x2: shape.x2 + offset, y2: shape.y2 + offset };
  }

  if (hasStandardPosition) {
    const commonProps = { x: shape.x + offset, y: shape.y + offset, width: shape.width, height: shape.height, fillColor: shape.fillColor, angle: shape.angle };

    // Type-specific properties
    if (shape.type === "text") return { ...baseShape, ...commonProps, text: shape.text, fontSize: shape.fontSize, fontFamily: shape.fontFamily };
    if (shape.type === "path") return { ...baseShape, ...commonProps, pathData: shape.pathData, stroke: shape.stroke, strokeWidth: shape.strokeWidth };
    if (shape.type === "polygon") return { ...baseShape, ...commonProps, points: shape.points };

    // Rectangle, circle, ellipse
    return { ...baseShape, ...commonProps };
  }

  return baseShape as any; // Fallback (shouldn't reach here)
};

// RECOMMENDATION: Use the first approach (duplicateShape) - more explicit and maintainable
// The alternative is more compact but trades clarity for brevity

/**
 * Batch duplicate multiple shapes
 */
export const duplicateShapes = (
  shapes: Shape[],
  userId: string,
  offset = OFFSET
): Array<Omit<Shape, "_id" | "_creationTime">> => {
  return shapes.map((shape) => duplicateShape(shape, userId, offset));
};
```

**After** (`DashboardClient.tsx`):
```typescript
import { duplicateShapes } from "@/lib/canvas/duplicate-shape";

const handleDuplicateSelected = useCallback(async () => {
  const activeObject = fabricCanvas?.getActiveObject();
  if (!activeObject) return;

  const shapesToDuplicate: typeof shapes = [];

  // ... collection logic (unchanged) ...

  // Duplicate and create all shapes
  const duplicatedShapes = duplicateShapes(shapesToDuplicate, userId);

  for (const duplicateData of duplicatedShapes) {
    const command = new CreateShapeCommand(
      duplicateData as any,
      createShape,
      deleteShape,
    );
    await history.execute(command);
  }
}, [/* deps */]);
```

**Result**: 130 lines → ~20 lines in DashboardClient.tsx

---

#### 3.2 Shape Finalization Functions (6 functions → 1 generic)

**Problem**: `Canvas.tsx` has 6 nearly identical finalization functions (lines 157-506)

**Current Pattern** (repeated 6 times):
```typescript
const finalizeRectangle = useCallback(async (rect: Rect) => {
  if ((rect.width || 0) < 5 || (rect.height || 0) < 5) {
    fabricCanvasRef.current?.remove(rect);
    return null;
  }

  const shapeData = {
    type: "rectangle" as const,
    x: rect.left || 0,
    y: rect.top || 0,
    width: rect.width || DEFAULT_SHAPE.WIDTH,
    height: rect.height || DEFAULT_SHAPE.HEIGHT,
    fillColor: DEFAULT_SHAPE.FILL_COLOR,
    createdBy: userId,
    createdAt: Date.now(),
    lastModified: Date.now(),
    lastModifiedBy: userId,
  };

  const command = new CreateShapeCommand(
    shapeData,
    createShapeInConvex,
    deleteShapeInConvex,
  );

  await historyRef.current.execute(command);
  const shapeId = (command as any).shapeId;
  if (shapeId) rect.set("data", { shapeId });
  return shapeId;
}, [userId, createShapeInConvex, deleteShapeInConvex]);

// ... 5 more similar functions: finalizeCircle, finalizeEllipse, finalizeLine, finalizeText, finalizePolygon
```

**Solution**: Create generic finalizer with validators

**File**: `lib/canvas/shape-validators.ts`
```typescript
import type { FabricObject, Rect, Circle, Ellipse, Line, IText, Polygon } from "fabric";

export type ShapeValidator<T extends FabricObject> = (obj: T) => boolean;

// Validators for each shape type
export const shapeValidators = {
  rectangle: (rect: Rect): boolean => {
    return (rect.width || 0) >= 5 && (rect.height || 0) >= 5;
  },

  circle: (circle: Circle): boolean => {
    return (circle.radius || 0) >= 3;
  },

  ellipse: (ellipse: Ellipse): boolean => {
    return (ellipse.rx || 0) >= 3 && (ellipse.ry || 0) >= 3;
  },

  line: (line: Line): boolean => {
    const x1 = line.x1 || 0;
    const y1 = line.y1 || 0;
    const x2 = line.x2 || 0;
    const y2 = line.y2 || 0;
    const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    return length >= 5;
  },

  text: (text: IText): boolean => {
    const textContent = text.text || "";
    return !!textContent && textContent !== "Type here";
  },

  polygon: (polygon: Polygon): boolean => {
    const points = (polygon.points as any[]) || [];
    return points.length >= 3;
  },
};
```

**File**: `lib/canvas/shape-finalizers.ts`
```typescript
import type { FabricObject, Canvas as FabricCanvas } from "fabric";
import type { Shape } from "@/types/shapes";
import { shapeValidators } from "./shape-validators";
import { CreateShapeCommand } from "../commands/CreateShapeCommand";

interface FinalizeOptions {
  canvas: FabricCanvas;
  object: FabricObject;
  shapeType: Shape["type"];
  extractShapeData: (obj: FabricObject) => Partial<Shape>;
  userId: string;
  createShape: any;
  deleteShape: any;
  history: any;
}

/**
 * Generic shape finalization logic
 * Validates, creates in Convex, and links shapeId to Fabric object
 */
export const finalizeShape = async ({
  canvas,
  object,
  shapeType,
  extractShapeData,
  userId,
  createShape,
  deleteShape,
  history,
}: FinalizeOptions): Promise<string | null> => {
  // Validate shape meets minimum size requirements
  const validator = shapeValidators[shapeType as keyof typeof shapeValidators];
  if (validator && !validator(object as any)) {
    canvas.remove(object);
    return null;
  }

  try {
    // Extract shape-specific data
    const specificData = extractShapeData(object);

    // Create base shape data
    const shapeData = {
      type: shapeType,
      ...specificData,
      createdBy: userId,
      createdAt: Date.now(),
      lastModified: Date.now(),
      lastModifiedBy: userId,
    };

    // Use command pattern for undo/redo
    const command = new CreateShapeCommand(
      shapeData as any,
      createShape,
      deleteShape,
    );

    await history.execute(command);

    // Link shapeId to Fabric object
    const shapeId = (command as any).shapeId;
    if (shapeId) {
      object.set("data", { shapeId });
    }

    return shapeId;
  } catch (error) {
    console.error(`Failed to create ${shapeType}:`, error);
    canvas.remove(object);
    return null;
  }
};
```

**After** (`Canvas.tsx`):
```typescript
import { finalizeShape } from "@/lib/canvas/shape-finalizers";
import { DEFAULT_SHAPE } from "@/constants/shapes";

// Rectangle finalization
const finalizeRectangle = useCallback(
  async (rect: Rect) =>
    finalizeShape({
      canvas: fabricCanvasRef.current!,
      object: rect,
      shapeType: "rectangle",
      extractShapeData: (obj) => ({
        x: obj.left || 0,
        y: obj.top || 0,
        width: obj.width || DEFAULT_SHAPE.WIDTH,
        height: obj.height || DEFAULT_SHAPE.HEIGHT,
        fillColor: DEFAULT_SHAPE.FILL_COLOR,
      }),
      userId,
      createShape: createShapeInConvex,
      deleteShape: deleteShapeInConvex,
      history: historyRef.current,
    }),
  [userId, createShapeInConvex, deleteShapeInConvex],
);

// Circle finalization
const finalizeCircle = useCallback(
  async (circle: Circle) =>
    finalizeShape({
      canvas: fabricCanvasRef.current!,
      object: circle,
      shapeType: "circle",
      extractShapeData: (obj: any) => {
        const diameter = (obj.radius || 0) * 2;
        return {
          x: obj.left || 0,
          y: obj.top || 0,
          width: diameter,
          height: diameter,
          fillColor: DEFAULT_SHAPE.FILL_COLOR,
        };
      },
      userId,
      createShape: createShapeInConvex,
      deleteShape: deleteShapeInConvex,
      history: historyRef.current,
    }),
  [userId, createShapeInConvex, deleteShapeInConvex],
);

// ... 4 more concise finalizers (ellipse, line, text, polygon)
```

**Result**: 350 lines of duplicated logic → ~150 lines (reusable core + concise wrappers)

---

#### 3.3 Object Transform Handlers (124 lines → 60 lines)

**Problem**: `Canvas.tsx` has nearly identical `object:scaling` (lines 1466-1527) and `object:rotating` (lines 1529-1589) handlers.

**Current Code** (repeated twice):
```typescript
fabricCanvas.on("object:scaling", (opt) => {
  if (!opt.target) return;

  // Handle ActiveSelection (multi-select)
  if (opt.target.type === "activeSelection") {
    const objects = (opt.target as any)._objects || [];
    for (const obj of objects) {
      const data = obj.get("data") as { shapeId?: string } | undefined;
      if (data?.shapeId && !objectStateBeforeModify.has(data.shapeId)) {
        const shape = shapes.find((s) => s._id === data.shapeId);
        if (shape) {
          const shapeData: any = {
            angle: shape.angle || 0,
          };
          if (shape.type === "line") {
            shapeData.x = shape.x1;
            shapeData.y = shape.y1;
            shapeData.width = 0;
            shapeData.height = 0;
          } else {
            shapeData.x = (shape as any).x || 0;
            shapeData.y = (shape as any).y || 0;
            shapeData.width = (shape as any).width || 0;
            shapeData.height = (shape as any).height || 0;
          }
          objectStateBeforeModify.set(data.shapeId, shapeData);
        }
      }
    }
    return;
  }

  // Handle single object
  const data = opt.target.get("data") as { shapeId?: string } | undefined;
  if (data?.shapeId && !objectStateBeforeModify.has(data.shapeId)) {
    const shape = shapes.find((s) => s._id === data.shapeId);
    if (shape) {
      const shapeData: any = {
        angle: shape.angle || 0,
      };
      if (shape.type === "line") {
        shapeData.x = shape.x1;
        shapeData.y = shape.y1;
        shapeData.width = 0;
        shapeData.height = 0;
      } else {
        shapeData.x = (shape as any).x || 0;
        shapeData.y = (shape as any).y || 0;
        shapeData.width = (shape as any).width || 0;
        shapeData.height = (shape as any).height || 0;
      }
      objectStateBeforeModify.set(data.shapeId, shapeData);
    }
  }
});

fabricCanvas.on("object:rotating", (opt) => {
  // EXACT SAME CODE as above
});
```

**Solution**: Extract shared logic

```typescript
// Helper: Extract shape state before modification
const captureShapeState = (
  target: FabricObject,
  shapes: Shape[],
  stateMap: Map<string, any>
) => {
  // Handle ActiveSelection (multi-select)
  if (target.type === "activeSelection") {
    const objects = (target as any)._objects || [];
    objects.forEach((obj: FabricObject) => {
      captureObjectState(obj, shapes, stateMap);
    });
    return;
  }

  // Handle single object
  captureObjectState(target, shapes, stateMap);
};

const captureObjectState = (
  obj: FabricObject,
  shapes: Shape[],
  stateMap: Map<string, any>
) => {
  const data = obj.get("data") as { shapeId?: string } | undefined;
  if (!data?.shapeId || stateMap.has(data.shapeId)) return;

  const shape = shapes.find((s) => s._id === data.shapeId);
  if (!shape) return;

  const shapeData: any = {
    angle: shape.angle || 0,
  };

  // Line shapes have different coordinate system
  if (shape.type === "line") {
    shapeData.x = shape.x1;
    shapeData.y = shape.y1;
    shapeData.width = 0;
    shapeData.height = 0;
  } else {
    shapeData.x = (shape as any).x || 0;
    shapeData.y = (shape as any).y || 0;
    shapeData.width = (shape as any).width || 0;
    shapeData.height = (shape as any).height || 0;
  }

  stateMap.set(data.shapeId, shapeData);
};

// Usage: Single handler for both events
const handleObjectTransformStart = (opt: any) => {
  if (!opt.target) return;
  captureShapeState(opt.target, shapes, objectStateBeforeModify);
};

fabricCanvas.on("object:scaling", handleObjectTransformStart);
fabricCanvas.on("object:rotating", handleObjectTransformStart);
```

**Result**: 124 lines → ~60 lines (shared logic extracted)

---

#### 3.4 Multi-select Utilities (5+ repeated patterns → 1 utility)

**Problem**: Repeated ActiveSelection checking in multiple files:
- `Canvas.tsx`: handleDeleteSelected, handleDuplicateSelected, object:modified
- `DashboardClient.tsx`: handleDuplicate, handleCopy, handleColorChange

**Current Pattern** (repeated 5+ times):
```typescript
const activeObject = fabricCanvas.getActiveObject();
if (!activeObject) return;

let shapesToProcess: Shape[] = [];

if (activeObject.type === "activeSelection") {
  const objects = (activeObject as any)._objects || [];
  for (const obj of objects) {
    const data = obj.get("data") as { shapeId?: string } | undefined;
    if (data?.shapeId) {
      const shape = shapes.find((s) => s._id === data.shapeId);
      if (shape) shapesToProcess.push(shape);
    }
  }
} else {
  const data = activeObject.get("data") as { shapeId?: string } | undefined;
  if (data?.shapeId) {
    const shape = shapes.find((s) => s._id === data.shapeId);
    if (shape) shapesToProcess.push(shape);
  }
}
```

**Solution**: Create `lib/canvas/selection-utils.ts`

```typescript
import type { Canvas as FabricCanvas, FabricObject } from "fabric";
import type { Shape } from "@/types/shapes";

/**
 * Extracts shape IDs from selected Fabric objects
 * Handles both single selection and multi-select (ActiveSelection)
 */
export const getSelectedShapeIds = (
  activeObject: FabricObject | null
): string[] => {
  if (!activeObject) return [];

  const shapeIds: string[] = [];

  // Multi-select
  if (activeObject.type === "activeSelection") {
    const objects = (activeObject as any)._objects || [];
    for (const obj of objects) {
      const data = obj.get("data") as { shapeId?: string } | undefined;
      if (data?.shapeId) {
        shapeIds.push(data.shapeId);
      }
    }
  } else {
    // Single selection
    const data = activeObject.get("data") as { shapeId?: string } | undefined;
    if (data?.shapeId) {
      shapeIds.push(data.shapeId);
    }
  }

  return shapeIds;
};

/**
 * Gets full Shape objects from selected Fabric objects
 */
export const getSelectedShapes = (
  activeObject: FabricObject | null,
  allShapes: Shape[]
): Shape[] => {
  const shapeIds = getSelectedShapeIds(activeObject);
  return shapeIds
    .map((id) => allShapes.find((s) => s._id === id))
    .filter((shape): shape is Shape => !!shape);
};

/**
 * Gets the active selection from canvas
 */
export const getActiveSelection = (
  canvas: FabricCanvas | null
): FabricObject | null => {
  return canvas?.getActiveObject() || null;
};
```

**After** (`Canvas.tsx` handleDeleteSelected):
```typescript
import { getSelectedShapes } from "@/lib/canvas/selection-utils";

const handleDeleteSelected = useCallback(async () => {
  const activeObject = fabricCanvasRef.current?.getActiveObject();
  const shapesToDelete = getSelectedShapes(activeObject, shapesRef.current);

  for (const shape of shapesToDelete) {
    const command = new DeleteShapeCommand(
      shape,
      createShapeInConvex,
      deleteShapeInConvex,
    );
    await historyRef.current.execute(command);
  }
}, [createShapeInConvex, deleteShapeInConvex]);
```

**Result**: ~80 lines of repeated selection logic → ~10 lines per usage

---

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

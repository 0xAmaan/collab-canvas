# Phase 1: Canvas Foundation Features

**Goal**: Expand canvas to support multiple shape types, color selection, and basic operations
**Target Points**: Section 2 Canvas Functionality: 5-6 pts (Good level)

---

## Overview

Add core shape types (circle, line, text) and essential features (color picker, copy/paste, multi-select) to establish a solid foundation for advanced features and AI integration.

---

## Features to Implement

### 1. Circle/Ellipse Shape
**Complexity**: Low
**Branch**: `feature/circle-shape`

**Requirements**:
- Draw circles by click-and-drag (similar to rectangle)
- Support resizing while maintaining proportions (for circles) or independent axes (for ellipses)
- Sync with Convex in real-time
- Show in multiplayer

**Implementation Details**:

**Schema Changes** (`convex/schema.ts`):
```typescript
shapes: defineTable({
  type: v.union(
    v.literal("rectangle"),
    v.literal("circle"),    // Add this
    v.literal("ellipse")    // Add this
  ),
  // ... existing fields
  // For circles: width = height = diameter
  // For ellipses: width and height can differ
})
```

**Type Definitions** (`types/shapes.ts`):
```typescript
export type ShapeType = "rectangle" | "circle" | "ellipse" | "line" | "text";

export interface CircleShape extends BaseShape {
  type: "circle";
  radius: number;  // Derived from width/height
}

export interface EllipseShape extends BaseShape {
  type: "ellipse";
  radiusX: number;
  radiusY: number;
}
```

**Shape Creation** (`components/canvas/Shape.tsx`):
- Add `createCircle()` and `createEllipse()` functions
- Use Fabric.js `fabric.Circle` and `fabric.Ellipse` objects
- Set proper properties: radius, fill, stroke, etc.

**Canvas Interaction** (`components/canvas/Canvas.tsx`):
- Add circle/ellipse drawing mode to tool state
- On mouse down: store origin point
- On mouse move: calculate radius from distance to origin
- On mouse up: create shape via Convex mutation
- For circles: lock aspect ratio (radius = max(width, height) / 2)
- For ellipses: allow independent width/height

**Toolbar** (`components/toolbar/Toolbar.tsx`):
- Add Circle tool button (keyboard shortcut: `C`)
- Add Ellipse tool button (keyboard shortcut: `E`)
- Update active tool state

**Constants** (`constants/shapes.ts`):
```typescript
export const DEFAULT_CIRCLE = {
  radius: 50,
  fill: "#3b82f6",
  stroke: "transparent",
  strokeWidth: 0,
};
```

**Files to Create/Modify**:
- ✏️ `convex/schema.ts` - Add circle/ellipse to type union
- ✏️ `types/shapes.ts` - Add CircleShape, EllipseShape interfaces
- ✏️ `components/canvas/Shape.tsx` - Add create/update functions
- ✏️ `components/canvas/Canvas.tsx` - Add drawing interaction
- ✏️ `components/toolbar/Toolbar.tsx` - Add tool buttons
- ✏️ `constants/shapes.ts` - Add default configs
- ✏️ `hooks/useKeyboard.ts` - Add C/E keyboard shortcuts

**Testing**:
- [ ] Can create circle by dragging
- [ ] Circle maintains circular shape when resizing
- [ ] Ellipse allows independent width/height
- [ ] Syncs across multiple users
- [ ] Can be selected, moved, deleted
- [ ] Rotation works correctly

---

### 2. Line Shape
**Complexity**: Low-Medium
**Branch**: `feature/line-shape`

**Requirements**:
- Draw lines with two-point interaction (click start, click end)
- Support stroke color and width
- Sync with Convex
- Show in multiplayer

**Implementation Details**:

**Schema Changes** (`convex/schema.ts`):
```typescript
shapes: defineTable({
  type: v.union(
    v.literal("rectangle"),
    v.literal("circle"),
    v.literal("ellipse"),
    v.literal("line")    // Add this
  ),
  // ... existing fields
  // For lines, we'll use x1, y1, x2, y2 instead of x, y, width, height
  x1: v.optional(v.number()),
  y1: v.optional(v.number()),
  x2: v.optional(v.number()),
  y2: v.optional(v.number()),
  strokeWidth: v.optional(v.number()),
  strokeColor: v.optional(v.string()),
})
```

**Type Definitions** (`types/shapes.ts`):
```typescript
export interface LineShape extends BaseShape {
  type: "line";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  strokeWidth: number;
  strokeColor: string;
}
```

**Shape Creation** (`components/canvas/Shape.tsx`):
- Add `createLine()` function
- Use Fabric.js `fabric.Line` object
- Map x1, y1, x2, y2 to Fabric line coordinates

**Canvas Interaction** (`components/canvas/Canvas.tsx`):
- Line drawing mode: different from drag-to-draw
- On mouse down: capture start point (x1, y1)
- On mouse move: update temporary line endpoint (x2, y2)
- On mouse up: finalize line and save to Convex
- Show temporary line during drawing

**Toolbar** (`components/toolbar/Toolbar.tsx`):
- Add Line tool button (keyboard shortcut: `L`)

**Constants** (`constants/shapes.ts`):
```typescript
export const DEFAULT_LINE = {
  strokeWidth: 2,
  strokeColor: "#3b82f6",
  stroke: "#3b82f6",
};
```

**Special Considerations**:
- Lines don't have "fill" - only stroke
- Rotation needs to work with two-point system
- Selection handles should appear at endpoints
- Moving the line should update both x1,y1 and x2,y2

**Files to Create/Modify**:
- ✏️ `convex/schema.ts` - Add line type, x1/y1/x2/y2, strokeWidth/strokeColor
- ✏️ `types/shapes.ts` - Add LineShape interface
- ✏️ `components/canvas/Shape.tsx` - Add line creation/update
- ✏️ `components/canvas/Canvas.tsx` - Add two-point drawing interaction
- ✏️ `components/toolbar/Toolbar.tsx` - Add line tool button
- ✏️ `constants/shapes.ts` - Add line defaults
- ✏️ `hooks/useKeyboard.ts` - Add L keyboard shortcut

**Testing**:
- [ ] Can create line by clicking two points
- [ ] Line stroke color and width are correct
- [ ] Can move line (both endpoints move together)
- [ ] Can delete line
- [ ] Syncs across users
- [ ] Selection handles appear at endpoints

---

### 3. Text Shape
**Complexity**: Medium
**Branch**: `feature/text-shape`

**Requirements**:
- Create text shapes with editable content
- Click to edit after creation
- Fixed font family and size for now
- Sync text content changes in real-time
- Support text color (via color picker)

**Implementation Details**:

**Schema Changes** (`convex/schema.ts`):
```typescript
shapes: defineTable({
  type: v.union(
    v.literal("rectangle"),
    v.literal("circle"),
    v.literal("ellipse"),
    v.literal("line"),
    v.literal("text")    // Add this
  ),
  // ... existing fields
  text: v.optional(v.string()),
  fontSize: v.optional(v.number()),
  fontFamily: v.optional(v.string()),
})
```

**Type Definitions** (`types/shapes.ts`):
```typescript
export interface TextShape extends BaseShape {
  type: "text";
  text: string;
  fontSize: number;
  fontFamily: string;
  fill: string;  // Text color
}
```

**Shape Creation** (`components/canvas/Shape.tsx`):
- Add `createText()` function
- Use Fabric.js `fabric.IText` or `fabric.Textbox` for editable text
- Set default: fontSize: 16, fontFamily: "Inter" or "Arial"

**Canvas Interaction** (`components/canvas/Canvas.tsx`):
- Text creation mode: click to place text
- On click: create text object with placeholder "Type here..."
- Automatically enter edit mode on creation
- Double-click existing text to edit
- On text change: throttle update to Convex (avoid mutation spam)
- Exit edit mode on Esc or click outside

**Toolbar** (`components/toolbar/Toolbar.tsx`):
- Add Text tool button (keyboard shortcut: `T`)

**Constants** (`constants/shapes.ts`):
```typescript
export const DEFAULT_TEXT = {
  text: "Type here...",
  fontSize: 16,
  fontFamily: "Inter, Arial, sans-serif",
  fill: "#ffffff",
};
```

**Special Considerations**:
- Text editing creates lots of change events → throttle to 200ms
- Text bounding box changes with content → update width/height
- Need to handle multi-user text editing (last-write-wins for now)
- Cursor should change to text cursor when hovering over text in edit mode

**Files to Create/Modify**:
- ✏️ `convex/schema.ts` - Add text type, text/fontSize/fontFamily fields
- ✏️ `types/shapes.ts` - Add TextShape interface
- ✏️ `components/canvas/Shape.tsx` - Add text creation/update
- ✏️ `components/canvas/Canvas.tsx` - Add text click-to-place, edit mode
- ✏️ `components/toolbar/Toolbar.tsx` - Add text tool button
- ✏️ `constants/shapes.ts` - Add text defaults
- ✏️ `hooks/useKeyboard.ts` - Add T keyboard shortcut
- ✏️ `hooks/useThrottle.ts` - Might need text-specific throttle

**Testing**:
- [ ] Can create text by clicking canvas
- [ ] Text enters edit mode automatically on creation
- [ ] Can edit text after creation by double-clicking
- [ ] Text syncs across users
- [ ] Text color changes with color picker
- [ ] Can move, delete text like other shapes
- [ ] Esc exits edit mode

---

### 4. Color Picker
**Complexity**: Low
**Branch**: `feature/color-picker`

**Requirements**:
- Preset color palette (8-12 colors)
- Hex input field
- Apply color to selected shape(s)
- Note for later: Add recent colors feature

**Implementation Details**:

**UI Component** (`components/toolbar/ColorPicker.tsx`):
```typescript
interface ColorPickerProps {
  value: string;  // Current color
  onChange: (color: string) => void;
}

// Display:
// - Grid of preset colors (clickable swatches)
// - Hex input field with # prefix
// - Current color preview
```

**Preset Colors** (`constants/colors.ts`):
```typescript
export const PRESET_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#f59e0b", // amber
  "#eab308", // yellow
  "#84cc16", // lime
  "#22c55e", // green
  "#14b8a6", // teal
  "#06b6d4", // cyan
  "#3b82f6", // blue (default)
  "#8b5cf6", // violet
  "#a855f7", // purple
  "#ec4899", // pink
  "#ffffff", // white
  "#000000", // black
];

// NOTE: Add recent colors feature later
// Will track last 5-8 colors in localStorage
```

**Integration**:
- Show color picker in toolbar when shape(s) selected
- On color change: update selected shape(s) fill or stroke
- For multi-select: apply to all selected shapes
- Position: Near top toolbar or as floating panel

**Convex Updates**:
- When color changes, call `updateShape` mutation with new fill/strokeColor

**Files to Create/Modify**:
- ✏️ `constants/colors.ts` - Update with PRESET_COLORS
- ➕ `components/toolbar/ColorPicker.tsx` - New component
- ✏️ `components/toolbar/Toolbar.tsx` - Integrate color picker
- ✏️ `app/dashboard/DashboardClient.tsx` - Pass selected shapes state

**Testing**:
- [ ] Color picker shows when shape selected
- [ ] Clicking preset color updates shape
- [ ] Hex input updates shape
- [ ] Invalid hex values are handled gracefully
- [ ] Color updates sync across users
- [ ] Works with multi-select (updates all)

**Future Enhancement**:
- [ ] TODO: Add recent colors (track last 5-8 in localStorage)

---

### 5. Copy/Paste/Duplicate
**Complexity**: Low-Medium
**Branch**: `feature/copy-paste`

**Requirements**:
- Cmd/Ctrl+C to copy selected shape(s)
- Cmd/Ctrl+V to paste
- Alt+drag to duplicate (Figma-style)
- Paste creates new shape with slight offset
- Works with multi-select

**Implementation Details**:

**Clipboard State**:
- Store copied shapes in React state or context
- Don't use browser clipboard (complex serialization)
- Store full shape data (type, position, properties)

**Copy Logic**:
- On Cmd+C: capture selected shape(s) data
- Store in clipboard state
- Show subtle feedback (toast or status message)

**Paste Logic**:
- On Cmd+V:
  - Clone shape data from clipboard
  - Generate new IDs
  - Offset position by (+10, +10) to avoid exact overlap
  - Create via Convex mutation
  - Select newly pasted shapes

**Alt+Drag Duplicate**:
- Detect Alt key during drag operation
- On drag start with Alt: clone shape
- Drag the clone, leave original in place
- On drag end: create new shape via mutation

**Keyboard Shortcuts** (`hooks/useKeyboard.ts`):
```typescript
case "c":
  if (metaKey) copySelected();
  break;
case "v":
  if (metaKey) paste();
  break;
case "d":
  if (metaKey) duplicate(); // Cmd+D as alternative
  break;
```

**Files to Create/Modify**:
- ➕ `hooks/useClipboard.ts` - Clipboard state management
- ✏️ `hooks/useKeyboard.ts` - Add copy/paste shortcuts
- ✏️ `components/canvas/Canvas.tsx` - Alt+drag duplication logic
- ✏️ `app/dashboard/DashboardClient.tsx` - Integrate clipboard hook

**Testing**:
- [ ] Cmd+C copies selected shape
- [ ] Cmd+V pastes with offset
- [ ] Can paste multiple times
- [ ] Alt+drag creates duplicate
- [ ] Works with multi-select
- [ ] Duplicates maintain all properties (color, size, etc.)

---

### 6. Multi-Select
**Complexity**: Medium
**Branch**: `feature/multi-select`
**Dependencies**: All shape types implemented

**Requirements**:
- Drag in select mode to create selection box
- Select multiple shapes
- Shift+click to add/remove from selection
- Transform all selected shapes together
- Delete all selected shapes

**Implementation Details**:

**Selection Box UI**:
- On mouse down in select mode (not on a shape): start selection box
- On mouse move: expand selection box
- On mouse up: select all shapes intersecting box
- Visual: dashed border, semi-transparent fill

**Fabric.js ActiveSelection**:
- Use Fabric's built-in `ActiveSelection` for multi-select
- Allows transforming multiple objects as a group
- Handles resize, rotate, move for all selected

**Shift+Click**:
- If shape already selected: remove from selection
- If shape not selected: add to selection
- Use Fabric's `getActiveObject()` and `setActiveObject()`

**Multi-Operations**:
- Delete: Remove all selected shapes (multiple mutations)
- Color change: Update all selected shapes
- Copy: Copy all selected shapes
- Move: Move all together (Fabric handles this)

**Canvas Integration** (`components/canvas/Canvas.tsx`):
```typescript
// Enable selection mode
canvas.selection = true; // Allow selection box
canvas.selectionColor = 'rgba(59, 130, 246, 0.1)';
canvas.selectionBorderColor = '#3b82f6';
canvas.selectionLineWidth = 2;

// Handle selection events
canvas.on('selection:created', handleSelectionChange);
canvas.on('selection:updated', handleSelectionChange);
canvas.on('selection:cleared', handleSelectionChange);
```

**Files to Create/Modify**:
- ✏️ `components/canvas/Canvas.tsx` - Enable selection mode, selection box config
- ✏️ `components/canvas/SelectionBox.tsx` - Update for multi-select styling
- ✏️ `hooks/useKeyboard.ts` - Delete works on all selected
- ✏️ `components/toolbar/ColorPicker.tsx` - Handle multi-select color updates
- ✏️ `app/dashboard/DashboardClient.tsx` - Track selection state

**Testing**:
- [ ] Can drag to create selection box
- [ ] All shapes in box get selected
- [ ] Shift+click adds to selection
- [ ] Can move all selected shapes together
- [ ] Can resize all selected shapes proportionally
- [ ] Delete removes all selected shapes
- [ ] Color picker updates all selected shapes
- [ ] Selection syncs across users (visual indicator)

---

### 7. Connection Status Indicator
**Complexity**: Trivial
**Branch**: `feature/connection-indicator`

**Requirements**:
- Show green dot when connected to Convex
- Show yellow dot when reconnecting
- Show red dot when disconnected
- Position in top-right corner near user avatar

**Implementation Details**:

**Convex Connection Hook** (`hooks/useConnectionStatus.ts`):
```typescript
import { useConvexConnectionState } from "convex/react";

export const useConnectionStatus = () => {
  const status = useConvexConnectionState();
  // status can be: "connected" | "connecting" | "disconnected"

  const color = {
    connected: "bg-green-500",
    connecting: "bg-yellow-500",
    disconnected: "bg-red-500",
  }[status];

  return { status, color };
};
```

**UI Component**:
```typescript
// In DashboardClient.tsx or new component
const { status, color } = useConnectionStatus();

<div className="flex items-center gap-2">
  <div className={`w-2 h-2 rounded-full ${color}`} />
  <span className="text-xs text-slate-400">{status}</span>
</div>
```

**Positioning**:
- Top-right corner, left of user avatar
- Small and unobtrusive
- Tooltip on hover explaining status

**Files to Create/Modify**:
- ➕ `hooks/useConnectionStatus.ts` - New hook
- ✏️ `app/dashboard/DashboardClient.tsx` - Add indicator to UI

**Testing**:
- [ ] Shows green when connected
- [ ] Shows yellow when simulating slow connection
- [ ] Shows red when offline
- [ ] Updates in real-time

---

## Execution Order

### Wave 1 (Parallel - No Dependencies):
1. Circle/Ellipse shape
2. Line shape
3. Color picker
4. Connection indicator

### Wave 2 (Depends on Wave 1):
5. Text shape (needs color picker)
6. Copy/paste (needs all shapes)

### Wave 3 (Depends on Wave 2):
7. Multi-select (needs all shapes and operations)

---

## Merge Strategy

**Recommended merge order**:
1. `feature/connection-indicator` → `main` (trivial, no conflicts)
2. `feature/color-picker` → `main` (UI only, minimal conflicts)
3. `feature/circle-shape` → `main`
4. `feature/line-shape` → `main`
5. Merge latest `main` into `feature/text-shape`
6. `feature/text-shape` → `main`
7. Merge latest `main` into `feature/copy-paste`
8. `feature/copy-paste` → `main`
9. Merge latest `main` into `feature/multi-select`
10. `feature/multi-select` → `main`

**Conflict Hotspots**:
- `Canvas.tsx` - Almost every feature touches this
- `schema.ts` - All shape types modify this
- `Toolbar.tsx` - All tools modify this

**Merge Tips**:
- Keep Canvas.tsx event handlers modular
- Use switch/case for shape type handling (easy to merge)
- Document changes in each PR for context

---

## Success Criteria

- [ ] 3+ shape types working (rectangle, circle, line, text)
- [ ] All shapes sync in real-time across users
- [ ] Color picker integrated and functional
- [ ] Copy/paste/duplicate working
- [ ] Multi-select with selection box
- [ ] Connection status visible
- [ ] All features work in multiplayer
- [ ] No major performance degradation

**Estimated Section 2 Score**: 5-6 points (Good level)

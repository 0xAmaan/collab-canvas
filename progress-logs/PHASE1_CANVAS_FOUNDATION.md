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

---

## CURRENT PROGRESS STATUS

### ✅ Wave 1: Connection Status + Color Picker (COMPLETED)

**Completed Features:**
1. ✅ Connection Status Indicator
   - Created `hooks/useConnectionStatus.ts` using Convex's connection state
   - Shows green/yellow/red dot in top-right controls
   - Displays status text (connected/connecting/disconnected)
   - Fixed hydration issues with client-only rendering

2. ✅ Color Picker
   - Added 14 preset colors to `constants/colors.ts`
   - Created `components/toolbar/ColorPicker.tsx` with dropdown UI
   - Integrated into Toolbar - shows when shape selected
   - Wired to `updateShape` mutation for real-time updates
   - Works with instant local feedback

**Files Modified:**
- `hooks/useConnectionStatus.ts` (NEW)
- `components/toolbar/ColorPicker.tsx` (NEW)
- `constants/colors.ts` (added PRESET_COLORS)
- `components/toolbar/Toolbar.tsx` (integrated color picker)
- `app/dashboard/DashboardClient.tsx` (selection tracking + color change handler)
- `hooks/useShapes.ts` (added fill parameter to updateShape)

**Bug Fixes:**
- Fixed ghost rectangle bug (tiny rectangles from accidental clicks)
- Fixed auto-selection after shape creation
- Made all shapes selectable in any tool mode (for color picker access)

---

### ✅ Wave 2: Circle/Ellipse + Line Shapes (COMPLETED)

**Completed Features:**

1. ✅ **Schema & Backend**
   - Updated `convex/schema.ts` with type union (rectangle | circle | ellipse | line | text)
   - Added optional fields: x1/y1/x2/y2 (lines), text/fontSize/fontFamily (text)
   - Updated `convex/shapes.ts` createShape mutation to accept type + all fields
   - Updated updateShape mutation with line/text fields

2. ✅ **TypeScript Types**
   - Created `types/shapes.ts` with RectangleShape, CircleShape, EllipseShape, LineShape, TextShape
   - Updated Shape union type
   - Added ShapeType union

3. ✅ **Shape Hook**
   - Updated `hooks/useShapes.ts` to convert Convex shapes with switch/case
   - Updated createShape to build mutation args based on shape type
   - Handles all 5 shape types properly

4. ✅ **Fabric.js Rendering**
   - Updated `components/canvas/Shape.tsx` with:
     - `createFabricShape()` - creates Circle, Ellipse, Line using Fabric.js
     - `updateFabricShape()` - updates all shape types
     - Common styling config for all shapes
   - Backward compatible (createFabricRect still works)

5. ✅ **Toolbar UI**
   - Added Circle, Ellipse, Line tool buttons to `components/toolbar/Toolbar.tsx`
   - Added SVG icons for each tool
   - Extended Tool type: "select" | "rectangle" | "circle" | "ellipse" | "line"

6. ✅ **Canvas Drawing Logic** (`components/canvas/Canvas.tsx`)
   - Added refs for circle/ellipse/line creation state tracking
   - Implemented mouse:down handlers for all three shapes:
     - Circle: Creates temporary Circle with radius calculation
     - Ellipse: Creates temporary Ellipse with independent rx/ry
     - Line: Two-point system using x1/y1/x2/y2
   - Implemented mouse:move handlers for shape dragging:
     - Circle: Locked aspect ratio using distance formula
     - Ellipse: Independent width/height adjustment
     - Line: Updates endpoint (x2, y2) while dragging
   - Implemented mouse:up handlers for shape finalization:
     - All shapes validate minimum size before creation
     - All shapes use Command Pattern for undo/redo support
     - All shapes are auto-selected after creation
   - Added finalizeCircle(), finalizeEllipse(), finalizeLine() functions
   - All shapes stored with correct properties in Convex

7. ✅ **Keyboard Shortcuts**
   - Added CIRCLE_TOOL, ELLIPSE_TOOL, LINE_TOOL to `constants/keyboard.ts`
   - Added keyboard shortcut definitions (C, E, L) with descriptions
   - Updated `hooks/useKeyboard.ts` with handlers for C, E, L keys
   - Updated `app/dashboard/DashboardClient.tsx` with:
     - handleCircleTool, handleEllipseTool, handleLineTool callbacks
     - Integrated all handlers into useKeyboard hook

8. ✅ **Cursor Styles**
   - Updated cursor to crosshair for circle/ellipse/line tools
   - Maintains default cursor for select mode

**Files Modified:**
- `components/canvas/Canvas.tsx` - Added circle/ellipse/line drawing logic (~400 lines)
- `components/toolbar/Toolbar.tsx` - Added 3 tool buttons with icons
- `constants/keyboard.ts` - Added 3 keyboard actions + shortcuts
- `hooks/useKeyboard.ts` - Added 3 keyboard handlers
- `app/dashboard/DashboardClient.tsx` - Added 3 tool change handlers

**Implementation Highlights:**
- **Circle**: Uses `Math.sqrt(dx*dx + dy*dy) / 2` for radius with locked aspect ratio
- **Ellipse**: Allows independent rx and ry for oval shapes
- **Line**: Two-point system - mouse:down sets x1/y1, mouse:move updates x2/y2
- **Size Validation**: Circle (3px radius), Ellipse (3px rx/ry), Line (5px length)
- **Command Pattern**: All shapes support undo/redo via CreateShapeCommand
- **Real-time Sync**: All shapes sync to Convex and appear for other users

---

### 🔄 Wave 3: Text + Copy/Paste (IN PROGRESS - 15% DONE)

**✅ Completed so far:**
1. ✅ **Toolbar & Constants**
   - Added "text" to Tool type in `components/toolbar/Toolbar.tsx`
   - Added Text tool button with icon to Toolbar
   - Added DEFAULT_TEXT constants to `constants/shapes.ts`

2. ✅ **Canvas Preparation**
   - Imported IText from Fabric.js into Canvas.tsx
   - Created `finalizeText()` function for text creation
   - Function validates text content before saving

**⏳ Remaining for Text:**
- Add text click-to-place handler in mouse:down event
- Handle text editing (double-click and text:changed events)
- Add throttling for text changes (200ms to avoid mutation spam)
- Add keyboard shortcut for "T" key
- Add text tool handler to DashboardClient
- Update Shape.tsx to handle text rendering and syncing
- Handle text bounding box updates when content changes
- Test text creation, editing, color changes, and multiplayer sync

**⏳ Remaining for Copy/Paste:**
- Create `hooks/useClipboard.ts` for clipboard state management
- Add Cmd+C, Cmd+V keyboard handlers
- Implement paste logic with (+10, +10) offset
- Support multi-shape copying
- Test copy/paste with all shape types

**Status**: Text scaffolding added, full implementation deferred to next session

---

### ✅ Wave 4: Multi-Select (COMPLETED - WITH CAVEATS)

**Status**: Core multi-select functionality implemented and working.

**Completed Features:**

1. ✅ **Selection State Tracking**
   - Changed from single `selectedShapeId` to array `selectedShapeIds`
   - Updated all selection event handlers to track multiple shapes
   - Properly handles both single and multi-select (ActiveSelection)

2. ✅ **Copy/Paste Multi-Select**
   - `handleCopy` extracts shapes directly from Fabric canvas
   - Supports copying multiple shapes at once
   - `handlePaste` pastes all copied shapes with +10 offset
   - Works with all shape types including lines (different coordinate system)

3. ✅ **Color Change Multi-Select**
   - Updates all selected shapes when color changes
   - Applies to both Convex backend and Fabric.js objects
   - Instant visual feedback for all selected shapes

4. ✅ **Duplicate All Shape Types**
   - Extended to support rectangle, circle, ellipse, line, text
   - Supports multi-select duplication (Cmd+D on multiple shapes)
   - Each shape duplicated with type-specific properties and +10 offset

5. ✅ **Delete Multi-Select**
   - Deletes all selected shapes at once
   - Uses command pattern for undo/redo support

6. ✅ **Multi-Select Coordinate Fix**
   - Fixed major bug where ActiveSelection was corrupting object positions
   - Blocks Convex updates during active selection
   - Blocks render updates for objects in ActiveSelection
   - Saves absolute coordinates only after selection is cleared
   - Objects now stay in correct positions during multi-select

**Files Modified:**
- `app/dashboard/DashboardClient.tsx` - Selection tracking, copy, color, handlers
- `components/canvas/Canvas.tsx` - Duplicate, coordinate fix, selection handling
- `types/shapes.ts` - Added strokeWidth/strokeColor to LineShape
- `lib/commands/CreateShapeCommand.ts` - Added text type support
- `hooks/useShapes.ts` - Added text field support to updateShape

**Known Issues/Caveats:**
- ⚠️ Multi-select transformation (move/resize/rotate) saves coordinates AFTER selection is cleared
- ⚠️ This means real-time sync to other users is delayed until you deselect
- ⚠️ Other users won't see your multi-select movements in real-time (by design to prevent coordinate corruption)

---

### 🔴 Wave 3: Text + Copy/Paste (PARTIALLY COMPLETE - 40%)

**Completed:**
- ✅ Copy/paste fully working for all shapes
- ✅ useClipboard hook created
- ✅ Keyboard shortcuts (Cmd+C, Cmd+V) wired up
- ✅ Multi-shape copying and pasting
- ✅ Handles line shapes with different coordinate system

**Still Needed for Text:**
- ❌ Click-to-place text on canvas (mouse:down handler)
- ❌ Text editing mode (double-click to edit)
- ❌ Text change event handling with throttling (200ms)
- ❌ Keyboard shortcut for "T" key
- ❌ Text tool handler in DashboardClient
- ❌ Text rendering in Shape.tsx
- ❌ Text bounding box updates when content changes

**Status**: Copy/paste complete, text shape 15% done (toolbar button + constants only)

---

## CURRENT STATUS SUMMARY

### ✅ Fully Complete:
- Wave 1: Connection Status + Color Picker
- Wave 2: Circle/Ellipse/Line shapes
- Wave 4: Multi-Select operations

### 🟡 Partially Complete:
- Wave 3: Copy/Paste ✅ | Text Shape ❌ (15%)

---

## NOTES FOR NEXT SESSION

### Priority: Complete Text Shape Implementation

Text is the last major shape type needed. Implementation plan:

1. **Canvas Click Handler** (~30 lines)
   - Add text creation mode to mouse:down event
   - Place IText object at click position
   - Auto-enter edit mode on creation

2. **Text Editing** (~40 lines)
   - Double-click to edit existing text
   - Handle text:changed event with 200ms throttle
   - Update Convex with new text content + dimensions

3. **Keyboard Integration** (~10 lines)
   - Add "T" key handler in useKeyboard.ts
   - Add handleTextTool in DashboardClient.tsx

4. **Shape Rendering** (~20 lines)
   - Update Shape.tsx to render IText objects
   - Handle text property syncing from Convex

**Estimated Time**: 1-2 hours

---

## CRITICAL TESTING NEEDED

### Multi-Select Testing (Wave 4) ⚠️

**Basic Operations:**
- [ ] Drag-select multiple shapes with selection box
- [ ] Shift+click to add shapes to selection
- [ ] Shift+click to remove shapes from selection
- [ ] Move multiple shapes together - verify they stay in place
- [ ] Resize multiple shapes together - verify proportions
- [ ] Rotate multiple shapes together
- [ ] Delete multiple shapes (Backspace/Delete)
- [ ] Copy multiple shapes (Cmd+C)
- [ ] Paste multiple shapes (Cmd+V) with offset
- [ ] Duplicate multiple shapes (Cmd+D) with offset
- [ ] Change color of multiple shapes

**Multi-User Testing:**
- [ ] Select shapes → other user creates new shape → verify no position corruption
- [ ] User A selects and moves shapes → User B should NOT see real-time movement
- [ ] User A releases selection → User B should NOW see final position
- [ ] Both users select different shapes simultaneously → no conflicts

**Edge Cases:**
- [ ] Select all shapes (Cmd+A if implemented)
- [ ] Select shapes of different types (mix rectangles, circles, ellipses)
- [ ] Select and move shapes near canvas edge
- [ ] Select shapes, zoom in/out, then move them
- [ ] Select shapes, pan canvas, then move them
- [ ] Rapid select/deselect cycling
- [ ] Select shapes → undo → verify positions correct

**Known Bug Scenarios to Watch:**
- ⚠️ **Selection box appears far from shapes**: Fixed via coordinate blocking during selection
- ⚠️ **Shapes disappear when multi-selected**: Fixed via blocking Convex updates during selection
- ⚠️ **Shapes jump to wrong position on deselect**: Should be fixed, but test thoroughly
- ⚠️ **Other users see shapes move during your selection**: By design - they only see final result

### Copy/Paste Testing (Wave 3)

**Basic Operations:**
- [ ] Copy single shape (Cmd+C)
- [ ] Paste single shape (Cmd+V)
- [ ] Copy multiple shapes (Cmd+C with multi-select)
- [ ] Paste multiple shapes (Cmd+V)
- [ ] Paste multiple times (shapes should stack with +10 offset each time)
- [ ] Copy line shape specifically (uses x1/y1/x2/y2)
- [ ] Copy different shape types in one selection

**Edge Cases:**
- [ ] Copy with nothing selected (should do nothing)
- [ ] Paste with empty clipboard (should do nothing)
- [ ] Copy → modify original → paste (should paste original state)
- [ ] Copy → delete original → paste (should recreate)

### Shape Types Testing (Wave 2)

**All Shapes Should Support:**
- [ ] Creation via drag (or click for lines)
- [ ] Move by dragging
- [ ] Resize by dragging corner handles
- [ ] Rotate by dragging rotation handle
- [ ] Delete (Backspace/Delete)
- [ ] Color change via color picker
- [ ] Duplicate (Cmd+D)
- [ ] Copy/paste (Cmd+C/Cmd+V)
- [ ] Undo/redo (Cmd+Z/Cmd+Shift+Z)
- [ ] Multi-user real-time sync
- [ ] Selection highlight
- [ ] Keyboard shortcuts (R, C, E, L)

**Specific to Each Type:**
- [ ] Circle maintains aspect ratio when resizing
- [ ] Ellipse allows independent width/height
- [ ] Line uses two-point system (not width/height)
- [ ] Line stroke properties (width, color)

---

## PERFORMANCE & STABILITY WATCHLIST

### Potential Issues to Monitor:

1. **Memory Leaks**
   - Selection event listeners might accumulate
   - Check: `savingShapesRef.current` size doesn't grow indefinitely
   - Check: `objectStateBeforeModify` map gets cleared properly

2. **Race Conditions**
   - Multi-select coordinate save on `selection:cleared` might conflict with other updates
   - Watch for: shapes jumping briefly then correcting
   - Watch for: undo/redo acting strangely after multi-select

3. **Performance with Many Shapes**
   - Test with 50+ shapes on canvas
   - Multi-select all → move → deselect (saves all at once)
   - May need to batch Convex updates

4. **Fabric.js Edge Cases**
   - ActiveSelection with rotated shapes
   - ActiveSelection with scaled shapes  
   - ActiveSelection after zoom/pan operations
   - Mixing different shape types in selection

---

## CLEANUP OPPORTUNITIES (LOW PRIORITY)

1. **Code Duplication**
   - `object:scaling` and `object:rotating` handlers have identical logic
   - Could be refactored into shared function

2. **Type Safety**
   - Many `as any` casts in multi-select code
   - Could create proper types for Fabric ActiveSelection

3. **Magic Numbers**
   - Duplicate/paste offset hardcoded to +10
   - Throttle delays scattered (100ms, 200ms)
   - Could move to constants file

4. **Console Logs**
   - Still have debug logs in some handlers
   - Could remove or put behind debug flag

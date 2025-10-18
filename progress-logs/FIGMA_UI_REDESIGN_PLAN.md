# Figma-Style UI Redesign Plan

**Project**: CollabCanvas UI Restructure
**Date Created**: 2025-10-18
**Status**: Planning Phase

NOTE: Use --color-panel in globals.css for the panel color.

---

## Overview

Transform CollabCanvas from its current top-toolbar design to a Figma-inspired three-panel layout with enhanced tool organization and properties editing capabilities.

### Current State
- Toolbar: Top-center floating panel
- AI Input: Bottom-center fixed input
- Account/Connection: Top-right corner
- Canvas: Full-screen background

### Target State
- **Left Sidebar**: Collapsible AI chat panel (Command+\ toggle)
- **Bottom Toolbar**: Figma-style dark toolbar with grouped tools
- **Right Sidebar**: Properties panel (top: account/status, main: shape properties)
- **Canvas**: Adjusted for new layout with proper spacing

---

## Fabric.js Capabilities Research

### ✅ Available Features
- **PencilBrush**: Built-in freehand drawing tool (`fabric.PencilBrush`)
- **Polygon**: Native `fabric.Polygon` class for multi-point shapes
- **Free Drawing Mode**: `canvas.isDrawingMode` toggle for drawing tools
- **Pan/Zoom**: Canvas viewport transform for hand tool implementation

### ❌ Custom Implementation Needed
- **Arrow Shapes**: Combine Line + Triangle or create custom Path
- **Hand Tool**: Toggle selection mode and implement pan-only interaction

---

## Phase Breakdown

### Phase 1: Layout & Structure Refactor
**Goal**: Establish the three-panel layout foundation

**Tasks**:
1. Update `DashboardClient.tsx` layout grid/flex structure
2. Create placeholder components for three main areas:
   - `<LeftSidebar />` (collapsible)
   - `<BottomToolbar />` (fixed)
   - `<RightSidebar />` (fixed)
3. Adjust canvas container dimensions to accommodate sidebars
4. Ensure multiplayer cursors and overlays still work with new layout
5. Add Command+\ keyboard shortcut for left sidebar toggle

**Files to Modify**:
- `app/dashboard/DashboardClient.tsx`
- `hooks/useKeyboard.ts` (add sidebar toggle)
- `constants/keyboard.ts` (add new shortcut constant)

**Dependencies**: None (foundational work)

---

### Phase 2: Bottom Toolbar Redesign
**Goal**: Create Figma-style toolbar with grouped tool dropdowns

**Tasks**:
1. Move toolbar from top-center to bottom-center
2. Redesign with darker background (similar to Figma's `#2C2C2C`)
3. Implement grouped dropdown menus:
   - **Selection Tools**: Move (V/Esc) + Hand (H + Spacebar)
   - **Shapes**: Rectangle (R), Circle (C), Ellipse (E) - collapsible
   - **Drawing**: Pencil/Pen (P), Polygon - collapsible
   - **Lines**: Line (L), [Arrows - future]
   - **Text**: Text (T)
4. Add separator lines between tool groups
5. Keep color picker in toolbar (show when shape selected)
6. Update styling to match Figma aesthetic

**New Components to Create**:
- `components/toolbar/ToolDropdown.tsx` - Reusable dropdown for grouped tools
- `components/toolbar/ToolGroup.tsx` - Tool group wrapper
- `components/toolbar/BottomToolbar.tsx` - New main toolbar component

**Files to Modify**:
- `components/toolbar/Toolbar.tsx` → rename/refactor to `BottomToolbar.tsx`
- `components/toolbar/ToolButton.tsx` - enhance for dropdown support
- `app/dashboard/DashboardClient.tsx` - update toolbar positioning

**Design Specs**:
```
Background: #383838 with backdrop-blur
Border: 1px solid rgba(255,255,255,0.08)
Border Radius: 12px
Padding: 8px 16px
Tool Button Size: 32x32px
Icon Size: 18x18px
Hover State: rgba(255,255,255,0.06)
Active State: rgba(138,99,210,0.15) with purple accent
```

**Dependencies**: Phase 1 (layout structure)

---

### Phase 3: Left Sidebar - AI Chat Panel
**Goal**: Transform simple AI input into full chat history interface

**Tasks**:
1. Create collapsible sidebar component (280px width)
2. Build chat message components:
   - User message bubbles (right-aligned, purple accent)
   - AI response bubbles (left-aligned, grey)
   - Loading/thinking state indicator
   - Timestamp display
3. Implement chat history state management
4. Move AI input to bottom of sidebar (sticky)
5. Add auto-scroll to latest message
6. Implement Command+\ toggle functionality
7. Add collapse/expand animation (slide in/out)
8. Store chat history in session state (not persisted)

**New Components to Create**:
- `components/ai/AIChatSidebar.tsx` - Main sidebar container
- `components/ai/ChatMessage.tsx` - Individual message bubble
- `components/ai/ChatHistory.tsx` - Message list with scroll
- `components/ai/ChatInput.tsx` - Refactored from `AIInput.tsx`

**Files to Modify**:
- `components/ai/AIInput.tsx` → move to `ChatInput.tsx`
- `components/ai/AIFeedback.tsx` → integrate into message bubbles
- `app/dashboard/DashboardClient.tsx` - integrate sidebar, manage chat state
- `hooks/useKeyboard.ts` - add Command+\ handler

**State Management**:
```typescript
interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: number;
  status?: 'sending' | 'success' | 'error';
}

const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
const [isSidebarOpen, setIsSidebarOpen] = useState(true);
```

**Design Specs**:
```
Sidebar Width: 280px (collapsed: 0px)
Background: #1E1E1E
Border Right: 1px solid rgba(255,255,255,0.08)
Message Padding: 12px 16px
User Bubble: #8A63D2 (purple)
AI Bubble: #2C2C2C (dark grey)
Text Color: #E5E5E5
Animation: 200ms ease-in-out slide
```

**Dependencies**: Phase 1 (layout structure)

---

### Phase 4: Right Sidebar - Properties Panel
**Goal**: Build comprehensive shape properties editor with account section

**Tasks**:
1. Create fixed right sidebar (300px width)
2. **Top Section** (non-collapsible):
   - Account button with user avatar
   - Connection status indicator
   - Active users presence (horizontal list)
   - Zoom controls
3. **Properties Section** (conditional on selection):
   - Show when shape(s) selected, hide when nothing selected
   - **Position & Dimensions Panel**:
     - X, Y coordinate inputs (numeric)
     - Width, Height inputs (numeric)
     - Lock aspect ratio toggle
   - **Visual Styling Panel**:
     - Fill color picker (enhanced)
     - Stroke color picker
     - Stroke width slider (0-20px)
     - Opacity slider (0-100%)
   - **Transform Panel**:
     - Rotation angle input (-180° to 180°)
     - Scale X/Y inputs (with link toggle)
     - Flip horizontal/vertical buttons
4. Handle multi-selection (show shared properties, indicate mixed values)
5. Real-time updates (change → Convex mutation → canvas sync)

**New Components to Create**:
- `components/properties/PropertiesSidebar.tsx` - Main sidebar container
- `components/properties/AccountSection.tsx` - Top account/status area
- `components/properties/PropertyPanel.tsx` - Reusable panel wrapper
- `components/properties/PositionPanel.tsx` - X, Y, W, H controls
- `components/properties/StylePanel.tsx` - Color, stroke, opacity
- `components/properties/TransformPanel.tsx` - Rotation, scale, flip
- `components/properties/EmptyState.tsx` - No selection state
- `components/ui/NumberInput.tsx` - Numeric input with increment/decrement
- `components/ui/Slider.tsx` - Range slider component

**Files to Modify**:
- `app/dashboard/DashboardClient.tsx` - integrate properties sidebar
- Move Account/Connection from top-right to sidebar top
- `components/canvas/Canvas.tsx` - pass shape data to properties
- `hooks/useShapes.ts` - may need property update helpers

**Multi-Selection Handling**:
```typescript
// When multiple shapes selected with different values
<NumberInput
  value={mixedValues ? undefined : commonValue}
  placeholder={mixedValues ? "Mixed" : undefined}
  onChange={(val) => updateAllSelected({ x: val })}
/>
```

**Design Specs**:
```
Sidebar Width: 300px
Background: #1E1E1E
Border Left: 1px solid rgba(255,255,255,0.08)
Panel Spacing: 16px vertical gaps
Section Headers: 11px uppercase, #888888
Input Height: 28px
Input Background: #2C2C2C
Input Border: 1px solid rgba(255,255,255,0.08)
Slider Track: #2C2C2C
Slider Thumb: #8A63D2 (purple)
```

**Dependencies**: Phase 1 (layout structure)

---

### Phase 5: New Tools Implementation
**Goal**: Add Hand/Pan, Pencil, and Polygon tools

#### 5A: Hand/Pan Tool
**Tasks**:
1. Add Hand tool to Selection Tools dropdown
2. Implement spacebar hold → temporary hand mode (Figma-style)
3. Implement 'H' key toggle → persistent hand mode
4. When active: disable object selection, enable canvas pan-only
5. Visual feedback: cursor changes to hand icon
6. Ensure works with existing zoom functionality

**Implementation Notes**:
```typescript
// In Canvas.tsx
const [isPanMode, setIsPanMode] = useState(false);

useEffect(() => {
  if (isPanMode) {
    canvas.selection = false; // disable selection
    canvas.defaultCursor = 'grab';
    canvas.hoverCursor = 'grab';
    // Enable pan-only interaction
  } else {
    canvas.selection = true;
    canvas.defaultCursor = 'default';
  }
}, [isPanMode]);

// Spacebar handling in useKeyboard.ts
onKeyDown: (e) => {
  if (e.code === 'Space' && !e.repeat) {
    setPreviousTool(activeTool);
    setActiveTool('hand');
  }
},
onKeyUp: (e) => {
  if (e.code === 'Space') {
    setActiveTool(previousTool);
  }
}
```

#### 5B: Pencil/Pen Drawing Tool
**Tasks**:
1. Add Pencil tool to Drawing Tools dropdown
2. Enable Fabric.js free drawing mode when active
3. Configure `PencilBrush` with customizable properties:
   - Color (use current selected color)
   - Width (default 2px, adjustable in properties)
4. On path creation → save to Convex as Path shape
5. Sync drawn paths across users in real-time
6. Add 'P' keyboard shortcut

**Implementation Notes**:
```typescript
// In Canvas.tsx
const enablePencilMode = () => {
  canvas.isDrawingMode = true;
  canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
  canvas.freeDrawingBrush.color = currentColor;
  canvas.freeDrawingBrush.width = 2;
};

canvas.on('path:created', async (e) => {
  const path = e.path;
  const pathData = path.path; // SVG path array

  // Save to Convex
  await createShape({
    type: 'path',
    pathData: JSON.stringify(pathData),
    stroke: path.stroke,
    strokeWidth: path.strokeWidth,
    fill: null,
    // ... other properties
  });
});
```

**Schema Update Needed**:
```typescript
// In convex/schema.ts - add path type
shapes: defineTable({
  // ... existing fields
  type: v.union(
    v.literal("rectangle"),
    v.literal("circle"),
    v.literal("ellipse"),
    v.literal("line"),
    v.literal("text"),
    v.literal("path") // NEW
  ),
  pathData: v.optional(v.string()), // NEW - SVG path string
})
```

#### 5C: Polygon Tool
**Tasks**:
1. Add Polygon tool to Drawing Tools dropdown
2. Implement click-to-add-point interaction:
   - Click to add point
   - Double-click or Enter to complete
   - Esc to cancel
   - Show preview line from last point to cursor
3. Create `fabric.Polygon` with collected points
4. Save to Convex as polygon shape
5. Support editing polygon points after creation (future enhancement)

**Implementation Notes**:
```typescript
// Polygon creation state
const [polygonPoints, setPolygonPoints] = useState<{x: number, y: number}[]>([]);
const [isDrawingPolygon, setIsDrawingPolygon] = useState(false);

canvas.on('mouse:down', (e) => {
  if (activeTool === 'polygon') {
    const pointer = canvas.getPointer(e.e);
    setPolygonPoints(prev => [...prev, {x: pointer.x, y: pointer.y}]);
  }
});

const completePolygon = async () => {
  if (polygonPoints.length < 3) return; // Need at least 3 points

  const polygon = new fabric.Polygon(polygonPoints, {
    fill: currentColor,
    stroke: '#000',
    strokeWidth: 1,
  });

  canvas.add(polygon);

  // Save to Convex
  await createShape({
    type: 'polygon',
    points: polygonPoints,
    fill: currentColor,
    // ... other properties
  });

  setPolygonPoints([]);
};
```

**Schema Update Needed**:
```typescript
// In convex/schema.ts
shapes: defineTable({
  // ... existing fields
  type: v.union(
    // ... existing types
    v.literal("polygon") // NEW
  ),
  points: v.optional(v.array(v.object({ x: v.number(), y: v.number() }))), // NEW
})
```

**Dependencies**: Phase 2 (toolbar with grouped dropdowns)

---

## Isolated Agent Instructions

Each section below can be handed to a separate agent to work independently.

---

### 🤖 Agent 1: Bottom Toolbar Redesign

**Context**: You're working on CollabCanvas, a Figma-like collaborative canvas app built with Next.js 15, Fabric.js, and Convex. The current toolbar is at the top-center. Your task is to redesign it as a bottom-center Figma-style toolbar with grouped tool dropdowns.

**Current Files**:
- `components/toolbar/Toolbar.tsx` - Current toolbar (top-center, flat layout)
- `components/toolbar/ToolButton.tsx` - Individual tool button component
- `components/toolbar/ColorPicker.tsx` - Color picker component
- `app/dashboard/DashboardClient.tsx` - Main dashboard that uses toolbar

**Your Tasks**:

1. **Create Tool Dropdown Component** (`components/toolbar/ToolDropdown.tsx`):
   - Accept `tools` prop (array of tool configs)
   - Show active tool icon in button
   - Open dropdown menu on click
   - Each menu item shows icon + label + keyboard shortcut
   - Close dropdown when tool selected

2. **Create Bottom Toolbar** (`components/toolbar/BottomToolbar.tsx`):
   - Position: fixed bottom-center
   - Group tools into dropdowns:
     - **Selection**: Move (V/Esc), Hand (H)
     - **Shapes**: Rectangle (R), Circle (C), Ellipse (E)
     - **Drawing**: Pencil (P), Polygon
     - **Lines**: Line (L)
     - **Text**: Text (T)
   - Add separators between groups
   - Include color picker (show when shape selected)

3. **Update Styling**:
   ```
   Background: #383838 with backdrop-blur
   Border: 1px solid rgba(255,255,255,0.08)
   Border Radius: 12px
   Padding: 8px 16px
   Tool Button: 32x32px, icon 18x18px
   Hover: rgba(255,255,255,0.06)
   Active: rgba(138,99,210,0.15)
   ```

4. **Update DashboardClient.tsx**:
   - Replace old Toolbar with BottomToolbar
   - Move from top-6 to bottom-6 positioning

5. **Update Tool Type**:
   ```typescript
   export type Tool =
     | "select" | "hand"
     | "rectangle" | "circle" | "ellipse"
     | "pencil" | "polygon"
     | "line"
     | "text";
   ```

**Design Reference**: Look at Figma's toolbar - dark background, subtle borders, grouped tools with dropdowns.

**DON'T**:
- Don't modify canvas or sidebar code
- Don't implement the actual hand/pencil/polygon tool logic (just UI)
- Don't change keyboard shortcut handling logic

**Testing Checklist**:
- [ ] Toolbar appears at bottom-center
- [ ] Dropdowns open/close correctly
- [ ] Active tool shows in dropdown button
- [ ] Keyboard shortcuts still work
- [ ] Color picker appears when shape selected
- [ ] Matches Figma aesthetic

---

### 🤖 Agent 2: Left Sidebar - AI Chat Panel

**Context**: You're working on CollabCanvas. Currently there's a simple AI input at the bottom. Your task is to transform it into a full chat history sidebar on the left that's collapsible with Command+\.

**Current Files**:
- `components/ai/AIInput.tsx` - Simple input at bottom-center
- `components/ai/AIFeedback.tsx` - Temporary feedback overlay
- `app/dashboard/DashboardClient.tsx` - Handles AI command submission
- `hooks/useKeyboard.ts` - Keyboard shortcut handling

**Your Tasks**:

1. **Create Chat Message Component** (`components/ai/ChatMessage.tsx`):
   - Props: `type` ('user' | 'ai'), `content`, `timestamp`, `status`
   - User messages: right-aligned, purple bubble (#8A63D2)
   - AI messages: left-aligned, grey bubble (#2C2C2C)
   - Show timestamp on hover
   - Loading state for "thinking..."

2. **Create Chat History** (`components/ai/ChatHistory.tsx`):
   - Scrollable message list
   - Auto-scroll to bottom on new message
   - Empty state: "Ask AI to create or modify shapes..."

3. **Create Chat Sidebar** (`components/ai/AIChatSidebar.tsx`):
   - Width: 280px (collapsed: 0px)
   - Background: #1E1E1E
   - Border right: 1px solid rgba(255,255,255,0.08)
   - Header: "AI Assistant" with collapse button
   - Main area: ChatHistory component
   - Bottom: ChatInput (sticky)
   - Slide animation: 200ms ease-in-out

4. **Refactor AI Input** (`components/ai/ChatInput.tsx`):
   - Move from bottom-center to sidebar bottom
   - Simpler styling (fits in sidebar)
   - Keep submit functionality

5. **Update DashboardClient.tsx**:
   - Add chat state:
     ```typescript
     interface ChatMessage {
       id: string;
       type: 'user' | 'ai';
       content: string;
       timestamp: number;
       status?: 'sending' | 'success' | 'error';
     }
     const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
     const [isSidebarOpen, setIsSidebarOpen] = useState(true);
     ```
   - On AI command submit → add user message to chat
   - On AI response → add AI message to chat
   - Integrate AIChatSidebar component

6. **Add Keyboard Shortcut**:
   - Update `constants/keyboard.ts`: Add `TOGGLE_AI_SIDEBAR`
   - Update `useKeyboard.ts`: Handle Command+\ (Meta+Backslash)
   - Toggle `isSidebarOpen` state

**Design Specs**:
```
Sidebar: 280px width, #1E1E1E background
Message Padding: 12px 16px
User Bubble: #8A63D2, white text
AI Bubble: #2C2C2C, #E5E5E5 text
Border Radius: 8px
Font Size: 13px
Timestamp: 10px, #888888
```

**DON'T**:
- Don't modify toolbar or right sidebar code
- Don't change AI command execution logic
- Don't persist chat history (session only)

**Testing Checklist**:
- [ ] Sidebar appears on left side
- [ ] Command+\ toggles sidebar open/closed
- [ ] Messages appear in correct bubbles (user vs AI)
- [ ] Auto-scrolls to latest message
- [ ] AI "thinking" state shows loading
- [ ] Collapse animation is smooth
- [ ] Input stays at bottom when scrolling

---

### 🤖 Agent 3: Right Sidebar - Properties Panel

**Context**: You're working on CollabCanvas. Currently account/status is in top-right corner, and there's no shape properties editor. Your task is to create a right sidebar with account info at top and shape properties below.

**Current Files**:
- `app/dashboard/DashboardClient.tsx` - Has account section in top-right
- `components/presence/PresencePanel.tsx` - Shows active users
- `components/toolbar/ZoomControls.tsx` - Zoom in/out/reset buttons
- `components/toolbar/ColorPicker.tsx` - Color picker (currently in toolbar)

**Your Tasks**:

1. **Create Properties Sidebar** (`components/properties/PropertiesSidebar.tsx`):
   - Fixed right side, 300px width
   - Background: #1E1E1E
   - Border left: 1px solid rgba(255,255,255,0.08)
   - Two sections: Account (top) + Properties (main)

2. **Create Account Section** (`components/properties/AccountSection.tsx`):
   - Move UserButton from top-right to here
   - Move connection status indicator
   - Move PresencePanel (active users, horizontal layout)
   - Move ZoomControls to bottom of this section
   - Always visible (not conditional)

3. **Create Position Panel** (`components/properties/PositionPanel.tsx`):
   - Only show when shape(s) selected
   - Numeric inputs for: X, Y, Width, Height
   - Lock aspect ratio toggle (icon button)
   - Real-time updates → call `updateShape` mutation

4. **Create Style Panel** (`components/properties/StylePanel.tsx`):
   - Fill color picker (enhanced, larger than toolbar one)
   - Stroke color picker
   - Stroke width slider (0-20px)
   - Opacity slider (0-100%)
   - Real-time updates → call `updateShape` mutation

5. **Create Transform Panel** (`components/properties/TransformPanel.tsx`):
   - Rotation angle: -180° to 180° (numeric input + dial)
   - Scale X/Y inputs with link toggle
   - Flip horizontal button
   - Flip vertical button
   - Real-time updates → call `updateShape` mutation

6. **Create Number Input** (`components/ui/NumberInput.tsx`):
   - Input field with up/down arrows
   - Keyboard up/down arrow support
   - Optional: drag to change value
   - Props: value, onChange, min, max, step, suffix (for units)

7. **Create Slider** (`components/ui/Slider.tsx`):
   - Range input with styled track and thumb
   - Show current value next to slider
   - Props: value, onChange, min, max, step, suffix

8. **Create Empty State** (`components/properties/EmptyState.tsx`):
   - Show when no shapes selected
   - Message: "Select a shape to edit properties"
   - Maybe show recent keyboard shortcuts

9. **Update DashboardClient.tsx**:
   - Remove account section from top-right
   - Integrate PropertiesSidebar component
   - Pass `selectedShapeIds` and shape data to sidebar
   - Sidebar should call `updateShape` on property changes

10. **Handle Multi-Selection**:
    - When multiple shapes selected with same value → show value
    - When multiple shapes with different values → show "Mixed" placeholder
    - Editing applies to all selected shapes

**Implementation Example**:
```typescript
// In PositionPanel.tsx
const selectedShapes = shapes.filter(s => selectedShapeIds.includes(s._id));
const xValue = selectedShapes.length === 1
  ? selectedShapes[0].x
  : undefined;
const isMixedX = selectedShapes.some(s => s.x !== selectedShapes[0].x);

<NumberInput
  label="X"
  value={xValue}
  placeholder={isMixedX ? "Mixed" : undefined}
  onChange={async (val) => {
    for (const id of selectedShapeIds) {
      await updateShape(id, { x: val });
    }
  }}
/>
```

**Design Specs**:
```
Sidebar: 300px width, #1E1E1E background
Panel Spacing: 16px gaps
Section Header: 11px uppercase, #888888, 600 weight
Input Height: 28px
Input Background: #2C2C2C
Input Border: 1px solid rgba(255,255,255,0.08)
Label: 12px, #B8B8B8
Slider Track: #2C2C2C, 4px height
Slider Thumb: #8A63D2, 14px diameter
```

**DON'T**:
- Don't modify toolbar or left sidebar
- Don't change Convex schema
- Don't implement tools (hand, pencil, polygon)

**Testing Checklist**:
- [ ] Sidebar appears on right side
- [ ] Account section shows user, status, presence, zoom
- [ ] Properties panels only show when shape selected
- [ ] Changing X/Y updates shape position in real-time
- [ ] Changing width/height resizes shape
- [ ] Color pickers update fill/stroke
- [ ] Opacity slider works (0-100%)
- [ ] Rotation updates angle
- [ ] Multi-select shows "Mixed" for different values
- [ ] Editing applies to all selected shapes

---

### 🤖 Agent 4: Layout Structure & Canvas Adjustments

**Context**: You're working on CollabCanvas. Your task is to set up the foundational three-panel layout (left sidebar, right sidebar, bottom toolbar) and adjust the canvas to fit properly.

**Current Files**:
- `app/dashboard/DashboardClient.tsx` - Main dashboard layout
- `components/canvas/Canvas.tsx` - Fabric.js canvas component
- `components/canvas/MultiplayerCursor.tsx` - Remote user cursors

**Your Tasks**:

1. **Update DashboardClient Layout**:
   - Change from single full-screen to three-panel grid:
     ```
     [Left Sidebar] [Canvas Area] [Right Sidebar]
            ↓            ↓              ↓
         280px      flex-grow          300px
     ```
   - Bottom toolbar overlays canvas (fixed positioning)

2. **Create Layout Structure**:
   ```typescript
   <div className="h-screen flex">
     {/* Left Sidebar - collapsible */}
     <div className={`transition-all duration-200 ${
       isSidebarOpen ? 'w-[280px]' : 'w-0'
     } overflow-hidden`}>
       {/* AI Chat Sidebar will go here */}
     </div>

     {/* Main Canvas Area */}
     <div className="flex-1 relative">
       <Canvas ... />
       {/* Bottom Toolbar overlays here */}
     </div>

     {/* Right Sidebar - fixed */}
     <div className="w-[300px]">
       {/* Properties Sidebar will go here */}
     </div>
   </div>
   ```

3. **Adjust Canvas Container**:
   - Canvas should fill available space between sidebars
   - Ensure multiplayer cursor container still syncs properly
   - Background gradient should still work
   - Grid pattern should still render

4. **Update Canvas.tsx** (if needed):
   - Canvas initialization should adapt to container size
   - Window resize handling should account for sidebars
   - Viewport transform calculations should be correct

5. **Add Sidebar Toggle State**:
   ```typescript
   const [isSidebarOpen, setIsSidebarOpen] = useState(true);
   ```

6. **Add Keyboard Shortcut Hook**:
   - Update `constants/keyboard.ts`:
     ```typescript
     export enum KeyboardAction {
       // ... existing
       TOGGLE_AI_SIDEBAR = "TOGGLE_AI_SIDEBAR",
     }

     export const KEYBOARD_SHORTCUTS: Record<KeyboardAction, KeyConfig> = {
       // ... existing
       [KeyboardAction.TOGGLE_AI_SIDEBAR]: {
         key: "\\",
         metaKey: true,
         label: "⌘+\\",
       },
     };
     ```

   - Update `useKeyboard.ts` to accept `onToggleSidebar` callback

7. **Test Responsive Behavior**:
   - Sidebar collapse/expand animation smooth
   - Canvas adjusts width when sidebar toggles
   - No layout shift or jumps
   - Cursors still position correctly

**DON'T**:
- Don't implement actual sidebar content (other agents will)
- Don't implement toolbar redesign
- Don't change canvas rendering logic

**Testing Checklist**:
- [ ] Three-panel layout renders correctly
- [ ] Left sidebar collapses to 0px width
- [ ] Canvas fills space between sidebars
- [ ] Bottom toolbar overlays canvas (doesn't push it up)
- [ ] Command+\ toggles left sidebar
- [ ] Transition is smooth (200ms)
- [ ] Multiplayer cursors still render correctly
- [ ] Background and grid still visible
- [ ] No horizontal scrollbar appears

---

### 🤖 Agent 5: Hand/Pan Tool Implementation

**Context**: You're working on CollabCanvas built with Fabric.js. Your task is to implement a Hand/Pan tool that works both as a toolbar toggle (H key) and as a temporary mode (Spacebar hold).

**Current Files**:
- `components/canvas/Canvas.tsx` - Main Fabric.js canvas logic
- `components/toolbar/Toolbar.tsx` (or BottomToolbar.tsx) - Tool selection
- `hooks/useKeyboard.ts` - Keyboard shortcut handling
- `app/dashboard/DashboardClient.tsx` - Tool state management

**Your Tasks**:

1. **Add Hand Tool Type**:
   - Update Tool type: `type Tool = ... | "hand"`
   - Add to Selection Tools dropdown in toolbar

2. **Implement Pan-Only Mode in Canvas.tsx**:
   ```typescript
   useEffect(() => {
     if (!canvas) return;

     if (activeTool === 'hand') {
       // Disable selection
       canvas.selection = false;
       canvas.forEachObject(obj => {
         obj.selectable = false;
         obj.evented = false;
       });

       // Change cursor
       canvas.defaultCursor = 'grab';
       canvas.hoverCursor = 'grab';

       // On mouse down, change to grabbing
       canvas.on('mouse:down', () => {
         canvas.defaultCursor = 'grabbing';
       });
       canvas.on('mouse:up', () => {
         canvas.defaultCursor = 'grab';
       });
     } else {
       // Re-enable selection
       canvas.selection = true;
       canvas.forEachObject(obj => {
         obj.selectable = true;
         obj.evented = true;
       });
       canvas.defaultCursor = 'default';
       canvas.hoverCursor = 'move';
     }
   }, [activeTool, canvas]);
   ```

3. **Add Spacebar Temporary Mode**:
   - In `useKeyboard.ts` or `DashboardClient.tsx`:
   ```typescript
   const [previousTool, setPreviousTool] = useState<Tool>('select');

   useEffect(() => {
     const handleKeyDown = (e: KeyboardEvent) => {
       if (e.code === 'Space' && !e.repeat) {
         e.preventDefault();
         setPreviousTool(activeTool);
         setActiveTool('hand');
       }
     };

     const handleKeyUp = (e: KeyboardEvent) => {
       if (e.code === 'Space') {
         e.preventDefault();
         setActiveTool(previousTool);
       }
     };

     window.addEventListener('keydown', handleKeyDown);
     window.addEventListener('keyup', handleKeyUp);

     return () => {
       window.removeEventListener('keydown', handleKeyDown);
       window.removeEventListener('keyup', handleKeyUp);
     };
   }, [activeTool]);
   ```

4. **Add 'H' Key Toggle**:
   - Update keyboard shortcuts to include 'H' for hand tool
   - Pressing 'H' toggles hand tool on/off (sticky mode)

5. **Ensure Panning Still Works**:
   - Existing pan logic (Alt+drag) should still function
   - Hand tool just makes pan the default interaction
   - Zoom should still work (scroll wheel, zoom controls)

6. **Visual Feedback**:
   - Cursor changes to `grab` when hand tool active
   - Cursor changes to `grabbing` when panning
   - Toolbar shows hand tool as active

**DON'T**:
- Don't modify shape creation logic
- Don't change zoom implementation
- Don't affect other tools

**Testing Checklist**:
- [ ] Clicking Hand tool in toolbar activates it
- [ ] Pressing 'H' toggles hand tool
- [ ] With hand active, can pan by click-drag
- [ ] Cannot select shapes when hand active
- [ ] Holding Spacebar temporarily activates hand
- [ ] Releasing Spacebar returns to previous tool
- [ ] Cursor changes to grab/grabbing appropriately
- [ ] Zoom still works with hand tool active
- [ ] Existing Alt+drag pan still works

---

### 🤖 Agent 6: Pencil/Pen Drawing Tool

**Context**: You're working on CollabCanvas with Fabric.js and Convex. Your task is to implement a freehand drawing tool using Fabric.js PencilBrush that syncs across users.

**Current Files**:
- `components/canvas/Canvas.tsx` - Fabric.js canvas
- `components/canvas/Shape.tsx` - Shape creation utilities
- `convex/schema.ts` - Database schema
- `convex/shapes.ts` - Shape CRUD operations
- `types/shapes.ts` - TypeScript shape types

**Your Tasks**:

1. **Update Schema** (`convex/schema.ts`):
   ```typescript
   shapes: defineTable({
     // ... existing fields
     type: v.union(
       v.literal("rectangle"),
       v.literal("circle"),
       v.literal("ellipse"),
       v.literal("line"),
       v.literal("text"),
       v.literal("path") // ADD THIS
     ),
     pathData: v.optional(v.string()), // ADD THIS - SVG path string
   })
   ```

2. **Update TypeScript Types** (`types/shapes.ts`):
   ```typescript
   export interface PathShape extends BaseShape {
     type: 'path';
     pathData: string; // SVG path array as JSON string
     stroke: string;
     strokeWidth: number;
     fill: null; // Paths typically have no fill
   }

   export type Shape = RectangleShape | CircleShape | ... | PathShape;
   ```

3. **Add Pencil Tool to Toolbar**:
   - Add to Tool type: `| "pencil"`
   - Add to Drawing Tools dropdown
   - Keyboard shortcut: 'P'

4. **Implement Pencil Mode in Canvas.tsx**:
   ```typescript
   useEffect(() => {
     if (!canvas) return;

     if (activeTool === 'pencil') {
       // Enable free drawing mode
       canvas.isDrawingMode = true;
       canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
       canvas.freeDrawingBrush.color = selectedColor || '#000000';
       canvas.freeDrawingBrush.width = 2;
     } else {
       // Disable free drawing mode
       canvas.isDrawingMode = false;
     }
   }, [activeTool, canvas, selectedColor]);
   ```

5. **Handle Path Creation Event**:
   ```typescript
   useEffect(() => {
     if (!canvas) return;

     const handlePathCreated = async (e: fabric.IEvent) => {
       const path = e.path;
       if (!path) return;

       // Get path data
       const pathData = JSON.stringify(path.path);

       // Create in Convex
       const shapeId = await createShape({
         type: 'path',
         pathData,
         stroke: path.stroke as string,
         strokeWidth: path.strokeWidth as number,
         fill: null,
         x: path.left || 0,
         y: path.top || 0,
         width: path.width || 0,
         height: path.height || 0,
         createdBy: userId,
         createdAt: Date.now(),
         lastModified: Date.now(),
         lastModifiedBy: userId,
       });

       // Tag the fabric object with shapeId
       path.set('data', { shapeId });

       canvas.renderAll();
     };

     canvas.on('path:created', handlePathCreated);

     return () => {
       canvas.off('path:created', handlePathCreated);
     };
   }, [canvas, userId, createShape]);
   ```

6. **Render Existing Paths** (in `Shape.tsx` or `Canvas.tsx`):
   ```typescript
   const createFabricPath = (shape: PathShape) => {
     const pathData = JSON.parse(shape.pathData);
     return new fabric.Path(pathData, {
       left: shape.x,
       top: shape.y,
       stroke: shape.stroke,
       strokeWidth: shape.strokeWidth,
       fill: null,
       selectable: true,
       data: { shapeId: shape._id },
     });
   };
   ```

7. **Sync Across Users**:
   - When path created → mutation to Convex
   - Other clients receive update via query subscription
   - Canvas adds new path object automatically

8. **Handle Path Updates**:
   - When path moved/transformed → update Convex
   - Use existing modification logic (should work automatically)

**DON'T**:
- Don't implement other tools
- Don't add advanced brush types (circle, spray, etc.) yet
- Don't add pressure sensitivity (future enhancement)

**Testing Checklist**:
- [ ] Pencil tool appears in Drawing Tools dropdown
- [ ] Pressing 'P' activates pencil tool
- [ ] Can draw freehand strokes on canvas
- [ ] Strokes appear immediately (no lag)
- [ ] Drawn paths save to Convex database
- [ ] Paths appear for other users in real-time
- [ ] Can select and move drawn paths
- [ ] Paths persist after page refresh
- [ ] Stroke color matches selected color
- [ ] Switching tools disables drawing mode

---

### 🤖 Agent 7: Polygon Tool Implementation

**Context**: You're working on CollabCanvas with Fabric.js. Your task is to implement a polygon tool where users click to add points, then complete the shape with Enter or double-click.

**Current Files**:
- `components/canvas/Canvas.tsx` - Fabric.js canvas
- `convex/schema.ts` - Database schema
- `types/shapes.ts` - TypeScript shape types

**Your Tasks**:

1. **Update Schema** (`convex/schema.ts`):
   ```typescript
   shapes: defineTable({
     // ... existing fields
     type: v.union(
       // ... existing types
       v.literal("polygon") // ADD THIS
     ),
     points: v.optional(v.array(
       v.object({ x: v.number(), y: v.number() })
     )), // ADD THIS
   })
   ```

2. **Update TypeScript Types** (`types/shapes.ts`):
   ```typescript
   export interface PolygonShape extends BaseShape {
     type: 'polygon';
     points: { x: number; y: number }[];
     fill: string;
     stroke?: string;
     strokeWidth?: number;
   }

   export type Shape = ... | PolygonShape;
   ```

3. **Add Polygon Tool to Toolbar**:
   - Add to Tool type: `| "polygon"`
   - Add to Drawing Tools dropdown
   - No default keyboard shortcut (can add later)

4. **Implement Polygon Drawing State**:
   ```typescript
   const [polygonPoints, setPolygonPoints] = useState<{x: number, y: number}[]>([]);
   const [previewPolygon, setPreviewPolygon] = useState<fabric.Polygon | null>(null);
   const [previewLine, setPreviewLine] = useState<fabric.Line | null>(null);
   ```

5. **Handle Mouse Clicks to Add Points**:
   ```typescript
   canvas.on('mouse:down', (e) => {
     if (activeTool !== 'polygon') return;
     if (e.target) return; // Clicked on existing object

     const pointer = canvas.getPointer(e.e);
     const newPoint = { x: pointer.x, y: pointer.y };

     setPolygonPoints(prev => {
       const updated = [...prev, newPoint];

       // Update preview polygon
       if (updated.length >= 2) {
         if (previewPolygon) {
           canvas.remove(previewPolygon);
         }
         const poly = new fabric.Polygon(updated, {
           fill: 'transparent',
           stroke: selectedColor || '#000',
           strokeWidth: 2,
           strokeDashArray: [5, 5],
           selectable: false,
           evented: false,
         });
         canvas.add(poly);
         setPreviewPolygon(poly);
       }

       return updated;
     });
   });
   ```

6. **Show Preview Line from Last Point to Cursor**:
   ```typescript
   canvas.on('mouse:move', (e) => {
     if (activeTool !== 'polygon' || polygonPoints.length === 0) return;

     const pointer = canvas.getPointer(e.e);
     const lastPoint = polygonPoints[polygonPoints.length - 1];

     if (previewLine) {
       canvas.remove(previewLine);
     }

     const line = new fabric.Line(
       [lastPoint.x, lastPoint.y, pointer.x, pointer.y],
       {
         stroke: selectedColor || '#000',
         strokeWidth: 1,
         strokeDashArray: [5, 5],
         selectable: false,
         evented: false,
       }
     );
     canvas.add(line);
     setPreviewLine(line);
     canvas.renderAll();
   });
   ```

7. **Complete Polygon on Enter or Double-Click**:
   ```typescript
   const completePolygon = async () => {
     if (polygonPoints.length < 3) {
       alert('Need at least 3 points to create a polygon');
       return;
     }

     // Remove preview elements
     if (previewPolygon) canvas.remove(previewPolygon);
     if (previewLine) canvas.remove(previewLine);

     // Create final polygon
     const polygon = new fabric.Polygon(polygonPoints, {
       fill: selectedColor || '#000',
       stroke: '#000',
       strokeWidth: 1,
       selectable: true,
     });

     canvas.add(polygon);

     // Save to Convex
     const shapeId = await createShape({
       type: 'polygon',
       points: polygonPoints,
       fill: selectedColor || '#000',
       stroke: '#000',
       strokeWidth: 1,
       x: polygon.left || 0,
       y: polygon.top || 0,
       width: polygon.width || 0,
       height: polygon.height || 0,
       createdBy: userId,
       createdAt: Date.now(),
       lastModified: Date.now(),
       lastModifiedBy: userId,
     });

     polygon.set('data', { shapeId });
     canvas.renderAll();

     // Reset state
     setPolygonPoints([]);
     setPreviewPolygon(null);
     setPreviewLine(null);
     setActiveTool('select'); // Return to select tool
   };

   // Listen for Enter key
   useEffect(() => {
     const handleKeyDown = (e: KeyboardEvent) => {
       if (activeTool === 'polygon' && e.key === 'Enter') {
         completePolygon();
       }
     };
     window.addEventListener('keydown', handleKeyDown);
     return () => window.removeEventListener('keydown', handleKeyDown);
   }, [activeTool, polygonPoints]);
   ```

8. **Cancel Polygon on Esc**:
   ```typescript
   // In keyboard handler
   if (activeTool === 'polygon' && e.key === 'Escape') {
     if (previewPolygon) canvas.remove(previewPolygon);
     if (previewLine) canvas.remove(previewLine);
     setPolygonPoints([]);
     setPreviewPolygon(null);
     setPreviewLine(null);
     setActiveTool('select');
   }
   ```

9. **Render Existing Polygons**:
   ```typescript
   const createFabricPolygon = (shape: PolygonShape) => {
     return new fabric.Polygon(shape.points, {
       left: shape.x,
       top: shape.y,
       fill: shape.fill,
       stroke: shape.stroke,
       strokeWidth: shape.strokeWidth,
       selectable: true,
       data: { shapeId: shape._id },
     });
   };
   ```

**DON'T**:
- Don't implement point editing (future enhancement)
- Don't add star/custom polygon presets yet
- Don't modify other tools

**Testing Checklist**:
- [ ] Polygon tool appears in Drawing Tools dropdown
- [ ] Clicking adds points to polygon
- [ ] Preview polygon shows current shape (dashed)
- [ ] Preview line follows cursor from last point
- [ ] Pressing Enter completes polygon (3+ points)
- [ ] Pressing Esc cancels polygon drawing
- [ ] Completed polygon saves to Convex
- [ ] Polygons appear for other users
- [ ] Can select and move completed polygons
- [ ] Switching tools cancels current drawing
- [ ] Polygons persist after page refresh

---

## Success Criteria

**Overall Project**:
- [ ] Three-panel layout (left sidebar, canvas, right sidebar)
- [ ] Bottom toolbar with Figma-style design
- [ ] All tools accessible via keyboard shortcuts
- [ ] Real-time sync works for all new shape types
- [ ] UI feels responsive and polished

**Left Sidebar**:
- [ ] Full chat history with scrolling
- [ ] Command+\ toggles sidebar smoothly
- [ ] AI messages appear in chat bubbles

**Bottom Toolbar**:
- [ ] Grouped tool dropdowns work correctly
- [ ] Active tool highlighted
- [ ] Color picker integrated

**Right Sidebar**:
- [ ] Account/status section always visible
- [ ] Properties panels show on selection
- [ ] All property edits sync to Convex
- [ ] Multi-select handles mixed values

**New Tools**:
- [ ] Hand tool works (H + Spacebar)
- [ ] Pencil tool creates freehand paths
- [ ] Polygon tool creates multi-point shapes

---

## Timeline Estimate

- **Phase 1** (Layout): 2-3 hours
- **Phase 2** (Toolbar): 4-5 hours
- **Phase 3** (Left Sidebar): 5-6 hours
- **Phase 4** (Right Sidebar): 6-8 hours
- **Phase 5** (New Tools): 8-10 hours

**Total**: ~25-32 hours of development

**Recommendation**: Implement phases 1-4 in parallel with different agents, then phase 5 sequentially.

---

## Notes

- Maintain existing functionality (undo/redo, copy/paste, multiplayer)
- Test thoroughly after each phase
- Ensure Convex schema changes don't break existing data
- Keep real-time sync performance in mind
- Follow existing code style and patterns
- Use arrow functions (per project CLAUDE.md conventions)

---

## Future Enhancements (Not in This Plan)

- Arrow shapes (combine line + triangle)
- Advanced brushes (spray, pattern, circle)
- Polygon point editing after creation
- Shape alignment tools
- Keyboard shortcuts cheat sheet modal
- Layer ordering in sidebar
- Shape grouping/ungrouping
- Export canvas to image/SVG

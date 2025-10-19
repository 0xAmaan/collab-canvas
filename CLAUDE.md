# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CollabCanvas is a real-time collaborative canvas application built with Next.js 15, Convex (real-time database), Clerk (authentication), and Fabric.js (canvas rendering). Users can create and manipulate rectangle shapes on a shared canvas with multiplayer features including real-time cursors and presence awareness.

## Tech Stack & Architecture

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4
- **Canvas**: Fabric.js v6 for high-performance 2D rendering and shape manipulation
- **Backend**: Convex (real-time database with automatic subscriptions)
- **Auth**: Clerk (provides user identity across client and server)
- **Package Manager**: Bun (NOT npm/yarn/pnpm)

## Development Commands

### Primary Commands
```bash
bun run dev                 # Start Next.js dev server with Turbopack
bunx convex dev            # Start Convex backend in development mode (separate terminal)
bun run build              # Build for production (runs convex deploy + next build)
bun run start              # Start production server
bun run test:convex        # Run Convex database tests
```

### Important Notes
- **ALWAYS use Bun** for all package management and script execution
- **Two terminals required**: One for `bun run dev`, one for `bunx convex dev`
- Do NOT run `bun dev` unless explicitly asked - development server is typically already running

## Code Style & Patterns

### TypeScript Conventions
- **Always use arrow functions** - never use `function` keyword
- **Prefer interfaces over types** (per .cursor/rules/nextjs.mdc)
- Avoid enums - use maps/objects instead
- Use descriptive variable names with auxiliary verbs (isLoading, hasError)
- Structure files: exported component → subcomponents → helpers → static content → types

### React Patterns
- Minimize `use client` - favor React Server Components (RSC)
- Use functional components with TypeScript interfaces
- Wrap client components in Suspense with fallback
- Use `useCallback` and `useMemo` for performance-critical code
- Directory naming: lowercase with dashes (e.g., `auth-wizard`)

### Styling
- Use Tailwind CSS exclusively - avoid custom CSS
- Follow mobile-first responsive design approach
- Use design system colors defined in `constants/colors.ts`

## Project Structure

```
app/
  dashboard/              # Main collaborative canvas page
    DashboardClient.tsx   # Client-side orchestrator (manages canvas, toolbar, presence)
    page.tsx             # Server component wrapper

components/
  canvas/                # Fabric.js canvas and shape rendering
    Canvas.tsx           # Main canvas orchestrator (~400 lines, delegates to tools)
    Shape.tsx            # Fabric.js shape creation and sync utilities
    SelectionBox.tsx     # Selection styling configuration
    MultiplayerCursor.tsx # Remote user cursor rendering
    
    tools/               # Tool Strategy Pattern - each tool is a hook
      types.ts           # Shared tool interfaces (ToolContext, ToolHandlers)
      useSelectTool.ts   # Selection, dragging, alt+drag duplicate/pan
      useHandTool.ts     # Canvas panning
      useShapeCreationTool.ts  # Generic shape creation (rect/circle/ellipse/line)
      useTextTool.ts     # Text creation and editing
      usePolygonTool.ts  # Multi-click polygon creation
      usePencilTool.ts   # Free drawing with paths
    
    shapes/              # DRY shape creation system
      ShapeFactory.ts    # Centralized shape creation/finalization
      shape-configs.ts   # Per-shape configuration (props, sizing, extraction)
    
    state/               # Centralized state management
      CanvasState.ts     # Mutable state class (replaces 16+ refs)

  toolbar/               # Canvas toolbar UI
    BottomToolbar.tsx    # Main toolbar component
    ColorPicker.tsx      # Color selection
    ToolButton.tsx       # Individual tool buttons
    ZoomControls.tsx     # Zoom in/out/reset controls
    
  properties/            # Right sidebar property panels
    PropertiesSidebar.tsx  # Main properties container
    StylePanel.tsx       # Fill/stroke/opacity controls
    TransformPanel.tsx   # Position/size/rotation controls
    PositionPanel.tsx    # Layer ordering (bring to front, etc.)
    AccountSection.tsx   # User account info
    
  presence/              # Multiplayer presence features
    PresencePanel.tsx    # Active users list
    UserAvatar.tsx       # User avatar component

convex/                  # Backend database and real-time functions
  schema.ts              # Database schema (shapes, presence tables)
  shapes.ts              # Shape CRUD operations (queries + mutations)
  presence.ts            # Presence management (join/leave/update cursor)
  crons.ts               # Background jobs (cleanup stale presence every 10s)
  auth.config.ts         # Clerk integration

hooks/
  useShapes.ts           # Real-time shape synchronization hook
  usePresence.ts         # Multiplayer presence and cursor tracking
  useKeyboard.ts         # Keyboard shortcuts handler
  useViewport.ts         # Canvas viewport persistence
  useHistory.ts          # Undo/redo functionality
  useClipboard.ts        # Copy/paste operations
  useThrottle.ts         # Performance throttling utility

lib/
  canvas/                # Canvas utilities
    shape-finalizers.ts  # Shape finalization logic
    shape-validators.ts  # Shape validation helpers
    duplicate-shape.ts   # Shape duplication logic
    selection-utils.ts   # Selection helper functions
  commands/              # Command pattern for undo/redo
    CreateShapeCommand.ts
    UpdateShapeCommand.ts
    DeleteShapeCommand.ts
  ai/                    # AI assistant integration
    client-executor.ts   # Execute AI-generated canvas commands
    types.ts             # AI command types

constants/
  shapes.ts              # Canvas/shape configuration
  colors.ts              # Design system color palette
  keyboard.ts            # Keyboard shortcut mappings

types/
  shapes.ts              # Shape type definitions
  presence.ts            # Presence/cursor type definitions
  canvas.ts              # Canvas-specific types
  viewport.ts            # Viewport/zoom types
```

## Key Architecture Patterns

### Real-Time Synchronization with Convex

Convex provides automatic real-time subscriptions. Changes propagate to all clients within ~50-100ms.

**Query Pattern** (auto-subscribes to updates):
```typescript
const shapes = useQuery(api.shapes.getShapes); // Automatically re-renders on changes
```

**Mutation Pattern** (write operations):
```typescript
const createShape = useMutation(api.shapes.createShape);
await createShape({ x, y, width, height, fill });
```

**Key Points**:
- Queries automatically subscribe and update in real-time
- Mutations require authentication (verified via Clerk in Convex functions)
- All Convex functions are in `convex/` directory
- Generated API types are in `convex/_generated/`

### Canvas Architecture (Tool Strategy Pattern)

The canvas uses a **Tool Strategy Pattern** where Canvas.tsx acts as an orchestrator that delegates events to specialized tool hooks. This replaced the previous monolithic approach (1,920 lines → ~400 lines).

#### Architecture Components

1. **Canvas.tsx** (~400 lines): Lightweight orchestrator managing:
   - Fabric.js initialization and lifecycle
   - Tool context creation and delegation
   - Event routing to active tool
   - Real-time sync between Fabric objects and Convex database
   - Viewport transform and persistence

2. **Tool Hooks** (`components/canvas/tools/`): Each tool is a React hook implementing `ToolHandlers`:
   - **useSelectTool**: Selection, dragging, multi-select, alt+drag duplicate/pan
   - **useHandTool**: Canvas panning (space bar or hand tool)
   - **useShapeCreationTool**: Generic shape creation (rectangle, circle, ellipse, line)
   - **useTextTool**: Text creation and editing with auto-save
   - **usePolygonTool**: Multi-click polygon creation with Enter/Escape
   - **usePencilTool**: Free drawing with Fabric.js paths

3. **Centralized State** (`components/canvas/state/CanvasState.ts`):
   - Mutable class replacing 16+ scattered refs
   - Tracks: creation state, duplication state, text editing, panning, hover, etc.
   - Direct mutation for performance (no React re-renders)
   - Helper methods for state reset (resetCreation, resetAll, etc.)

4. **DRY Shape System** (`components/canvas/shapes/`):
   - **ShapeFactory**: Centralized creation/finalization for all shapes (eliminates 90% duplication)
   - **shape-configs.ts**: Per-shape configuration (default props, min size, sizing logic, data extraction)
   - Single code path for all shape types

5. **Shape Utilities** (`components/canvas/Shape.tsx`):
   - Creating Fabric.js objects from Convex shape data
   - Updating Fabric.js objects when database changes
   - Converting Fabric.js objects back to shape data

#### Tool Pattern

Each tool hook follows this interface:

```typescript
interface ToolHandlers {
  onMouseDown: (e: MouseEvent, pointer: Point, target: any) => void;
  onMouseMove: (e: MouseEvent, pointer: Point) => void;
  onMouseUp: (e: MouseEvent, pointer: Point) => void;
  onActivate: () => void;      // Called when tool becomes active
  onDeactivate: () => void;    // Called when tool becomes inactive
  getCursor: () => string;     // Cursor when tool is active
  getHoverCursor: () => string; // Cursor when hovering over objects
}
```

**Benefits:**
- **Easy to find logic**: Want to fix rectangle creation? → `useShapeCreationTool.ts`
- **Easy to add features**: New shape? → Add config. New tool? → Create new hook.
- **Isolated testing**: Each tool is independently testable
- **Type safety**: TypeScript ensures all tools implement interface correctly

#### Sync Pattern

- User interaction → Tool updates Fabric.js object → Send mutation to Convex
- Convex update → Query re-runs → Sync updates Fabric.js canvas
- Throttling applied to high-frequency updates (moves: 100ms, cursor: 50ms)
- Optimistic updates for immediate feedback

### Multiplayer Presence System

**Architecture**:
- Each user has a presence record in Convex (`presence` table)
- Cursor positions update every 50ms (throttled)
- Heartbeat mechanism: ping every 5 seconds to keep presence alive
- Cron job: cleanup stale presence records (>30s inactive) every 10 seconds
- Visibility API: auto-rejoin when tab becomes visible after being hidden

**Key Files**:
- `hooks/usePresence.ts`: Client-side presence management with visibility handling
- `convex/presence.ts`: Server-side presence mutations and queries
- `components/canvas/MultiplayerCursor.tsx`: Remote cursor rendering with viewport sync

### Performance Optimizations

1. **Batch Rendering**: Disable `renderOnAddRemove` during bulk updates in sync logic
2. **Throttled Updates**: Cursor (50ms), shape movement (100ms) via `useThrottle.ts`
3. **Viewport Transform**: Direct DOM manipulation to avoid React re-renders (`DashboardClient.tsx`)
4. **Optimistic Updates**: Shapes appear immediately, sync asynchronously (`useShapes.ts`)
5. **Selective Sync**: Skip updates for objects user is actively manipulating
6. **Mutable State**: CanvasState uses direct mutation instead of React state (no re-renders)
7. **Tool Memoization**: Tool hooks are memoized and only recreate callbacks when dependencies change

## Authentication Flow

Clerk provides user identity across client and server:

**Client Side**:
```typescript
const { user } = useUser(); // Hook from @clerk/nextjs
const userId = user?.id || "anonymous";
```

**Server Side (Convex)**:
```typescript
const user = await ctx.auth.getUserIdentity();
if (!user) throw new Error("Not authenticated");
const userId = user.subject; // Clerk user ID
```

All mutations require authentication. Queries are public but presence requires auth to join.

## Environment Variables

Required in `.env.local`:
```bash
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
```

## Common Development Tasks

### Adding a New Shape Type

1. Add shape configuration to `components/canvas/shapes/shape-configs.ts`:
   ```typescript
   myNewShape: {
     defaultProps: { /* Fabric.js props */ },
     minSize: { width: 5, height: 5 },
     extractData: (obj, userId) => ({ /* convert to Convex shape */ }),
     updateSize: (obj, start, current) => { /* update during drag */ },
   }
   ```
2. Update `convex/schema.ts` to add new shape properties
3. Update `types/shapes.ts` to add TypeScript types
4. Add toolbar button in `components/toolbar/BottomToolbar.tsx`
5. ShapeFactory automatically handles creation/finalization (no Canvas.tsx changes needed!)

### Adding a New Tool

1. Create `components/canvas/tools/useMyTool.ts` implementing `ToolHandlers`:
   ```typescript
   export const useMyTool = (context: ToolContext): ToolHandlers => {
     return {
       onMouseDown: (e, pointer, target) => { /* ... */ },
       onMouseMove: (e, pointer) => { /* ... */ },
       onMouseUp: (e, pointer) => { /* ... */ },
       onActivate: () => { /* setup */ },
       onDeactivate: () => { /* cleanup */ },
       getCursor: () => 'crosshair',
       getHoverCursor: () => 'pointer',
     };
   };
   ```
2. Add tool to Canvas.tsx tool map:
   ```typescript
   const myTool = useMyTool(toolContext);
   const toolMap = { ..., myTool };
   ```
3. Add toolbar button in `components/toolbar/BottomToolbar.tsx`

### Adding a New Keyboard Shortcut

1. Define key mapping in `constants/keyboard.ts`
2. Add handler in `hooks/useKeyboard.ts`
3. Update help modal in `components/ui/KeyboardShortcutsHelp.tsx`

### Debugging Real-Time Sync Issues

1. Check Convex dashboard logs: https://dashboard.convex.dev
2. Look for presence/shape mutation errors in browser console
3. Verify authentication state (user must be logged in for mutations)
4. Check throttling - rapid updates may be batched/throttled
5. Monitor cron job execution (cleanup runs every 10s)

### Testing Multiplayer Features

1. Open two browser windows at `http://localhost:3000/dashboard`
2. Sign in with different accounts (or use incognito mode)
3. Create/move shapes in one window → verify they appear in the other
4. Move cursor → verify cursor appears in the other window
5. Check presence panel shows both users

## Convex Specifics

### Schema Changes
After modifying `convex/schema.ts`, types auto-regenerate. No manual codegen needed.

### Cron Jobs
Defined in `convex/crons.ts`. View execution logs in Convex dashboard.

### Query Performance
Queries use indexes for performance. Current indexes:
- `shapes.by_created_at` - for ordered shape retrieval
- `presence.by_user` - for user-specific presence lookup
- `presence.by_last_active` - for active user queries and cleanup

### Testing Convex Functions
Run `bun run test:convex` to test database operations. Or use Convex dashboard's Functions tab for manual testing.

## Canvas Tool Architecture Details

### Tool Strategy Pattern

The canvas refactor introduced a **Tool Strategy Pattern** that reduced Canvas.tsx from 1,920 lines to ~400 lines. Each tool is isolated in its own hook, making the codebase easier to understand and maintain.

**Key Principles:**
- **Canvas.tsx is an orchestrator** - initializes tools, delegates events, manages sync
- **Tools are hooks** - each tool implements `ToolHandlers` interface
- **Tools are stateless** - all state lives in `CanvasState` (passed via context)
- **Tools are isolated** - bug in one tool doesn't affect others

### Tool Context

All tools receive a `ToolContext` object with everything they need:

```typescript
interface ToolContext {
  canvas: FabricCanvas;           // Fabric.js canvas instance
  state: CanvasState;             // Centralized mutable state
  userId: string;                 // Current user ID
  fillColor: string;              // Selected fill color
  shapes: Shape[];                // All shapes from Convex
  createShape: UseMutation;       // Convex mutation
  updateShape: UseMutation;       // Convex mutation
  deleteShape: UseMutation;       // Convex mutation
  history: HistoryManager;        // Undo/redo manager
  // ... other context
}
```

### Tool Handlers Interface

Every tool must implement these methods:

```typescript
interface ToolHandlers {
  onMouseDown: (e: MouseEvent, pointer: Point, target: any) => void;
  onMouseMove: (e: MouseEvent, pointer: Point) => void;
  onMouseUp: (e: MouseEvent, pointer: Point) => void;
  onActivate: () => void;      // Setup when tool becomes active
  onDeactivate: () => void;    // Cleanup when tool becomes inactive
  getCursor: () => string;     // Cursor style for active tool
  getHoverCursor: () => string; // Cursor when hovering objects
}
```

### Shape Configuration System

Instead of duplicating shape creation logic 7 times, we use a **configuration-based approach**:

**shape-configs.ts** defines behavior for each shape type:
```typescript
interface ShapeConfig {
  defaultProps: Partial<FabricObjectProps>;  // Fabric.js default props
  minSize: { width: number; height: number }; // Minimum valid size
  extractData: (obj: FabricObject, userId: string) => ShapeData;
  updateSize: (obj: FabricObject, start: Point, current: Point) => void;
}
```

**ShapeFactory.ts** uses these configs to:
- Create shapes (`createShape`)
- Update sizes during drag (`updateShapeSize`)
- Validate minimum size (`meetsMinimumSize`)
- Finalize shapes to Convex (`finalizeShape`)

**Result**: Single code path for all shapes, add new shape by adding config only.

### State Management Philosophy

**CanvasState** is a mutable class (not React state) because:
- ✅ Better performance - no re-renders triggered
- ✅ Simpler code - direct mutation vs setState boilerplate
- ✅ Perfect for internal tracking (creation mode, panning, hover state)
- ✅ Matches existing pattern (we use refs throughout, not useState)

**What goes in CanvasState:**
- Creation state (active, type, tempObject, startPoint, points)
- Duplication state (isActive, originalShape)
- Text editing state (isActive, textObject, updateTimer)
- Interaction state (isPanning, isDraggingShape, hoveredObject)
- Tracking state (savingShapeIds, lastMoveUpdate)

**What stays in Canvas.tsx state:**
- Fabric canvas instance (ref)
- Shapes from Convex (query result)
- Active tool (React state, triggers re-render to swap tools)

## Known Patterns & Edge Cases

### Tool Lifecycle
Tools are initialized once and cached. When switching tools:
1. Previous tool's `onDeactivate()` is called (cleanup)
2. New tool's `onActivate()` is called (setup)
3. Canvas cursor and interaction modes are updated

### Centralized State Management
`CanvasState` is a mutable class (not React state):
- Direct mutation for performance (no re-renders)
- Perfect for internal tracking state (creation modes, panning, hover)
- Helper methods ensure consistent state resets (e.g., `resetCreation()`)

### Viewport Persistence
Canvas zoom/pan state is saved to localStorage and restored on mount (`hooks/useViewport.ts`).

### Shape Selection During Creation
When creating a shape, it's temporarily non-selectable until creation completes. After mouse-up, it becomes selectable and is automatically selected.

### Presence Rejoin Logic
If presence record is deleted by cron (user inactive), the visibility handler automatically rejoins when tab becomes visible. This prevents "ghost cursor" issues.

### Scale Handling
Fabric.js applies transforms via scaleX/scaleY. On modification end, these are converted to actual width/height and scale is reset to 1.

### Alt+Drag Behavior (useSelectTool)
Alt key changes drag behavior based on target:
- **Alt+Drag on shape**: Duplicate the shape
- **Alt+Drag on canvas**: Pan the canvas (same as hand tool)
This provides quick access to common operations without tool switching.

## Troubleshooting

### "Not authenticated" errors in Convex
- Verify Clerk environment variables are set
- Check user is signed in (`useUser()` returns valid user)
- Ensure `bunx convex dev` is running

### Shapes not syncing between users
- Verify both users are authenticated
- Check Convex dashboard logs for mutation errors
- Ensure `bunx convex dev` is running in both environments

### Cursor not appearing for other users
- Check presence panel - user must appear in active users list
- Verify `updateCursorPosition` is being called (throttled to 50ms)
- Check browser console for presence-related errors
- Ensure window is visible/focused (cursor updates blocked when hidden)

### Convex deployment issues
Build command runs `npx convex deploy` before Next.js build. Ensure Convex CLI is authenticated and project is configured.

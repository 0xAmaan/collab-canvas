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
    Canvas.tsx           # Main canvas component with pan/zoom/selection
    Shape.tsx            # Fabric.js shape creation and sync utilities
    SelectionBox.tsx     # Selection styling configuration
    MultiplayerCursor.tsx # Remote user cursor rendering
  toolbar/               # Canvas toolbar UI
  presence/              # Multiplayer presence features

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
  useThrottle.ts         # Performance throttling utility

constants/
  shapes.ts              # Canvas/shape configuration
  colors.ts              # Design system color palette
  keyboard.ts            # Keyboard shortcut mappings

types/
  shapes.ts              # Shape type definitions
  presence.ts            # Presence/cursor type definitions
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

### Canvas Architecture (Fabric.js)

The canvas uses Fabric.js for rendering and interaction, with these key components:

1. **Canvas.tsx**: Main canvas component managing:
   - Fabric.js initialization and lifecycle
   - Mouse events (pan, zoom, shape creation, selection)
   - Real-time sync between Fabric objects and Convex database
   - Viewport transform and persistence

2. **Shape.tsx**: Utilities for:
   - Creating Fabric.js objects from Convex shape data
   - Updating Fabric.js objects when database changes
   - Converting Fabric.js objects back to shape data

3. **Sync Pattern**:
   - User interaction → Update Fabric.js object → Send mutation to Convex
   - Convex update → Query re-runs → Update Fabric.js canvas
   - Throttling applied to high-frequency updates (moves: 100ms, cursor: 50ms)

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

1. **Batch Rendering**: Disable `renderOnAddRemove` during bulk updates (Canvas.tsx:525-528)
2. **Throttled Updates**: Cursor (50ms), shape movement (100ms)
3. **Viewport Transform**: Direct DOM manipulation to avoid React re-renders (DashboardClient.tsx:83-114)
4. **Optimistic Updates**: Shapes appear immediately, sync asynchronously (useShapes.ts)
5. **Selective Sync**: Skip updates for objects user is actively manipulating (Canvas.tsx:536-541)

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

1. Update `convex/schema.ts` to add new shape properties
2. Update `types/shapes.ts` to add TypeScript types
3. Add creation/rendering logic in `components/canvas/Shape.tsx`
4. Add toolbar button in `components/toolbar/Toolbar.tsx`
5. Update canvas event handlers in `components/canvas/Canvas.tsx`

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

## Known Patterns & Edge Cases

### Viewport Persistence
Canvas zoom/pan state is saved to localStorage and restored on mount (`hooks/useViewport.ts`).

### Shape Selection During Creation
When creating a shape, it's temporarily non-selectable until creation completes. After mouse-up, it becomes selectable and is automatically selected.

### Presence Rejoin Logic
If presence record is deleted by cron (user inactive), the visibility handler automatically rejoins when tab becomes visible. This prevents "ghost cursor" issues.

### Scale Handling
Fabric.js applies transforms via scaleX/scaleY. On modification end, these are converted to actual width/height and scale is reset to 1 (Canvas.tsx:407-421).

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

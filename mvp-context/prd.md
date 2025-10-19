# CollabCanvas MVP - Product Requirements Document

## 1. Project Overview

**Product Name:** CollabCanvas MVP  
**Timeline:** 24 hours to MVP checkpoint  
**Goal:** Build a real-time collaborative canvas with multiplayer features that demonstrates solid foundational infrastructure

**Success Criteria:** Pass the MVP checkpoint by delivering all 8 required features with bulletproof real-time synchronization.

---

## 2. MVP Feature Requirements

### 2.1 Canvas Infrastructure
**Feature:** Basic canvas with pan/zoom  
**Requirements:**
- Large workspace (minimum 5000x5000px virtual space)
- Smooth pan via mouse drag or touch
- Zoom controls: mouse wheel, pinch gesture, and UI buttons
- Zoom range: 10% to 400%
- Maintain 60 FPS during all pan/zoom operations
- Viewport should persist user's position/zoom on page refresh

**Technical Considerations:**
- Use Fabric.js canvas with viewport transform for pan/zoom
- Leverage Fabric.js built-in zoom functionality (`canvas.setZoom()`)
- Use Fabric.js viewport translation for panning
- Implement viewport culling to only render visible objects (Fabric.js handles this)
- Use `requestAnimationFrame` for smooth animations where needed

---

### 2.2 Shape Creation & Manipulation
**Feature:** Rectangle shape type (MVP focus)  
**Requirements:**
- Create rectangle via:
  - Toolbar button + canvas click
  - **Keyboard shortcut: Press 'R' key to toggle rectangle creation mode**
- Properties: position (x, y), dimensions (width, height), fill color
- Shapes should have visual selection state (border/handles)
- Default dimensions: 100x100px

**Keyboard Shortcut Behavior:**
- Press 'R' → Enter rectangle creation mode (cursor changes to crosshair)
- Click on canvas → Create rectangle at click position
- Press 'R' again or 'Escape' → Exit creation mode
- Visual indicator in toolbar showing active tool

**Feature:** Ability to create and move objects  
**Requirements:**
- Click to select a shape
- Drag to move selected shape
- Visual feedback during drag (cursor change, shape highlight)
- Snap to release position
- Movement should feel immediate (no lag)

**Technical Considerations:**
- Use Fabric.js canvas instance as single source of truth for rendering
- Sync Fabric.js object state with Convex database
- Implement local optimistic updates using Fabric.js object manipulation
- Store shape data as plain objects with unique IDs in Convex
- Use Fabric.js built-in events for selection and dragging

---

### 2.3 Real-Time Synchronization
**Feature:** Real-time sync between 2+ users  
**Requirements:**
- Any shape creation appears on all connected clients within 100ms
- Any shape movement syncs across clients within 100ms
- Changes persist - refresh shows current state
- Handle race conditions gracefully (last write wins is acceptable)

**Implementation with Convex:**
- Leverage Convex's real-time subscriptions for automatic sync
- Use Convex queries to reactively listen to canvas state changes
- Implement Convex mutations for all canvas modifications
- Structure: `useQuery(api.canvas.getShapes)` for reading, `useMutation(api.canvas.updateShape)` for writing

**Critical Implementation Details:**
```typescript
// Example Convex pattern
// Frontend: Subscribe to changes
const shapes = useQuery(api.canvas.getShapes);

// Frontend: Optimistic updates
const moveShape = useMutation(api.canvas.moveShape);
// Call with optimistic UI update, Convex handles sync
```

**Sync Strategy:**
- **State-based sync** (not operation-based): Broadcast full shape state on changes
- Conflict resolution: Last write wins (simpler for MVP)
- Each client maintains local optimistic state, reconciles with server state

---

### 2.4 Multiplayer Presence
**Feature:** Multiplayer cursors with name labels  
**Requirements:**
- Show cursor position for each connected user
- Display user name label next to cursor
- Different color per user (consistent per session)
- Cursor position updates within 50ms
- Smooth cursor movement (interpolation)
- Cursors disappear when user disconnects

**Feature:** Presence awareness (who's online)  
**Requirements:**
- Display list of currently connected users
- Show user avatars/names
- Real-time updates when users join/leave
- Visual indicator of "active" state

**Implementation with Convex:**
- Use Convex presence system for tracking online users
- Store cursor positions in fast-updating Convex documents
- Implement cursor throttling (update every 50ms max to reduce bandwidth)

**Technical Considerations:**
```typescript
// Cursor position updates should be throttled
const updateCursor = useMutation(api.presence.updateCursor);
const throttledUpdate = useThrottle(updateCursor, 50);

// Presence tracking
const activeUsers = useQuery(api.presence.getActiveUsers);
```

---

### 2.5 User Authentication
**Feature:** User authentication (users have accounts/names)  
**Requirements:**
- Sign up with email/password
- Login/logout functionality
- Persistent sessions
- User profile with name and avatar
- Each authenticated user has unique ID

**Implementation with Clerk:**
- Use Clerk's `<SignIn>`, `<SignUp>`, and `<UserButton>` components
- Integrate Clerk with Convex for authenticated queries/mutations
- Store Clerk user ID in Convex documents for ownership tracking

**Integration Pattern:**
```typescript
// Convex + Clerk integration
// Use Clerk's user ID in Convex schema
const user = await ctx.auth.getUserIdentity();
if (!user) throw new Error("Not authenticated");
```

**Setup Steps:**
1. Configure Clerk in Next.js app
2. Set up Clerk + Convex integration using Convex's auth adapter
3. Protect Convex mutations with authentication checks
4. Use Clerk's `useUser()` hook for client-side user info

---

### 2.6 Deployment
**Feature:** Deployed and publicly accessible  
**Requirements:**
- Hosted on public URL
- Works across different devices/browsers
- Supports 5+ concurrent users without degradation
- SSL enabled (HTTPS)

**Recommended Setup:**
- **Frontend hosting:** Vercel (automatic with Next.js)
- **Backend:** Convex (automatically deployed)
- **Domain:** Use Vercel's free subdomain or custom domain

---

## 3. Technical Architecture

### 3.1 Stack Overview
- **Frontend:** Next.js 14+ (App Router)
- **Backend/Database:** Convex (real-time database + backend functions)
- **Authentication:** Clerk
- **Canvas Rendering:** Fabric.js (object-based canvas manipulation)
- **Styling:** Tailwind CSS
- **Animations:** CSS transforms via Tailwind (Framer Motion for post-MVP)

### 3.2 Why This Stack?

**Convex Benefits:**
- Built-in real-time subscriptions (no WebSocket setup needed)
- Automatic state synchronization
- TypeScript-first with end-to-end type safety
- Handles presence and cursor updates efficiently
- Simple deployment

**Clerk Benefits:**
- Drop-in authentication components
- Seamless integration with Convex
- User management UI included
- Social login support

**Next.js Benefits:**
- Fast development with App Router
- Server components for performance
- Easy Vercel deployment
- Great developer experience

**Tailwind CSS:**
- Rapid UI development
- Built-in transform utilities for pan/zoom
- Consistent design system
- Small bundle size

**Fabric.js:**
- Object-based canvas manipulation (easier than raw Canvas API)
- Built-in support for selection, dragging, and transformations
- Event system for mouse interactions
- JSON serialization for state sync
- Active community and good documentation
- Significantly reduces canvas rendering code complexity

---

## 4. Application Structure

### 4.1 Single Shared Canvas Model

**Simplified Architecture:**
- **One global canvas** shared by all users
- No per-user canvases or canvas selection
- All authenticated users collaborate on the same workspace
- Simpler data model for MVP

**Benefits:**
- Eliminates canvas creation/management UI
- Focuses development on core collaboration features
- Easier testing with multiple users
- Reduces complexity of routing and state management

### 4.2 User Flow

**First-Time User:**
1. User lands on **home page** (landing page with authentication)
2. See sign-up/sign-in options (single consolidated UI)
3. Complete authentication via Clerk
4. **Immediately redirected to /dashboard** (the shared canvas)
5. Start creating shapes and see other users' work

**Returning User:**
1. Land on home page
2. Already authenticated → Auto-redirect to /dashboard
3. See their previous work and other users' contributions

**No separate "Create Canvas" or "Select Canvas" flow needed**

---

## 5. Database Schema (Convex)

### 5.1 Simplified Schema for Single Canvas

```typescript
// schema.ts in Convex

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Shapes on the global canvas
  // No canvasId needed - all shapes are on the single shared canvas
  shapes: defineTable({
    type: v.literal("rectangle"), // Only rectangles for MVP
    
    // Position and dimensions
    x: v.number(),
    y: v.number(),
    width: v.number(),
    height: v.number(),
    
    // Styling
    fillColor: v.string(),
    
    // Metadata
    createdBy: v.string(), // Clerk user ID
    createdAt: v.number(),
    lastModified: v.number(),
    lastModifiedBy: v.string(),
  })
    .index("by_created", ["createdAt"]),

  // Presence - who's currently viewing/editing
  presence: defineTable({
    userId: v.string(), // Clerk user ID
    userName: v.string(),
    userAvatar: v.optional(v.string()),
    cursorColor: v.string(), // Hex color for cursor
    
    // Cursor position
    cursorX: v.number(),
    cursorY: v.number(),
    
    // Activity tracking
    lastActive: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_last_active", ["lastActive"]),
});
```

### 5.2 Database Design Decisions

**Single Canvas Simplification:**
- Removed `canvases` table entirely
- All shapes exist in one global namespace
- No need for `canvasId` foreign keys
- Simpler queries (no filtering by canvas)

**Shapes Table:**
- Only `type: "rectangle"` for MVP
- Complete shape state stored (position, size, color)
- Creator and modifier tracking for potential future features
- Timestamp for ordering and conflict resolution

**Presence Table:**
- One presence record per connected user
- High-frequency updates for cursor positions
- `lastActive` timestamp for cleaning up stale connections
- Assigned cursor color persists during session

**State-Based Sync Strategy:**
- Store complete shape state (not deltas/operations)
- Simpler conflict resolution
- Easier to reason about
- Trade-off: More data over wire, but Convex handles efficiently

**Why Not Operational Transform (OT) or CRDT?**
- MVP uses "last write wins" - acceptable for shapes
- OT/CRDT adds significant complexity
- Can be added later if needed for text editing
- For shape positions/properties, state-based sync is sufficient

---

## 7. User Stories (MVP Features)

### Epic 1: Authentication & Entry
**As a new user**, I want to sign up for an account so that I can save my work and collaborate with others.
- **Acceptance Criteria:**
  - I can sign up using email and password
  - I receive confirmation that my account was created
  - I am automatically redirected to the dashboard after signup
  - My username is visible in the UI

**As a returning user**, I want to log in quickly so that I can continue working on the shared canvas.
- **Acceptance Criteria:**
  - I can log in with my credentials
  - If already authenticated, I'm automatically redirected to the dashboard
  - I can log out using the profile button
  - My session persists across browser refreshes

---

### Epic 2: Canvas Navigation
**As a user**, I want to pan around the canvas so that I can view different areas of the workspace.
- **Acceptance Criteria:**
  - I can click and drag on empty canvas space to pan
  - Panning is smooth at 60 FPS
  - My viewport position is preserved on page refresh
  - Pan works with mouse drag

**As a user**, I want to zoom in and out so that I can see details or get an overview of my work.
- **Acceptance Criteria:**
  - I can zoom using mouse wheel
  - I can zoom using UI buttons (+ and -)
  - Zoom range is 10% to 400%
  - Zoom is smooth at 60 FPS
  - Zoom centers on my cursor position
  - My zoom level is preserved on page refresh

---

### Epic 3: Shape Creation & Manipulation
**As a user**, I want to create rectangles quickly so that I can build designs efficiently.
- **Acceptance Criteria:**
  - I can press 'R' to enter rectangle creation mode
  - Toolbar highlights the active tool
  - Cursor changes to crosshair in creation mode
  - Clicking on canvas creates a 100x100px rectangle
  - Rectangle appears at my click position
  - I can press 'R' or 'Escape' to exit creation mode
  - I can also activate the tool by clicking toolbar button

**As a user**, I want to select shapes so that I can manipulate them.
- **Acceptance Criteria:**
  - I can click on a shape to select it
  - Selected shapes show visual feedback (border/handles)
  - Only one shape can be selected at a time (MVP)
  - Clicking empty space deselects the current shape

**As a user**, I want to move shapes around the canvas so that I can arrange my design.
- **Acceptance Criteria:**
  - I can click and drag a selected shape to move it
  - Movement is smooth with no lag
  - Shape snaps to its final position on release
  - Visual feedback shows the shape is being dragged

**As a user**, I want my shapes to persist so that my work isn't lost.
- **Acceptance Criteria:**
  - Shapes remain after page refresh
  - Shapes are saved automatically as I work
  - No manual save button needed
  - All properties (position, size, color) are preserved

---

### Epic 4: Real-Time Collaboration
**As a user**, I want to see other users' changes in real-time so that we can collaborate effectively.
- **Acceptance Criteria:**
  - When another user creates a shape, I see it within 100ms
  - When another user moves a shape, I see the movement within 100ms
  - Changes sync automatically without page refresh
  - No manual refresh needed to see updates
  - All users see the same canvas state

**As a user**, I want to see where other users are working so that we don't interfere with each other.
- **Acceptance Criteria:**
  - I see other users' cursor positions in real-time
  - Each cursor shows the user's name in a label
  - Each user has a distinct cursor color
  - Cursor movements are smooth (update within 50ms)
  - Cursors disappear when users disconnect

**As a user**, I want to know who else is online so that I know who I'm collaborating with.
- **Acceptance Criteria:**
  - I see a list of all online users
  - List shows user names and avatars
  - List updates in real-time as users join/leave
  - My own presence is shown in the list
  - List is visible and accessible in the UI

---

### Epic 5: System Reliability
**As a user**, I want the canvas to remain responsive even with many shapes so that I can work on complex designs.
- **Acceptance Criteria:**
  - Canvas maintains 60 FPS with 100+ shapes
  - No lag when dragging shapes
  - No lag when panning or zooming
  - Canvas supports at least 500 shapes without FPS drops

**As a user**, I want the system to handle disconnections gracefully so that my work isn't disrupted.
- **Acceptance Criteria:**
  - If I lose connection temporarily, I see a warning
  - When connection is restored, canvas syncs automatically
  - No data loss during normal disconnections
  - Ghost cursors are cleaned up (no stale presence)

**As a user**, I want multiple people to work simultaneously without conflicts so that collaboration is seamless.
- **Acceptance Criteria:**
  - 5+ users can work simultaneously without degradation
  - When two users edit the same shape, changes resolve consistently
  - No crashes or errors when multiple users are active
  - Performance remains stable with multiple users

---

## 8. Key User Flows

### 8.1 Authentication & Entry Flow
1. User visits home page (`/`)
2. Sees landing page with **single authentication option**
3. Clicks "Get Started" or "Sign In"
4. Clerk modal appears (handles both sign-up and sign-in)
5. User completes authentication
6. **Automatically redirected to `/dashboard`** (the shared canvas)
7. No additional canvas selection or creation needed

### 8.2 Collaborative Session Flow
1. User A completes authentication, lands on dashboard
2. User A sees existing shapes from previous users
3. User A creates a rectangle using 'R' key or toolbar
4. User B logs in, lands on same dashboard
5. User B immediately sees User A's cursor and new shapes
6. Both users see real-time updates as they work
7. Presence panel shows both users online

### 8.3 Shape Creation & Manipulation Flow

**Using Keyboard Shortcut:**
1. User presses 'R' key
2. Toolbar highlights rectangle tool
3. Cursor changes to crosshair
4. User clicks on canvas
5. Rectangle appears (100x100px default)
6. Rectangle is auto-selected
7. User can immediately drag to reposition or press 'R'/'Escape' to exit mode

**Using Toolbar:**
1. User clicks "Rectangle" button in toolbar
2. Same behavior as keyboard shortcut

---

## 9. Routing Structure

### 9.1 Next.js App Router Pages

```
app/
├── page.tsx                 // Home/Landing page (authentication)
├── dashboard/
│   └── page.tsx            // Main canvas page (protected route)
├── layout.tsx              // Root layout with Clerk provider
└── api/                    // API routes if needed
```

### 9.2 Route Descriptions

**`/` (Home Page):**
- Landing page with marketing content
- Single authentication entry point (no separate sign-up/sign-in pages)
- Clerk handles auth flow in modal
- Redirects authenticated users to `/dashboard`

**`/dashboard` (Canvas Page):**
- Protected route (requires authentication)
- Main application interface
- Canvas workspace with toolbar
- Presence indicators
- User profile button (Clerk's UserButton)

---

## 10. Performance Requirements

### 10.1 FPS Targets
- **60 FPS** during pan/zoom operations
- **60 FPS** during shape dragging
- **30+ FPS** with 100+ shapes on canvas

**How to Achieve:**
- Use `requestAnimationFrame` for animations
- Implement viewport culling (only render visible shapes)
- Debounce/throttle expensive operations
- Use Tailwind's transform utilities (GPU accelerated)

### 10.2 Sync Latency Targets
- **<100ms** for shape creation/modification sync
- **<50ms** for cursor position updates
- **<200ms** for presence updates (join/leave)

**How to Achieve:**
- Leverage Convex's real-time subscriptions (already optimized)
- Throttle cursor updates to 20 updates/second max
- Use optimistic UI updates for immediate feedback
- Batch shape updates when possible

### 10.3 Scalability Targets
- Support **5+ concurrent users** without degradation
- Support **500+ shapes** per canvas without FPS drops

**How to Monitor:**
- Use browser Performance API
- Log FPS in development mode
- Test with Chrome DevTools Network throttling
- Load test with multiple browser instances

---

## 11. Critical Implementation Challenges

### 11.1 Real-Time Sync Race Conditions

**Problem:** Two users edit the same shape simultaneously.

**Solution for MVP:**
- Use "last write wins" strategy
- Each mutation includes timestamp
- Convex handles ordering via its consistency model
- Document this limitation in the development log

**Example Scenario:**
- User A moves rectangle to position (100, 100)
- User B simultaneously moves same rectangle to (200, 200)
- Whichever mutation reaches Convex last wins
- Both users see the final state reconcile

**Implementation:**
```typescript
// mutations/shapes.ts
export const moveShape = mutation({
  args: {
    shapeId: v.id("shapes"),
    x: v.number(),
    y: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) throw new Error("Not authenticated");
    
    await ctx.db.patch(args.shapeId, {
      x: args.x,
      y: args.y,
      lastModified: Date.now(),
      lastModifiedBy: user.subject,
    });
  },
});
```

### 11.2 Cursor Update Frequency

**Problem:** Sending cursor position on every mouse move (60+ times/second) overwhelms the network.

**Solution:**
- Throttle cursor updates to 20 updates/second (50ms intervals)
- Use client-side interpolation for smooth cursor rendering
- Implement cursor prediction for local user

**Implementation:**
```typescript
// Use lodash throttle or custom hook
const throttledCursorUpdate = useThrottle((x, y) => {
  updateCursor({ x, y });
}, 50);

// Listen to Fabric.js mouse move event
canvas.on('mouse:move', (e) => {
  const pointer = canvas.getPointer(e.e);
  throttledCursorUpdate(pointer.x, pointer.y);
});
```

### 11.3 Stale Presence Records

**Problem:** Users disconnect without cleanup (browser crash, network failure), leaving ghost cursors.

**Solution:**
- Implement heartbeat mechanism (update `lastActive` every 5 seconds)
- Background Convex cron job to remove presence records older than 30 seconds
- Client-side: Clear presence on `beforeunload` event (best effort)

**Implementation:**
```typescript
// Heartbeat every 5 seconds
useEffect(() => {
  const interval = setInterval(() => {
    updatePresence({ lastActive: Date.now() });
  }, 5000);
  
  return () => clearInterval(interval);
}, []);

// Cleanup on unmount
useEffect(() => {
  const handleUnload = () => {
    removePresence();
  };
  
  window.addEventListener('beforeunload', handleUnload);
  return () => window.removeEventListener('beforeunload', handleUnload);
}, []);
```

### 11.4 Canvas Coordinate System

**Problem:** Need to map screen coordinates to canvas coordinates accounting for pan/zoom.

**Solution:**
- Fabric.js handles coordinate transformation automatically
- Use `canvas.getPointer(e)` to get canvas coordinates from screen events
- Fabric.js manages viewport transform internally

**Fabric.js Coordinate Transformation:**
```typescript
// Fabric.js automatically handles coordinate transformation
const canvas = new fabric.Canvas('canvas');

// Get canvas coordinates from mouse event
canvas.on('mouse:move', (e) => {
  const pointer = canvas.getPointer(e.e);
  // pointer.x and pointer.y are already in canvas coordinates
  updateCursor({ x: pointer.x, y: pointer.y });
});

// Pan the viewport
canvas.relativePan(new fabric.Point(deltaX, deltaY));

// Zoom the viewport
canvas.zoomToPoint(
  new fabric.Point(centerX, centerY),
  newZoomLevel
);
```

### 11.5 Performance with Many Shapes

**Problem:** Rendering 500+ shapes at 60 FPS is computationally expensive.

**Solution:**
- **Fabric.js optimizations:** Fabric automatically handles dirty object tracking
- **Viewport culling:** Fabric.js has built-in optimization for off-screen objects
- **Static canvas mode:** Use `fabric.StaticCanvas` for non-interactive layers if needed
- **Object caching:** Enable caching on complex objects with `object.set('objectCaching', true)`

**Fabric.js Performance Best Practices:**
```typescript
// Enable object caching for better performance
rectangle.set({
  objectCaching: true,
  statefullCache: true
});

// Batch updates to reduce re-renders
canvas.renderOnAddRemove = false;
// ... add multiple objects ...
canvas.renderAll();
canvas.renderOnAddRemove = true;

// Use selection:false for objects that don't need interaction
object.set('selectable', false);
```

### 11.6 Keyboard Shortcut Management

**Problem:** Need to handle keyboard shortcuts without interfering with normal text input.

**Solution:**
- Only listen for shortcuts when no input fields are focused
- Implement global keyboard event listener with proper cleanup
- Visual feedback when shortcut mode is active

**Implementation:**
```typescript
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    // Don't trigger shortcuts if user is typing in input
    if (e.target instanceof HTMLInputElement || 
        e.target instanceof HTMLTextAreaElement) {
      return;
    }
    
    if (e.key === 'r' || e.key === 'R') {
      setTool('rectangle');
    } else if (e.key === 'Escape') {
      setTool('select');
    }
  };
  
  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, []);
```

---

## 12. MVP Development Plan

### Phase 1: Setup & Authentication
- [ ] Initialize Next.js project with TypeScript and Tailwind
- [ ] Set up Convex backend (install, configure)
- [ ] Integrate Clerk authentication
- [ ] Connect Clerk with Convex (auth integration)
- [ ] Create home page with authentication
- [ ] Create protected dashboard route
- [ ] Test: User can sign up, log in, access dashboard

### Phase 2: Canvas Infrastructure
- [ ] Initialize Fabric.js canvas instance
- [ ] Implement pan/zoom using Fabric.js viewport methods
- [ ] Add viewport state management (using Fabric.js viewport)
- [ ] Build rectangle creation using Fabric.js Rect objects
- [ ] Add keyboard shortcut ('R' key) for rectangle tool
- [ ] Implement shape selection using Fabric.js selection events
- [ ] Add shape dragging using Fabric.js object:moving events
- [ ] Test: User can pan, zoom, create, select, and move rectangles locally

### Phase 3: Real-Time Sync
- [ ] Define Convex schema (shapes, presence)
- [ ] Create Convex mutations (createShape, moveShape, deleteShape)
- [ ] Create Convex queries (getShapes, getPresence)
- [ ] Wire up frontend to Convex subscriptions
- [ ] Implement optimistic updates for shape operations
- [ ] Test: Open two browser windows, verify shape sync works

### Phase 4: Multiplayer Presence
- [ ] Implement cursor position tracking
- [ ] Create presence mutations (updateCursor, joinCanvas, leaveCanvas)
- [ ] Render multiplayer cursors with name labels
- [ ] Add presence panel (list of online users)
- [ ] Implement cursor throttling (50ms updates)
- [ ] Add heartbeat mechanism for presence cleanup
- [ ] Test: Two users see each other's cursors and presence

### Phase 5: Polish & Deploy
- [ ] Add UI polish (toolbar, colors, layout with Tailwind)
- [ ] Implement keyboard shortcuts visual feedback
- [ ] Test all MVP requirements in checklist
- [ ] Deploy to Vercel (frontend) - Convex auto-deploys
- [ ] Test deployed app with 2-3 users
- [ ] Fix critical bugs
- [ ] Document any known issues

---

## 13. Testing Checklist (MVP Validation)

Before submitting MVP, validate ALL items:

- [ ] **Canvas:** Pan with mouse drag works smoothly
- [ ] **Canvas:** Zoom with mouse wheel works (10-400% range)
- [ ] **Canvas:** UI zoom buttons work
- [ ] **Shapes:** Can create rectangles by clicking (after pressing 'R' or toolbar button)
- [ ] **Shapes:** 'R' keyboard shortcut toggles rectangle creation mode
- [ ] **Shapes:** 'Escape' key exits creation mode
- [ ] **Shapes:** Can select rectangle by clicking
- [ ] **Shapes:** Can drag rectangle to move
- [ ] **Shapes:** Shape properties (position, size, color) persist
- [ ] **Real-time:** Open 2 browser windows, create shape in one → appears in other
- [ ] **Real-time:** Move shape in one window → moves in other window
- [ ] **Real-time:** Sync latency is <100ms
- [ ] **Cursors:** See other user's cursor with name label
- [ ] **Cursors:** Cursor movement is smooth and real-time
- [ ] **Presence:** See list of online users
- [ ] **Presence:** User appears when they join
- [ ] **Presence:** User disappears when they leave
- [ ] **Auth:** Can sign up with email/password
- [ ] **Auth:** Can log in and log out
- [ ] **Auth:** User name displays in cursor label
- [ ] **Auth:** Authenticated users auto-redirect to dashboard
- [ ] **Persistence:** Refresh page → shapes still there
- [ ] **Persistence:** Close all tabs, reopen → shapes still there
- [ ] **Deployed:** App accessible via public URL
- [ ] **Deployed:** Works on different devices/browsers
- [ ] **Performance:** 60 FPS during pan/zoom
- [ ] **Performance:** No lag when dragging shapes
- [ ] **Multi-user:** 5 users can collaborate simultaneously

---

## 14. UI/UX Specifications

### 14.1 Home Page (`/`)
**Layout:**
- Hero section with project name and tagline
- Call-to-action: "Get Started" button
- Clerk authentication in modal (no separate pages)

**Behavior:**
- If user is already authenticated → Auto-redirect to `/dashboard`
- If user is not authenticated → Show landing page with auth button

### 14.2 Dashboard Page (`/dashboard`)
**Layout Components:**
- **Top Bar:**
  - App logo/name (left)
  - Toolbar with shape tools (center)
  - User profile button (right - Clerk's UserButton)
  - Zoom controls (right side of toolbar)
  
- **Left Sidebar (collapsible):**
  - Presence panel showing online users
  - User avatars with names
  - Online status indicators
  
- **Main Canvas Area:**
  - Full-screen canvas element
  - Grid background (optional, subtle)
  - Shapes rendered with selection highlights
  - Multiplayer cursors with name labels
  
- **Floating Elements:**
  - Keyboard shortcuts help (press '?' to toggle)
  - Current tool indicator

**Toolbar Buttons:**
- Select tool (default) - Pointer icon
- Rectangle tool ('R' shortcut) - Square icon
- Visual highlight on active tool

**Color Scheme:**
- Use Tailwind default palette
- Neutral background (slate-50 or gray-50)
- Primary accent color for selected shapes (blue-500)
- Distinct cursor colors (predefined palette)

---

## 15. Known Limitations & Future Work

### MVP Limitations (Acceptable)
- Only one shape type (rectangle)
- No shape resize/rotate (only move)
- No undo/redo
- No layers panel (shapes render in creation order)
- No color picker (predefined colors)
- "Last write wins" conflict resolution (no OT/CRDT)
- No shape grouping/multi-selection
- No copy/paste
- Single shared canvas (no per-user canvases)

### Post-MVP Enhancements
- Add circle and text shape types
- Implement resize handles on shapes
- Add rotation capability
- Build proper layers panel with z-index control
- Add color picker for custom colors
- Implement undo/redo with command pattern
- Add multi-select (drag-to-select box)
- Implement copy/paste/duplicate
- Add more keyboard shortcuts
- Build shape properties panel (edit dimensions, colors)
- Add canvas versioning/history
- Implement per-user canvases or projects

---

## 16. Risk Mitigation

### High-Risk Areas

**1. Real-Time Sync Complexity**
- **Risk:** Sync might not work reliably under load
- **Mitigation:** Start with sync FIRST (not last), test continuously with 2 windows
- **Fallback:** Use polling as temporary solution if subscriptions fail

**2. Performance with Zoom/Pan**
- **Risk:** Laggy interactions break 60 FPS requirement
- **Mitigation:** Use Tailwind transforms, test early with 100+ shapes
- **Fallback:** Reduce feature scope (fewer shapes, simpler rendering)

**3. Clerk + Convex Integration**
- **Risk:** Auth integration might have configuration issues
- **Mitigation:** Follow official Convex + Clerk docs precisely
- **Fallback:** Implement simple JWT auth directly in Convex (not ideal)

**4. Cursor Sync Performance**
- **Risk:** Too many cursor updates overwhelm network
- **Mitigation:** Throttle aggressively (50ms), test with 5 users
- **Fallback:** Reduce cursor update frequency to 100ms

**5. Keyboard Shortcut Conflicts**
- **Risk:** Shortcuts trigger during text input or conflict with browser shortcuts
- **Mitigation:** Check for focused input elements before triggering
- **Fallback:** Make shortcuts opt-in via settings

---

## 17. Success Metrics

### MVP Pass Criteria
- All 8 MVP requirements checkbox items completed
- App deployed and publicly accessible
- 2+ users can collaborate in real-time on single shared canvas
- 60 FPS maintained during interactions
- <100ms sync latency for shapes
- <50ms sync latency for cursors
- Keyboard shortcut ('R') works reliably

### Definition of "Bulletproof Multiplayer"
- Zero data loss during normal operations
- Graceful handling of disconnects/reconnects
- No ghost cursors (stale presence cleaned up)
- Consistent state across all connected clients
- Fast sync (<100ms) under normal network conditions

---

## 18. Development Environment Setup

### Prerequisites
- Node.js 18+ installed
- Bun package manager (https://bun.sh)
- Git for version control
- Convex account (free tier)
- Clerk account (free tier)
- Vercel account (free tier)

### Initial Setup Commands
```bash
# Create Next.js app with Bun
bunx create-next-app@latest collabcanvas --typescript --tailwind --app

# Install Convex
cd collabcanvas
bun add convex

# Initialize Convex
bunx convex dev

# Install Clerk
bun add @clerk/nextjs
```

### Environment Variables
```bash
# .env.local
NEXT_PUBLIC_CONVEX_URL=<your-convex-url>
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<your-clerk-key>
CLERK_SECRET_KEY=<your-clerk-secret>
```

---

## 19. Technical Decisions Summary

### Key Architectural Choices

1. **Single Shared Canvas:** Simplifies MVP by eliminating canvas management
2. **Fabric.js for Canvas:** Object-based manipulation with built-in interactions and transformations
3. **Tailwind for UI:** Keeps styling consistent and rapid
4. **Keyboard Shortcuts:** Enhances UX with 'R' key for quick rectangle creation
5. **State-Based Sync:** Simpler than operational transforms, sufficient for MVP
6. **Last Write Wins:** Acceptable conflict resolution strategy for shapes

### Future Considerations
- Framer Motion for advanced animations (post-MVP)
- Custom Fabric.js objects for complex shape manipulation (post-MVP)
- CRDT/OT for text editing features (post-MVP)
- Per-user canvases (post-MVP)

---

## 20. Resources & References

### Convex Documentation
- [Convex Quick Start](https://docs.convex.dev/quickstart)
- [Convex Real-Time Subscriptions](https://docs.convex.dev/database/reading-data)
- [Convex + Clerk Integration](https://docs.convex.dev/auth/clerk)

### Clerk Documentation
- [Clerk Next.js Setup](https://clerk.com/docs/quickstarts/nextjs)
- [Clerk Components](https://clerk.com/docs/components/overview)

### Tailwind CSS
- [Tailwind Transform Utilities](https://tailwindcss.com/docs/transform)
- [Tailwind Transition Utilities](https://tailwindcss.com/docs/transition-property)

### Canvas Resources
- [Fabric.js Documentation](http://fabricjs.com/docs/)
- [Fabric.js GitHub](https://github.com/fabricjs/fabric.js)
- [Fabric.js Demos](http://fabricjs.com/demos/)
- [HTML5 Canvas Tutorial](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial)

### Performance Optimization
- [React Performance Optimization](https://react.dev/learn/render-and-commit)
- [Viewport Culling Techniques](https://en.wikipedia.org/wiki/Hidden-surface_determination)

---

**Document Version:** 1.1  
**Last Updated:** October 13, 2025  
**Status:** Ready for Implementation

---

## Appendix A: Keyboard Shortcuts Reference

| Key | Action | Mode |
|-----|--------|------|
| `R` | Toggle rectangle creation tool | Global |
| `Escape` | Exit current tool / Deselect | Global |
| `Delete` / `Backspace` | Delete selected shape | When shape selected |
| `?` | Show keyboard shortcuts help | Global (optional) |

---

## Appendix B: Default Shape Properties

### Rectangle Defaults
- **Width:** 100px
- **Height:** 100px
- **Fill Color:** `#3b82f6` (Tailwind blue-500)
- **Stroke:** 2px solid when selected
- **Stroke Color:** `#1e40af` (Tailwind blue-700)

### Cursor Colors (Presence)
Simplified color palette for MVP:
1. `#3b82f6` (blue-500)
2. `#8b5cf6` (violet-500)
3. `#ef4444` (red-500)

Assigned sequentially as users join.

---

## Appendix C: Error Handling Strategy

### User-Facing Errors
- **Authentication failures:** Show Clerk's error messages
- **Network errors:** Display "Connection lost" banner
- **Sync failures:** Show warning icon with retry option

### Developer Errors
- Log all errors to console in development
- Use error boundaries for React component errors
- Implement Convex error handlers in mutations/queries

### Graceful Degradation
- If real-time sync fails → Fall back to manual refresh
- If cursor sync fails → Hide multiplayer cursors
- If presence fails → Hide online users panel
# CollabCanvas MVP - Task List & Project Structure

## Project File Structure

```
collabcanvas/
├── .env.local                          # Environment variables
├── .gitignore
├── next.config.js
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
├── README.md
│
├── convex/                             # Convex backend
│   ├── _generated/                     # Auto-generated Convex files
│   ├── auth.config.ts                  # Clerk + Convex auth configuration
│   ├── schema.ts                       # Database schema definition
│   ├── shapes.ts                       # Shape mutations and queries
│   ├── presence.ts                     # Presence mutations and queries
│   ├── crons.ts                        # Cron jobs (presence cleanup)
│   └── tsconfig.json
│
├── src/
│   ├── app/                            # Next.js App Router
│   │   ├── layout.tsx                  # Root layout with Clerk provider
│   │   ├── page.tsx                    # Home/landing page
│   │   ├── dashboard/
│   │   │   └── page.tsx                # Main canvas dashboard
│   │   ├── globals.css                 # Global styles with Tailwind
│   │   └── fonts/                      # Custom fonts (optional)
│   │
│   ├── components/                     # React components
│   │   ├── canvas/
│   │   │   ├── Canvas.tsx              # Main canvas component
│   │   │   ├── CanvasRenderer.tsx      # Canvas rendering logic
│   │   │   ├── Shape.tsx               # Shape rendering component
│   │   │   ├── MultiplayerCursor.tsx   # Render other users' cursors
│   │   │   └── SelectionBox.tsx        # Shape selection UI
│   │   │
│   │   ├── toolbar/
│   │   │   ├── Toolbar.tsx             # Main toolbar component
│   │   │   ├── ToolButton.tsx          # Individual tool button
│   │   │   └── ZoomControls.tsx        # Zoom in/out/reset buttons
│   │   │
│   │   ├── presence/
│   │   │   ├── PresencePanel.tsx       # Sidebar showing online users
│   │   │   └── UserAvatar.tsx          # User avatar component
│   │   │
│   │   └── ui/                         # Shared UI components
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       └── Spinner.tsx
│   │
│   ├── hooks/                          # Custom React hooks
│   │   ├── useCanvas.ts                # Canvas state management
│   │   ├── useViewport.ts              # Viewport (pan/zoom) state
│   │   ├── useShapes.ts                # Shapes data from Convex
│   │   ├── usePresence.ts              # Presence data from Convex
│   │   ├── useKeyboard.ts              # Keyboard shortcuts handler
│   │   └── useThrottle.ts              # Throttle utility hook
│   │
│   ├── lib/                            # Utility functions
│   │   ├── canvas-utils.ts             # Canvas coordinate transformations
│   │   ├── color-utils.ts              # Color palette and assignment
│   │   ├── shape-utils.ts              # Shape creation and manipulation helpers
│   │   └── viewport-utils.ts           # Viewport calculations
│   │
│   ├── types/                          # TypeScript type definitions
│   │   ├── canvas.ts                   # Canvas-related types
│   │   ├── shapes.ts                   # Shape types
│   │   ├── viewport.ts                 # Viewport types
│   │   └── presence.ts                 # Presence types
│   │
│   └── constants/                      # Constants and configuration
│       ├── colors.ts                   # Color palette definitions (blue, purple, red)
│       ├── shapes.ts                   # Default shape properties
│       └── keyboard.ts                 # Keyboard shortcut mappings
│
├── public/                             # Static assets
│   ├── favicon.ico
│   └── images/
│
└── docs/                               # Documentation
    ├── API.md                          # API documentation
    └── DEVELOPMENT.md                  # Development guide
```

---

## Task List - Pull Request Breakdown

---

### **PR #1: Project Setup & Configuration**
**Branch:** `feat/project-setup`  
**Description:** Initialize Next.js project with all dependencies and basic configuration  
**Dependencies:** None

#### Subtasks:
- [x] Create Next.js app with TypeScript and Tailwind CSS using Bun
- [x] Install and configure Convex
  - [x] Run `bun add convex`
  - [x] Run `bunx convex dev` to initialize
  - [x] Set up `convex/` directory structure
- [x] Install and configure Clerk
  - [x] Run `bun add @clerk/nextjs`
  - [x] Create Clerk application in dashboard
  - [x] Configure Clerk environment variables
- [x] Set up environment variables (`.env` configured)
- [x] Configure `.gitignore` to exclude sensitive files
- [x] Create basic `README.md` with setup instructions
- [x] Initialize Git repository and create initial commit
- [ ] Configure Tailwind with custom color palette (blue, purple, red)

**Files Created:**
- `package.json`
- `tsconfig.json`
- `tailwind.config.ts`
- `.env.local`
- `.env.example`
- `.gitignore`
- `README.md`

**Testing:**
- [x] Verify Next.js dev server runs (`bun run dev`)
- [x] Verify Convex dev server connects (`bunx convex dev`)
- [x] Verify environment variables are loaded correctly

---

### **PR #2: Authentication & Route Structure**
**Branch:** `feat/auth-routes`  
**Description:** Implement Clerk authentication with home and dashboard routes  
**Dependencies:** PR #1

#### Subtasks:
- [x] Configure Clerk provider in root layout
  - [x] Wrap app in `ClerkProvider`
  - [x] Add Clerk middleware for route protection
- [x] Set up Convex + Clerk integration
  - [x] Create `convex/auth.config.ts`
  - [x] Configure auth in Convex schema
- [x] Create home page (`app/page.tsx`)
  - [x] Design landing page UI with Tailwind
  - [x] Add "Get Started" CTA button
  - [x] Integrate Clerk sign-in/sign-up modal
  - [x] Add redirect logic for authenticated users
- [x] Create dashboard page (`app/dashboard/page.tsx`)
  - [x] Set up protected route (requires authentication)
  - [x] Create basic dashboard layout with top bar
  - [x] Add Clerk `<UserButton>` component (in header)
  - [x] Add placeholder for canvas area
- [x] Style global CSS (`app/globals.css`)
  - [x] Import Tailwind directives
  - [x] Add custom CSS variables for theme (Tailwind v4 @theme)
  - [x] Set base styles for body and canvas

**Files Created:**
- ✅ `app/layout.tsx` (with ClerkProvider and auth UI)
- ✅ `app/page.tsx` (beautiful landing page with redirect)
- ✅ `app/dashboard/page.tsx` (protected route with placeholder)
- ✅ `app/globals.css` (Tailwind v4 config with custom colors)
- ✅ `convex/auth.config.ts` (Clerk JWT integration)
- ✅ `convex/schema.ts` (shapes and presence tables defined)
- ✅ `middleware.ts` (Clerk middleware)
- ✅ `CONVEX_SETUP.md` (setup instructions)

**Testing:**
- [x] Verify unauthenticated users see landing page
- [x] Verify authenticated users auto-redirect to dashboard
- [x] Verify sign-up flow creates user account
- [x] Verify sign-in flow authenticates existing user
- [x] Verify dashboard is protected (redirects if not authenticated)
- [x] Verify UserButton displays and logout works

**Note:** User needs to add `CLERK_JWT_ISSUER_DOMAIN` to `.env` - see `CONVEX_SETUP.md`

---

### **PR #3: Database Schema & Convex Setup**
**Branch:** `feat/database-schema`  
**Description:** Define Convex database schema and create initial queries/mutations  
**Dependencies:** PR #2

#### Subtasks:
- [x] Define database schema in `convex/schema.ts`
  - [x] Create `shapes` table with all fields
  - [x] Create `presence` table with all fields
  - [x] Add indexes for efficient queries
- [x] Create shape mutations (`convex/shapes.ts`)
  - [x] `createShape` - Create new rectangle
  - [x] `updateShape` - Update shape properties
  - [x] `moveShape` - Update shape position
  - [x] `deleteShape` - Delete shape by ID
- [x] Create shape queries (`convex/shapes.ts`)
  - [x] `getShapes` - Get all shapes on canvas
  - [x] `getShape` - Get single shape by ID
- [x] Create presence mutations (`convex/presence.ts`)
  - [x] `updatePresence` - Update user cursor position
  - [x] `joinCanvas` - Create presence record when user joins
  - [x] `leaveCanvas` - Remove presence record when user leaves
  - [x] `heartbeat` - Update lastActive timestamp
- [x] Create presence queries (`convex/presence.ts`)
  - [x] `getActiveUsers` - Get all users with recent lastActive
  - [x] `getUserPresence` - Get presence for specific user
- [x] Create cron job for presence cleanup (`convex/crons.ts`)
  - [x] Remove presence records older than 30 seconds
  - [x] Run every 10 seconds

**Files Created:**
- ✅ `convex/schema.ts` (already existed from PR #2)
- ✅ `convex/shapes.ts` (171 lines, 4 mutations + 2 queries)
- ✅ `convex/presence.ts` (208 lines, 4 mutations + 2 queries)
- ✅ `convex/crons.ts` (65 lines, 1 internal mutation + cron config)
- ✅ `tests/convex.test.mjs` (executable test script with Bun.env)

**Testing:**
- [x] Run `bunx convex dev` and verify schema is generated
- [x] Test mutations in Convex dashboard
- [x] Test queries return expected data
- [x] Verify indexes are created correctly
- [x] Test cron job runs and cleans up stale presence
- [x] Run `bun run test:convex` for automated testing

---

### **PR #4: Canvas Infrastructure - Viewport & Rendering**
**Branch:** `feat/canvas-viewport`  
**Description:** Build canvas component with pan/zoom functionality  
**Dependencies:** PR #3

#### Subtasks:
- [x] Create TypeScript types
  - [x] `src/types/viewport.ts` - Viewport state types
  - [x] `src/types/canvas.ts` - Canvas types
  - [x] `src/types/shapes.ts` - Shape types
- [x] Create viewport utilities (`src/lib/viewport-utils.ts`)
  - [x] Coordinate transformation functions
  - [x] Viewport bounds calculation
  - [x] Zoom level constraints
- [x] Create canvas utilities (`src/lib/canvas-utils.ts`)
  - [x] Screen to canvas coordinate conversion
  - [x] Canvas to screen coordinate conversion
  - [x] Viewport culling algorithm
- [x] Create viewport hook (`src/hooks/useViewport.ts`)
  - [x] State management for offset and scale
  - [x] Pan logic (mouse drag)
  - [x] Zoom logic (mouse wheel, pinch, UI controls)
  - [x] Persist viewport to localStorage
- [x] Create main Canvas component (`src/components/canvas/Canvas.tsx`)
  - [x] Set up HTML5 canvas element
  - [x] Handle mouse events (down, move, up)
  - [x] Handle wheel events for zoom
  - [x] Apply viewport transformations with Tailwind
- [x] Create CanvasRenderer component (`src/components/canvas/CanvasRenderer.tsx`)
  - [x] Render loop using requestAnimationFrame
  - [x] Clear and redraw canvas each frame
  - [x] Apply viewport culling (only render visible shapes)
- [x] Create zoom controls UI (`src/components/toolbar/ZoomControls.tsx`)
  - [x] Zoom in button
  - [x] Zoom out button
  - [x] Reset zoom button (100%)
  - [x] Display current zoom percentage
- [x] Create constants (`src/constants/shapes.ts`)
  - [x] Default shape dimensions
  - [x] Min/max zoom levels
  - [x] Canvas virtual size

**Files Created:**
- ✅ `src/types/viewport.ts`
- ✅ `src/types/canvas.ts`
- ✅ `src/types/shapes.ts`
- ✅ `src/lib/viewport-utils.ts`
- ✅ `src/lib/canvas-utils.ts`
- ✅ `src/hooks/useViewport.ts`
- ✅ `src/components/canvas/Canvas.tsx`
- ✅ `src/components/canvas/CanvasRenderer.tsx`
- ✅ `src/components/toolbar/ZoomControls.tsx`
- ✅ `src/constants/shapes.ts`

**Testing:**
- [x] Verify canvas renders at correct size
- [x] Verify pan works by dragging with mouse
- [x] Verify zoom works with mouse wheel
- [x] Verify zoom controls work (in/out/reset)
- [x] Verify viewport persists on page refresh
- [x] Test FPS maintains 60 during pan/zoom operations
- [x] Verify coordinate transformations are accurate

---

### **PR #5: Shape Creation & Local Manipulation**
**Branch:** `feat/shape-creation`  
**Description:** Implement rectangle creation, selection, and dragging (local only, no sync yet)  
**Dependencies:** PR #4

#### Subtasks:
- [x] Create shape utilities (`src/lib/shape-utils.ts`)
  - [x] Generate unique shape ID
  - [x] Check if point is inside shape bounds
  - [x] Calculate shape bounds after transform
- [x] Create color utilities (`src/lib/color-utils.ts`)
  - [x] Define simplified 3-color palette (blue, purple, red)
  - [x] Assign cursor color based on user index
- [x] Create constants (`src/constants/colors.ts`)
  - [x] Shape color palette (blue, purple, red)
  - [x] Cursor color palette (blue, purple, red)
  - [x] Selection colors
- [x] Create Shape rendering component (`src/components/canvas/Shape.tsx`)
  - [x] Render rectangle with fill color
  - [x] Render selection border when selected
  - [x] Render drag handles (optional for MVP)
- [x] Create SelectionBox component (`src/components/canvas/SelectionBox.tsx`)
  - [x] Render selection outline around shape
  - [x] Show corner handles (visual only)
- [x] Update Canvas component with shape logic
  - [x] Add tool state (select vs rectangle creation)
  - [x] Handle click to create rectangle
  - [x] Handle click to select shape
  - [x] Handle drag to move selected shape
  - [x] Local state management for shapes
- [x] Create Toolbar component (`src/components/toolbar/Toolbar.tsx`)
  - [x] Layout toolbar with Tailwind
  - [x] Add tool buttons container
- [x] Create ToolButton component (`src/components/toolbar/ToolButton.tsx`)
  - [x] Reusable button for tools
  - [x] Show active state with Tailwind styles
  - [x] Add icons (select pointer, rectangle)
- [x] Add select tool to toolbar
- [x] Add rectangle tool to toolbar
- [x] Update CanvasRenderer to draw shapes
  - [x] Loop through shapes and render each
  - [x] Apply viewport culling
  - [x] Highlight selected shape

**Files Created:**
- ✅ `src/lib/shape-utils.ts`
- ✅ `src/lib/color-utils.ts`
- ✅ `src/constants/colors.ts`
- ✅ `src/components/canvas/Shape.tsx`
- ✅ `src/components/canvas/SelectionBox.tsx`
- ✅ `src/components/toolbar/Toolbar.tsx`
- ✅ `src/components/toolbar/ToolButton.tsx`

**Testing:**
- [x] Verify clicking rectangle tool activates creation mode
- [x] Verify clicking canvas creates rectangle at click position
- [x] Verify rectangle has default dimensions (100x100)
- [x] Verify clicking shape selects it
- [x] Verify selected shape shows selection border
- [x] Verify dragging selected shape moves it
- [x] Verify shapes render with correct colors from simplified palette
- [x] Verify only one shape can be selected at a time
- [x] Test with 100+ shapes to verify performance

---

### **PR #6: Real-Time Shape Synchronization**
**Branch:** `feat/realtime-shapes`  
**Description:** Connect shapes to Convex for real-time sync across users  
**Dependencies:** PR #5

#### Subtasks:
- [x] Create shapes hook (`src/hooks/useShapes.ts`)
  - [x] Subscribe to Convex `getShapes` query
  - [x] Wrap Convex mutations (createShape, moveShape, deleteShape)
  - [x] Implement optimistic updates for immediate feedback
  - [x] Reconcile local optimistic state with server state
- [x] Update Canvas component with Convex integration
  - [x] Replace local shape state with `useShapes` hook
  - [x] Call Convex mutations on shape creation
  - [x] Call Convex mutations on shape movement
  - [x] Call Convex mutations on shape deletion
  - [x] Handle shape updates from other users
- [x] Add authentication checks to mutations
  - [x] Verify user is authenticated before allowing changes
  - [x] Include user ID in shape metadata
- [x] Add timestamp to shape operations
  - [x] Track `createdAt` and `lastModified`
  - [x] Display who created/modified shape (optional)
- [x] Handle sync errors gracefully
  - [x] Show error toast if mutation fails
  - [x] Revert optimistic update on error
  - [x] Add retry logic for transient failures

**Files Created:**
- ✅ `src/hooks/useShapes.ts`

**Testing:**
- [x] Open two browser windows with different users
- [x] Create shape in window 1 → verify it appears in window 2
- [x] Move shape in window 1 → verify it moves in window 2
- [x] Delete shape in window 1 → verify it disappears in window 2
- [x] Measure sync latency (<100ms for shapes)
- [x] Test with 5+ users simultaneously creating shapes
- [x] Verify optimistic updates work (immediate local feedback)
- [x] Test race condition: both users move same shape simultaneously
- [x] Verify refresh preserves all shapes
- [x] Test with network throttling (slow 3G)

---

### **PR #7: Multiplayer Cursors**
**Branch:** `feat/multiplayer-cursors`  
**Description:** Display real-time cursor positions for all connected users  
**Dependencies:** PR #6

#### Subtasks:
- [x] Create presence types (`src/types/presence.ts`)
  - [x] Define Presence interface
  - [x] Define cursor position type
- [x] Create presence hook (`src/hooks/usePresence.ts`)
  - [x] Subscribe to Convex `getActiveUsers` query
  - [x] Wrap presence mutations (updatePresence, joinCanvas, leaveCanvas)
  - [x] Implement cursor position throttling (50ms)
- [x] Create throttle hook (`src/hooks/useThrottle.ts`)
  - [x] Custom throttle implementation (no external dependencies)
  - [x] Configurable throttle delay
- [x] Create MultiplayerCursor component (`src/components/canvas/MultiplayerCursor.tsx`)
  - [x] Render cursor SVG at user position
  - [x] Display user name label next to cursor
  - [x] Apply user's assigned color from simplified palette
  - [x] Transform cursor position based on viewport
  - [x] Smooth cursor movement with CSS transitions
- [x] Update Canvas component with cursor tracking
  - [x] Track local cursor position on mousemove
  - [x] Call throttled `updatePresence` mutation
  - [x] Call `joinCanvas` on mount
  - [x] Call `leaveCanvas` on unmount
  - [x] Render MultiplayerCursor for each active user
- [x] Add heartbeat mechanism
  - [x] Update `lastActive` every 5 seconds
  - [x] Use setInterval in useEffect
- [x] Handle cleanup on page unload
  - [x] Call `leaveCanvas` in beforeunload event
  - [x] Best-effort cleanup (may not always fire)

**Files Created:**
- ✅ `types/presence.ts`
- ✅ `hooks/usePresence.ts`
- ✅ `hooks/useThrottle.ts`
- ✅ `components/canvas/MultiplayerCursor.tsx`

**Testing:**
- [ ] Open two browser windows with different users
- [ ] Move cursor in window 1 → verify cursor appears in window 2
- [ ] Verify cursor has user name label
- [ ] Verify each user has different cursor color from simplified palette
- [ ] Verify cursor movement is smooth (no jitter)
- [ ] Measure cursor update latency (<50ms)
- [ ] Verify cursor disappears when user closes tab
- [ ] Test with 5+ users simultaneously
- [ ] Verify cursors transform correctly with pan/zoom
- [ ] Test heartbeat: verify stale cursors are removed after 30 seconds

---

### **PR #8: Presence Panel & User List**
**Branch:** `feat/presence-panel`  
**Description:** Display list of online users in a sidebar panel  
**Dependencies:** PR #7

#### Subtasks:
- [x] Create UserAvatar component (`src/components/presence/UserAvatar.tsx`)
  - [x] Display Clerk user avatar image
  - [x] Fallback to initials if no avatar
  - [x] Show online status indicator (green dot)
  - [x] Apply user's cursor color as accent from simplified palette
- [x] Create PresencePanel component (`src/components/presence/PresencePanel.tsx`)
  - [x] Google Docs-style layout in top-right corner
  - [x] List all active users from `usePresence` hook
  - [x] Render UserAvatar for each user
  - [x] Display "+N more" indicator for overflow users
  - [x] Show total user count on hover
- [x] Create shared UI components (`src/components/ui/`)
  - [x] Avatar component (reusable)
  - [x] Badge component for online status
- [x] Integrate PresencePanel into dashboard layout
  - [x] Position in top-right corner of header
  - [x] Before zoom controls
  - [x] Update usePresence hook to return allUsers

**Files Created:**
- ✅ `components/presence/UserAvatar.tsx`
- ✅ `components/presence/PresencePanel.tsx`
- ✅ `components/presence/index.ts`
- ✅ `components/ui/Avatar.tsx`
- ✅ `components/ui/Badge.tsx`
- ✅ `components/ui/index.ts`

**Files Modified:**
- ✅ `hooks/usePresence.ts` (added allUsers to return value)
- ✅ `app/dashboard/DashboardClient.tsx` (integrated PresencePanel)

**Testing:**
- [ ] Verify presence panel shows current user with subtle border
- [ ] Open second browser window → verify both users appear
- [ ] Verify user count updates in real-time
- [ ] Verify avatars display correctly with initials
- [ ] Verify online status indicator is visible
- [ ] Verify cursor colors from simplified palette match between panel and canvas
- [ ] Close window → verify user disappears from panel
- [ ] Test with 10+ users to verify overflow indicator works

---

### **PR #9: Keyboard Shortcuts**
**Branch:** `feat/keyboard-shortcuts`  
**Description:** Implement keyboard shortcuts for tools and actions  
**Dependencies:** PR #8

#### Subtasks:
- [x] Create keyboard constants (`constants/keyboard.ts`)
  - [x] Map keys to tool names
  - [x] Define shortcut descriptions
  - [x] Add action enums for type safety
  - [x] Add helper functions for lookups
- [x] Refactor keyboard hook (`hooks/useKeyboard.ts`)
  - [x] Use constants instead of hardcoded keys
  - [x] Listen for keydown events globally
  - [x] Check if input element is focused (skip if true)
  - [x] Call appropriate handler based on key
  - [x] Clean up event listeners on unmount
  - [x] Add '?' key support for help modal
- [x] Integrate keyboard shortcuts in Dashboard component
  - [x] 'R' key toggles rectangle tool
  - [x] 'Escape' key activates select tool
  - [x] 'Delete'/'Backspace' deletes selected shape
- [x] Add visual feedback for active tool
  - [x] Highlight active tool button in toolbar
  - [x] Show cursor style based on active tool
  - [x] Display shortcut hint in toolbar (uses constants)
- [x] Create keyboard shortcuts help modal
  - [x] Press '?' to show shortcuts modal
  - [x] List all available shortcuts
  - [x] Position in bottom-right corner
  - [x] Click outside or press '?' to close
  - [x] Beautiful styling with animations

**Files Created:**
- ✅ `constants/keyboard.ts` (centralized shortcuts config)
- ✅ `components/ui/KeyboardShortcutsHelp.tsx` (help modal)

**Files Modified:**
- ✅ `hooks/useKeyboard.ts` (refactored to use constants)
- ✅ `app/dashboard/DashboardClient.tsx` (integrated help modal)
- ✅ `components/toolbar/Toolbar.tsx` (uses constants for labels)
- ✅ `components/ui/index.ts` (exports new component)

**Testing:**
- [x] Verify 'R' key activates rectangle tool
- [x] Verify 'R' key works when no input is focused
- [x] Verify 'R' key does NOT trigger when typing in input field
- [x] Verify 'Escape' exits creation mode
- [x] Verify 'Delete' deletes selected shape
- [x] Verify toolbar shows visual feedback for active tool
- [x] Verify cursor changes based on active tool
- [ ] Manual testing: Press '?' to see help modal (ready for user testing)

---

### **PR #10: UI Polish & Final Integration**
**Branch:** `feat/ui-polish`  
**Description:** Final UI improvements, bug fixes, and deployment preparation  
**Dependencies:** PR #9

#### Subtasks:
- [x] Improve dashboard layout
  - [x] Refine top bar styling with Tailwind
  - [x] Add app logo/name
  - [x] Position toolbar in center of top bar
  - [x] Position UserButton and zoom controls on right
- [x] Add loading states
  - [x] Show spinner while Convex data loads
  - [x] Show skeleton for shapes being synced
  - [x] Show loading for authentication
- [x] Add error handling UI
  - [x] Toast notifications for errors
  - [x] Connection status indicator
  - [x] Retry button for failed operations
- [x] Improve canvas visual design
  - [x] Add subtle grid background (optional)
  - [x] Improve shape selection highlight
  - [x] Add shadows to shapes (optional)
- [x] Add visual feedback for tool states
  - [x] Change cursor icon based on active tool
  - [x] Show "crosshair" cursor in rectangle creation mode
  - [x] Show "pointer" cursor in select mode
- [x] Performance optimizations
  - [x] Memoize expensive components with React.memo
  - [x] Use useMemo for computed values
  - [x] Use useCallback for event handlers
  - [x] Verify 60 FPS with 500+ shapes
- [x] Accessibility improvements
  - [x] Add ARIA labels to buttons
  - [x] Add keyboard navigation hints
  - [x] Ensure color contrast meets WCAG AA
- [x] Add meta tags for SEO
  - [x] Title, description, Open Graph tags
  - [x] Favicon
- [x] Create comprehensive README
  - [x] Setup instructions
  - [x] Environment variable documentation
  - [x] Deployment guide
  - [x] Architecture overview
- [x] Add development documentation
  - [x] API documentation for Convex functions
  - [x] Component documentation
  - [x] Development workflow guide

**Files Created:**
- `src/components/ui/Spinner.tsx`
- `src/components/ui/Toast.tsx`
- `public/favicon.ico`
- `docs/API.md`
- `docs/DEVELOPMENT.md`

**Testing:**
- [x] Complete full MVP testing checklist from PRD
- [x] Test on multiple browsers (Chrome, Firefox, Safari)
- [x] Test on mobile devices (responsive design)
- [x] Test with slow network (throttling)
- [x] Test with 5+ concurrent users
- [x] Test with 500+ shapes on canvas
- [x] Verify FPS stays at 60 during all interactions
- [x] Verify sync latency <100ms for shapes, <50ms for cursors
- [x] Test all keyboard shortcuts
- [x] Test authentication flow (sign up, sign in, sign out)
- [x] Test presence cleanup (stale cursors removed)

---

### **PR #11: Deployment & Production Setup**
**Branch:** `feat/deployment`  
**Description:** Deploy application to production and verify all features work  
**Dependencies:** PR #10

#### Subtasks:
- [x] Configure Vercel deployment
  - [x] Connect GitHub repository to Vercel
  - [x] Configure build settings
  - [x] Add environment variables in Vercel dashboard
  - [x] Enable automatic deployments on push
- [x] Deploy Convex to production
  - [x] Run `bunx convex deploy`
  - [x] Verify production Convex URL
  - [x] Update environment variables with production URL
- [x] Configure Clerk for production
  - [x] Update Clerk allowed origins
  - [x] Update redirect URLs
  - [x] Test authentication in production
- [x] Set up custom domain (optional)
  - [x] Configure DNS records
  - [x] Enable SSL certificate
  - [x] Verify domain works
- [x] Production testing
  - [x] Test all features on deployed app
  - [x] Test with multiple users from different locations
  - [x] Monitor for errors in Vercel logs
  - [x] Monitor Convex function performance
- [x] Set up monitoring (optional)
  - [x] Add error tracking (Sentry)
  - [x] Add analytics (Vercel Analytics)
  - [x] Set up uptime monitoring
- [x] Create deployment documentation
  - [x] Document deployment process
  - [x] Document rollback procedure
  - [x] Document environment variables

**Files Created:**
- `vercel.json` (if custom config needed)
- `docs/DEPLOYMENT.md`

**Testing:**
- [x] Verify app is accessible via public URL
- [x] Test complete user flow on production
- [x] Test with 5+ users on production
- [x] Verify all environment variables are set correctly
- [x] Verify Clerk authentication works in production
- [x] Verify Convex sync works in production
- [x] Test from different devices and networks
- [x] Verify HTTPS is enabled
- [x] Check for any console errors

---

## Development Workflow

### Branch Naming Convention
- Feature branches: `feat/<feature-name>`
- Bug fixes: `fix/<bug-description>`
- Documentation: `docs/<doc-name>`
- Chores: `chore/<task-name>`

### Pull Request Process
1. Create feature branch from `main`
2. Complete all subtasks for the PR
3. Test locally and verify all acceptance criteria
4. Create PR with detailed description
5. Self-review code and test in PR preview
6. Merge to `main` after approval
7. Verify deployment to production (Vercel auto-deploys)
8. Move to next PR

### Testing Before Each Merge
- [ ] All subtasks completed
- [ ] Local testing passes
- [ ] No console errors
- [ ] Code is formatted and linted
- [ ] TypeScript compiles without errors
- [ ] Manual testing of feature works as expected

---

## Critical Path

The PRs are designed to be completed in order. The critical path is:

**Setup Phase:**
1. PR #1 (Project Setup) → PR #2 (Auth & Routes) → PR #3 (Database)

**Core Canvas Phase:**
4. PR #4 (Canvas Viewport) → PR #5 (Shape Creation)

**Multiplayer Phase (MVP Focus):**
6. PR #6 (Real-time Sync) → PR #7 (Multiplayer Cursors) → PR #8 (Presence Panel)

**Enhancement & Deploy:**
9. PR #9 (Keyboard Shortcuts - Nice-to-have) → PR #10 (UI Polish) → PR #11 (Deployment)

---

## Priority Features (Must-Have for MVP)

These PRs are absolutely required to pass MVP checkpoint:
- ✅ PR #1: Project Setup (Complete)
- ✅ PR #2: Authentication & Routes (Complete)
- ✅ PR #3: Database Schema (Complete)
- ✅ PR #4: Canvas Viewport (Complete)
- ⏳ PR #5: Shape Creation
- ⏳ PR #6: Real-time Sync
- ⏳ PR #7: Multiplayer Cursors
- ⏳ PR #8: Presence Panel

**Nice-to-have but not blocking MVP:**
- PR #9: Keyboard Shortcuts (enhances UX but not required for MVP)
- PR #10: UI Polish (can be done after MVP)
- PR #11: Deployment (required for submission but can be rushed)

---

## Git Commit Message Guidelines

Use conventional commits format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Formatting, missing semicolons, etc.
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(canvas): implement pan and zoom with viewport transformations

- Add useViewport hook for state management
- Implement coordinate transformation utilities
- Add mouse drag handlers for panning
- Add mouse wheel handler for zooming

Closes #4
```

```
fix(presence): prevent duplicate cursor rendering for current user

The current user's cursor was being rendered alongside remote cursors.
Added filter to exclude current user from multiplayer cursor list.

Fixes #23
```

---

## Progress Tracking

Use this checklist to track overall progress:

### Setup & Foundation
- [x] PR #1: Project Setup ✅
- [x] PR #2: Auth & Routes ✅ (Complete - needs CLERK_JWT_ISSUER_DOMAIN env var)
- [x] PR #3: Database Schema ✅ (Complete - all mutations/queries/crons implemented)

### Canvas Core
- [x] PR #4: Canvas Viewport ✅ (Complete - viewport, pan, zoom, and canvas rendering implemented)
- [x] PR #5: Shape Creation ✅ (Complete - drag-to-create, selection, dragging, keyboard shortcuts, all fixes applied)

### Multiplayer (MVP Critical)
- [x] PR #6: Real-time Sync ✅ (Complete - Convex integration, optimistic updates, real-time collaboration)
- [x] PR #7: Multiplayer Cursors ✅ (Complete - real-time cursor tracking with throttling)
- [x] PR #8: Presence Panel ✅ (Complete - Google Docs-style presence panel in top-right corner)

### Enhancement & Deploy
- [x] PR #9: Keyboard Shortcuts ✅ (Complete - centralized constants, refactored code, help modal in bottom-right)
- [x] PR #10: UI Polish ✅ (Complete - performance optimizations, UI improvements, critical bug fixes)
- [x] PR #11: Deployment ✅ (Complete - deployed to production)

### MVP Checkpoint
- [x] All 8 MVP requirements met
- [x] App deployed and publicly accessible
- [x] Demo video recorded
- [x] AI Development Log completed

---

## Notes

- Each PR should be fully functional and deployable on its own
- Test each feature thoroughly before moving to the next PR
- Keep PRs focused and atomic (one feature per PR)
- Write clear commit messages and PR descriptions
- Update documentation as you build
- Don't skip testing - it saves time in the long run
- **Focus on getting MVP working first (PR #1-8), then add enhancements (PR #9-11)**
- Simplified 3-color palette (blue, purple, red) for MVP simplicity
- Using Bun as package manager for faster installs and builds
- No external throttle library needed - custom implementation is sufficient

---

**Document Version:** 1.1  
**Created:** October 13, 2025  
**Status:** Ready for Implementation
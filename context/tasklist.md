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
- [ ] Create shape utilities (`src/lib/shape-utils.ts`)
  - [ ] Generate unique shape ID
  - [ ] Check if point is inside shape bounds
  - [ ] Calculate shape bounds after transform
- [ ] Create color utilities (`src/lib/color-utils.ts`)
  - [ ] Define simplified 3-color palette (blue, purple, red)
  - [ ] Assign cursor color based on user index
- [ ] Create constants (`src/constants/colors.ts`)
  - [ ] Shape color palette (blue, purple, red)
  - [ ] Cursor color palette (blue, purple, red)
  - [ ] Selection colors
- [ ] Create Shape rendering component (`src/components/canvas/Shape.tsx`)
  - [ ] Render rectangle with fill color
  - [ ] Render selection border when selected
  - [ ] Render drag handles (optional for MVP)
- [ ] Create SelectionBox component (`src/components/canvas/SelectionBox.tsx`)
  - [ ] Render selection outline around shape
  - [ ] Show corner handles (visual only)
- [ ] Update Canvas component with shape logic
  - [ ] Add tool state (select vs rectangle creation)
  - [ ] Handle click to create rectangle
  - [ ] Handle click to select shape
  - [ ] Handle drag to move selected shape
  - [ ] Local state management for shapes
- [ ] Create Toolbar component (`src/components/toolbar/Toolbar.tsx`)
  - [ ] Layout toolbar with Tailwind
  - [ ] Add tool buttons container
- [ ] Create ToolButton component (`src/components/toolbar/ToolButton.tsx`)
  - [ ] Reusable button for tools
  - [ ] Show active state with Tailwind styles
  - [ ] Add icons (select pointer, rectangle)
- [ ] Add select tool to toolbar
- [ ] Add rectangle tool to toolbar
- [ ] Update CanvasRenderer to draw shapes
  - [ ] Loop through shapes and render each
  - [ ] Apply viewport culling
  - [ ] Highlight selected shape

**Files Created:**
- `src/lib/shape-utils.ts`
- `src/lib/color-utils.ts`
- `src/constants/colors.ts`
- `src/components/canvas/Shape.tsx`
- `src/components/canvas/SelectionBox.tsx`
- `src/components/toolbar/Toolbar.tsx`
- `src/components/toolbar/ToolButton.tsx`

**Testing:**
- [ ] Verify clicking rectangle tool activates creation mode
- [ ] Verify clicking canvas creates rectangle at click position
- [ ] Verify rectangle has default dimensions (100x100)
- [ ] Verify clicking shape selects it
- [ ] Verify selected shape shows selection border
- [ ] Verify dragging selected shape moves it
- [ ] Verify shapes render with correct colors from simplified palette
- [ ] Verify only one shape can be selected at a time
- [ ] Test with 100+ shapes to verify performance

---

### **PR #6: Real-Time Shape Synchronization**
**Branch:** `feat/realtime-shapes`  
**Description:** Connect shapes to Convex for real-time sync across users  
**Dependencies:** PR #5

#### Subtasks:
- [ ] Create shapes hook (`src/hooks/useShapes.ts`)
  - [ ] Subscribe to Convex `getShapes` query
  - [ ] Wrap Convex mutations (createShape, moveShape, deleteShape)
  - [ ] Implement optimistic updates for immediate feedback
  - [ ] Reconcile local optimistic state with server state
- [ ] Update Canvas component with Convex integration
  - [ ] Replace local shape state with `useShapes` hook
  - [ ] Call Convex mutations on shape creation
  - [ ] Call Convex mutations on shape movement
  - [ ] Call Convex mutations on shape deletion
  - [ ] Handle shape updates from other users
- [ ] Add authentication checks to mutations
  - [ ] Verify user is authenticated before allowing changes
  - [ ] Include user ID in shape metadata
- [ ] Add timestamp to shape operations
  - [ ] Track `createdAt` and `lastModified`
  - [ ] Display who created/modified shape (optional)
- [ ] Handle sync errors gracefully
  - [ ] Show error toast if mutation fails
  - [ ] Revert optimistic update on error
  - [ ] Add retry logic for transient failures

**Files Created:**
- `src/hooks/useShapes.ts`

**Testing:**
- [ ] Open two browser windows with different users
- [ ] Create shape in window 1 → verify it appears in window 2
- [ ] Move shape in window 1 → verify it moves in window 2
- [ ] Delete shape in window 1 → verify it disappears in window 2
- [ ] Measure sync latency (<100ms for shapes)
- [ ] Test with 5+ users simultaneously creating shapes
- [ ] Verify optimistic updates work (immediate local feedback)
- [ ] Test race condition: both users move same shape simultaneously
- [ ] Verify refresh preserves all shapes
- [ ] Test with network throttling (slow 3G)

---

### **PR #7: Multiplayer Cursors**
**Branch:** `feat/multiplayer-cursors`  
**Description:** Display real-time cursor positions for all connected users  
**Dependencies:** PR #6

#### Subtasks:
- [ ] Create presence types (`src/types/presence.ts`)
  - [ ] Define Presence interface
  - [ ] Define cursor position type
- [ ] Create presence hook (`src/hooks/usePresence.ts`)
  - [ ] Subscribe to Convex `getActiveUsers` query
  - [ ] Wrap presence mutations (updatePresence, joinCanvas, leaveCanvas)
  - [ ] Implement cursor position throttling (50ms)
- [ ] Create throttle hook (`src/hooks/useThrottle.ts`)
  - [ ] Custom throttle implementation (no external dependencies)
  - [ ] Configurable throttle delay
- [ ] Create MultiplayerCursor component (`src/components/canvas/MultiplayerCursor.tsx`)
  - [ ] Render cursor SVG at user position
  - [ ] Display user name label next to cursor
  - [ ] Apply user's assigned color from simplified palette
  - [ ] Transform cursor position based on viewport
  - [ ] Smooth cursor movement with CSS transitions
- [ ] Update Canvas component with cursor tracking
  - [ ] Track local cursor position on mousemove
  - [ ] Call throttled `updatePresence` mutation
  - [ ] Call `joinCanvas` on mount
  - [ ] Call `leaveCanvas` on unmount
  - [ ] Render MultiplayerCursor for each active user
- [ ] Add heartbeat mechanism
  - [ ] Update `lastActive` every 5 seconds
  - [ ] Use setInterval in useEffect
- [ ] Handle cleanup on page unload
  - [ ] Call `leaveCanvas` in beforeunload event
  - [ ] Best-effort cleanup (may not always fire)

**Files Created:**
- `src/types/presence.ts`
- `src/hooks/usePresence.ts`
- `src/hooks/useThrottle.ts`
- `src/components/canvas/MultiplayerCursor.tsx`

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
- [ ] Create UserAvatar component (`src/components/presence/UserAvatar.tsx`)
  - [ ] Display Clerk user avatar image
  - [ ] Fallback to initials if no avatar
  - [ ] Show online status indicator (green dot)
  - [ ] Apply user's cursor color as accent from simplified palette
- [ ] Create PresencePanel component (`src/components/presence/PresencePanel.tsx`)
  - [ ] Sidebar layout with Tailwind
  - [ ] List all active users from `usePresence` hook
  - [ ] Render UserAvatar for each user
  - [ ] Display user count ("3 users online")
  - [ ] Make collapsible (optional)
- [ ] Create shared UI components (`src/components/ui/`)
  - [ ] Button component with Tailwind variants
  - [ ] Avatar component (reusable)
  - [ ] Badge component for online status
- [ ] Integrate PresencePanel into dashboard layout
  - [ ] Position as left sidebar
  - [ ] Fixed position or absolute
  - [ ] Responsive: hide on mobile, show on desktop

**Files Created:**
- `src/components/presence/UserAvatar.tsx`
- `src/components/presence/PresencePanel.tsx`
- `src/components/ui/Button.tsx`
- `src/components/ui/Avatar.tsx`
- `src/components/ui/Badge.tsx`

**Testing:**
- [ ] Verify presence panel shows current user
- [ ] Open second browser window → verify both users appear
- [ ] Verify user count updates in real-time
- [ ] Verify avatars display correctly
- [ ] Verify online status indicator is visible
- [ ] Verify cursor colors from simplified palette match between panel and canvas
- [ ] Close window → verify user disappears from panel
- [ ] Test with 10+ users to verify UI scales

---

### **PR #9: Keyboard Shortcuts**
**Branch:** `feat/keyboard-shortcuts`  
**Description:** Implement keyboard shortcuts for tools and actions  
**Dependencies:** PR #8

#### Subtasks:
- [ ] Create keyboard constants (`src/constants/keyboard.ts`)
  - [ ] Map keys to tool names
  - [ ] Define shortcut descriptions
- [ ] Create keyboard hook (`src/hooks/useKeyboard.ts`)
  - [ ] Listen for keydown events globally
  - [ ] Check if input element is focused (skip if true)
  - [ ] Call appropriate handler based on key
  - [ ] Clean up event listeners on unmount
- [ ] Integrate keyboard shortcuts in Canvas component
  - [ ] 'R' key toggles rectangle tool
  - [ ] 'Escape' key activates select tool
  - [ ] 'Delete'/'Backspace' deletes selected shape
- [ ] Add visual feedback for active tool
  - [ ] Highlight active tool button in toolbar
  - [ ] Show cursor style based on active tool
  - [ ] Display shortcut hint in toolbar
- [ ] Create keyboard shortcuts help (optional)
  - [ ] Press '?' to show shortcuts modal
  - [ ] List all available shortcuts

**Files Created:**
- `src/constants/keyboard.ts`
- `src/hooks/useKeyboard.ts`

**Testing:**
- [ ] Verify 'R' key activates rectangle tool
- [ ] Verify 'R' key works when no input is focused
- [ ] Verify 'R' key does NOT trigger when typing in input field
- [ ] Verify 'Escape' exits creation mode
- [ ] Verify 'Delete' deletes selected shape
- [ ] Verify toolbar shows visual feedback for active tool
- [ ] Verify cursor changes based on active tool

---

### **PR #10: UI Polish & Final Integration**
**Branch:** `feat/ui-polish`  
**Description:** Final UI improvements, bug fixes, and deployment preparation  
**Dependencies:** PR #9

#### Subtasks:
- [ ] Improve dashboard layout
  - [ ] Refine top bar styling with Tailwind
  - [ ] Add app logo/name
  - [ ] Position toolbar in center of top bar
  - [ ] Position UserButton and zoom controls on right
- [ ] Add loading states
  - [ ] Show spinner while Convex data loads
  - [ ] Show skeleton for shapes being synced
  - [ ] Show loading for authentication
- [ ] Add error handling UI
  - [ ] Toast notifications for errors
  - [ ] Connection status indicator
  - [ ] Retry button for failed operations
- [ ] Improve canvas visual design
  - [ ] Add subtle grid background (optional)
  - [ ] Improve shape selection highlight
  - [ ] Add shadows to shapes (optional)
- [ ] Add visual feedback for tool states
  - [ ] Change cursor icon based on active tool
  - [ ] Show "crosshair" cursor in rectangle creation mode
  - [ ] Show "pointer" cursor in select mode
- [ ] Performance optimizations
  - [ ] Memoize expensive components with React.memo
  - [ ] Use useMemo for computed values
  - [ ] Use useCallback for event handlers
  - [ ] Verify 60 FPS with 500+ shapes
- [ ] Accessibility improvements
  - [ ] Add ARIA labels to buttons
  - [ ] Add keyboard navigation hints
  - [ ] Ensure color contrast meets WCAG AA
- [ ] Add meta tags for SEO
  - [ ] Title, description, Open Graph tags
  - [ ] Favicon
- [ ] Create comprehensive README
  - [ ] Setup instructions
  - [ ] Environment variable documentation
  - [ ] Deployment guide
  - [ ] Architecture overview
- [ ] Add development documentation
  - [ ] API documentation for Convex functions
  - [ ] Component documentation
  - [ ] Development workflow guide

**Files Created:**
- `src/components/ui/Spinner.tsx`
- `src/components/ui/Toast.tsx`
- `public/favicon.ico`
- `docs/API.md`
- `docs/DEVELOPMENT.md`

**Testing:**
- [ ] Complete full MVP testing checklist from PRD
- [ ] Test on multiple browsers (Chrome, Firefox, Safari)
- [ ] Test on mobile devices (responsive design)
- [ ] Test with slow network (throttling)
- [ ] Test with 5+ concurrent users
- [ ] Test with 500+ shapes on canvas
- [ ] Verify FPS stays at 60 during all interactions
- [ ] Verify sync latency <100ms for shapes, <50ms for cursors
- [ ] Test all keyboard shortcuts
- [ ] Test authentication flow (sign up, sign in, sign out)
- [ ] Test presence cleanup (stale cursors removed)

---

### **PR #11: Deployment & Production Setup**
**Branch:** `feat/deployment`  
**Description:** Deploy application to production and verify all features work  
**Dependencies:** PR #10

#### Subtasks:
- [ ] Configure Vercel deployment
  - [ ] Connect GitHub repository to Vercel
  - [ ] Configure build settings
  - [ ] Add environment variables in Vercel dashboard
  - [ ] Enable automatic deployments on push
- [ ] Deploy Convex to production
  - [ ] Run `bunx convex deploy`
  - [ ] Verify production Convex URL
  - [ ] Update environment variables with production URL
- [ ] Configure Clerk for production
  - [ ] Update Clerk allowed origins
  - [ ] Update redirect URLs
  - [ ] Test authentication in production
- [ ] Set up custom domain (optional)
  - [ ] Configure DNS records
  - [ ] Enable SSL certificate
  - [ ] Verify domain works
- [ ] Production testing
  - [ ] Test all features on deployed app
  - [ ] Test with multiple users from different locations
  - [ ] Monitor for errors in Vercel logs
  - [ ] Monitor Convex function performance
- [ ] Set up monitoring (optional)
  - [ ] Add error tracking (Sentry)
  - [ ] Add analytics (Vercel Analytics)
  - [ ] Set up uptime monitoring
- [ ] Create deployment documentation
  - [ ] Document deployment process
  - [ ] Document rollback procedure
  - [ ] Document environment variables

**Files Created:**
- `vercel.json` (if custom config needed)
- `docs/DEPLOYMENT.md`

**Testing:**
- [ ] Verify app is accessible via public URL
- [ ] Test complete user flow on production
- [ ] Test with 5+ users on production
- [ ] Verify all environment variables are set correctly
- [ ] Verify Clerk authentication works in production
- [ ] Verify Convex sync works in production
- [ ] Test from different devices and networks
- [ ] Verify HTTPS is enabled
- [ ] Check for any console errors

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
- [ ] PR #7: Multiplayer Cursors ✅
- [ ] PR #8: Presence Panel ✅

### Enhancement & Deploy
- [ ] PR #9: Keyboard Shortcuts ✅
- [ ] PR #10: UI Polish ✅
- [ ] PR #11: Deployment ✅

### MVP Checkpoint
- [ ] All 8 MVP requirements met
- [ ] App deployed and publicly accessible
- [ ] Demo video recorded
- [ ] AI Development Log completed

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
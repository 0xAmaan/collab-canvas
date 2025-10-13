# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

CollabCanvas is a real-time collaborative canvas application that allows multiple users to create and manipulate shapes together in a shared workspace. Built with modern web technologies, it demonstrates bulletproof multiplayer functionality with <100ms sync latency.

**Key Features:**
- Real-time collaborative drawing with rectangles
- Multiplayer cursors with user presence
- Pan/zoom canvas with viewport persistence
- Authentication and user management
- Keyboard shortcuts for productivity

## Tech Stack & Architecture

### Core Technologies
- **Frontend**: Next.js 15+ (App Router), React 19, TypeScript
- **Backend**: Convex (real-time database + serverless functions)
- **Authentication**: Clerk
- **Canvas**: Fabric.js for high-performance rendering
- **Styling**: Tailwind CSS 4.1+
- **Package Manager**: Bun (required for all commands)

### Architecture Pattern
The application follows a real-time collaborative architecture:

```
Client (Browser) → Convex Mutations → Database → Convex Subscriptions → All Clients
```

**State Synchronization:**
- Optimistic updates for immediate feedback
- Server reconciliation with "last write wins" conflict resolution
- Throttled cursor updates (50ms) for performance
- Background cleanup of stale presence records

## Getting Started

### Prerequisites
- Node.js 18+
- [Bun](https://bun.sh) package manager
- Convex account (free tier)
- Clerk account (free tier)

### Installation & Setup

1. **Install dependencies** (always use Bun):
   ```bash
   bun install
   ```

2. **Set up Convex backend**:
   ```bash
   bunx convex dev
   ```
   This opens your browser to create/link a Convex project and provides the `NEXT_PUBLIC_CONVEX_URL`.

3. **Set up Clerk authentication**:
   - Go to [dashboard.clerk.com](https://dashboard.clerk.com)
   - Create a new application
   - Copy the API keys

4. **Configure environment variables**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your actual keys
   ```

5. **Run development servers**:
   ```bash
   # Terminal 1: Next.js frontend
   bun run dev --turbopack
   
   # Terminal 2: Convex backend
   bunx convex dev
   ```

### Environment Variables
Required in `.env.local`:
```env
# Convex
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
```

## Development Commands

Always use Bun for package management and script execution:

```bash
# Development
bun run dev --turbopack    # Start development server with Turbo
bunx convex dev           # Start Convex backend in dev mode

# Build & Production
bun run build             # Build application with Turbo
bun run start             # Start production server

# Quality Assurance
bun run lint              # Run Next.js linting
```

## Repository Structure

```
collab-canvas/
├── .cursor/              # Cursor AI rules and configuration
├── app/                  # Next.js App Router pages
│   ├── layout.tsx        # Root layout with Clerk provider
│   ├── page.tsx          # Landing page with authentication
│   └── globals.css       # Global styles with Tailwind
├── convex/               # Backend functions and schema (to be created)
│   ├── schema.ts         # Database schema (shapes, presence)
│   ├── shapes.ts         # Shape queries and mutations
│   ├── presence.ts       # User presence and cursors
│   └── crons.ts          # Background cleanup jobs
├── context/              # Project documentation
│   ├── architecture.md   # Detailed system architecture
│   ├── prd.md           # Product requirements document
│   └── tasklist.md      # Development task breakdown
├── public/              # Static assets
└── package.json         # Bun-based dependencies and scripts
```

## Core Architectural Concepts

### Real-Time Canvas System
- **Fabric.js Integration**: Object-based canvas manipulation with built-in selection and dragging
- **Viewport Management**: Client-side pan/zoom with coordinate transformations
- **Shape Synchronization**: State-based sync with optimistic updates
- **Performance**: Viewport culling and 60 FPS rendering target

### Authentication & Security
- **Clerk Integration**: Drop-in authentication with social login support
- **Convex Auth**: JWT token validation on all mutations
- **Route Protection**: Middleware-based authentication for `/dashboard`

### Database Schema (Planned)
```typescript
// Shapes table
{
  type: "rectangle",      // Only rectangles in MVP
  x: number, y: number,   // Position
  width: number, height: number,
  fillColor: string,      // Hex color
  createdBy: string,      // Clerk user ID
  lastModified: number    // Timestamp
}

// Presence table  
{
  userId: string,         // Clerk user ID
  userName: string,
  cursorX: number, cursorY: number,
  cursorColor: string,    // Blue, purple, or red
  lastActive: number      // For cleanup
}
```

## Development Workflow

### Code Style (Per Project Rules)
- **Always use arrow functions** - no function declarations
- **Minimize TypeScript complexity** - prefer simple types over interfaces when sufficient
- **Start simple** - only add complexity if the simple solution doesn't work
- **Bun for all commands** - never use npm or yarn

### Naming Conventions
- Files: `camelCase.tsx` or `kebab-case/` for directories
- Components: PascalCase with arrow functions
- Hooks: `useCustomHook` pattern
- Constants: `UPPER_SNAKE_CASE`

### Branch Strategy
- `main` - Production-ready code
- `feat/feature-name` - New features
- `fix/bug-description` - Bug fixes

### Commit Messages
Use conventional commits:
```
feat(canvas): implement real-time shape synchronization
fix(presence): prevent duplicate cursor rendering
docs(readme): update setup instructions
```

## Key Implementation Patterns

### Optimistic Updates Pattern
```typescript
const moveShape = useMutation(api.shapes.move);

// Update local state immediately, then sync
const handleShapeMove = async (id: string, x: number, y: number) => {
  // Optimistic update
  updateLocalShape(id, { x, y });
  
  try {
    await moveShape({ id, x, y });
  } catch (error) {
    // Revert on failure
    revertLocalShape(id);
  }
};
```

### Throttled Cursor Updates
```typescript
const throttledCursorUpdate = useThrottle((x, y) => {
  updateCursor({ x, y });
}, 50); // 50ms throttle
```

## Testing Strategy

### Manual Testing Checklist
- Open multiple browser windows to test real-time sync
- Verify shape creation/movement syncs within 100ms
- Test cursor updates sync within 50ms
- Verify presence cleanup (users disappear when disconnected)
- Test keyboard shortcuts ('R' for rectangle, 'Escape' to exit)
- Verify viewport persists on page refresh

### Performance Targets
- **60 FPS** during pan/zoom operations
- **<100ms** sync latency for shapes
- **<50ms** sync latency for cursors
- **5+ concurrent users** without degradation
- **500+ shapes** without FPS drops

## Deployment

### Production Setup
1. **Vercel Frontend**:
   ```bash
   # Connect GitHub repo to Vercel
   # Set environment variables in Vercel dashboard
   # Enable automatic deployments
   ```

2. **Convex Backend**:
   ```bash
   bunx convex deploy --prod
   # Update NEXT_PUBLIC_CONVEX_URL with production URL
   ```

3. **Clerk Configuration**:
   - Update allowed origins in Clerk dashboard
   - Configure redirect URLs for production domain

## Future Development Guidance

### Planned Features (Post-MVP)
- Additional shape types (circles, text)
- Shape resize handles and rotation
- Undo/redo functionality
- Color picker for custom colors
- Multi-select and grouping
- Per-user canvases/projects

### For Future WARP Agents

**Critical Rules to Follow:**
1. **Always use Bun** for package management and script execution
2. **Use arrow functions everywhere** - avoid function declarations
3. **Keep TypeScript simple** - don't over-engineer types/interfaces
4. **Start with simple solutions** and only add complexity if needed
5. **Test real-time features** with multiple browser windows

**When Making Changes:**
- Update this WARP.md if you add new architectural concepts
- Follow the established patterns for Convex mutations/queries
- Maintain the simplified 3-color palette (blue, purple, red) for consistency
- Test multiplayer functionality thoroughly before deploying
- Ensure 60 FPS performance is maintained

**Architecture Constraints:**
- Single shared canvas model (no per-user canvases in MVP)
- "Last write wins" conflict resolution (acceptable for shapes)
- Client-side viewport management (stored in localStorage)
- State-based sync (not operational transforms)

### Common Gotchas
- **Coordinate Systems**: Canvas coordinates vs. screen coordinates require transformation
- **Cursor Throttling**: Too frequent updates will overwhelm the network
- **Presence Cleanup**: Handle ungraceful disconnects with background jobs
- **Authentication**: All Convex mutations must validate user authentication
- **Performance**: Large shape counts require viewport culling

## References

- [Convex Documentation](https://docs.convex.dev)
- [Clerk Next.js Setup](https://clerk.com/docs/quickstarts/nextjs)
- [Fabric.js Documentation](http://fabricjs.com/docs/)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

This WARP.md was created to provide comprehensive guidance for the CollabCanvas collaborative drawing application. Keep it updated as the codebase evolves!
# CollabCanvas

A real-time collaborative canvas application for creative teams. Built with Next.js 15, Convex, and Fabric.js.

<div align="center">

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Convex](https://img.shields.io/badge/Convex-Real--time-orange?style=flat)](https://convex.dev/)

</div>

## ✨ Features

### 🎨 Canvas Tools
- **Selection Tool** - Select, move, resize, and rotate shapes
- **Shape Creation** - Rectangles, circles, ellipses, lines, polygons
- **Text Tool** - Add and edit text with auto-save
- **Pencil Tool** - Free-form drawing
- **Hand Tool** - Pan around the canvas

### 👥 Multiplayer
- **Real-time Cursors** - See where others are working
- **Live Presence** - Know who's online
- **Instant Sync** - Changes propagate in <100ms
- **Cursor Throttling** - Optimized for performance

### 🛠️ Advanced Features
- **Undo/Redo** - Full command history (Cmd+Z / Cmd+Shift+Z)
- **Copy/Paste** - Duplicate shapes (Cmd+C / Cmd+V)
- **Alt+Drag** - Quick duplicate or pan
- **Multi-Select** - Select and manipulate multiple shapes
- **Layer Management** - Reorder shapes (Cmd+[ / Cmd+])
- **Export** - Save as PNG or SVG
- **Keyboard Shortcuts** - Efficient workflows
- **Project Management** - Organize multiple canvases
- **AI Assistant** - Natural language canvas commands

### 🎯 UI/UX
- **Zoom Controls** - 10% to 400% with smooth transitions
- **Viewport Persistence** - Remember your position
- **Color Picker** - Full HSL/RGB with recent colors
- **Properties Panel** - Fine-tune shape attributes
- **Layers Panel** - Visual hierarchy management
- **Responsive Design** - Works on desktop and tablet

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+
- **Bun** ([install here](https://bun.sh))
- **Convex** account ([sign up](https://convex.dev))
- **Clerk** account ([sign up](https://clerk.com))

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <your-repo-url>
   cd collab-canvas
   bun install
   ```

2. **Set up Convex:**
   ```bash
   bunx convex dev
   ```
   Follow the prompts to create a project and copy the `NEXT_PUBLIC_CONVEX_URL`.

3. **Set up Clerk:**
   - Create an application at [dashboard.clerk.com](https://dashboard.clerk.com)
   - Copy your publishable key and secret key

4. **Configure environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local`:
   ```env
   NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
   CLERK_SECRET_KEY=sk_test_xxxxx
   OPENAI_API_KEY=sk-xxxxx  # Optional: for AI assistant
   ```

5. **Start development:**
   ```bash
   bun run dev
   ```
   Open [http://localhost:3000](http://localhost:3000)

## 🎮 Usage

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `V` | Select tool |
| `H` | Hand tool (pan) |
| `R` | Rectangle |
| `C` | Circle |
| `L` | Line |
| `P` | Polygon |
| `T` | Text |
| `D` | Pencil |
| `Cmd+Z` | Undo |
| `Cmd+Shift+Z` | Redo |
| `Cmd+C` | Copy |
| `Cmd+V` | Paste |
| `Cmd+D` | Duplicate |
| `Delete` | Delete selected |
| `Cmd+[` | Send backward |
| `Cmd+]` | Bring forward |
| `Cmd+Shift+[` | Send to back |
| `Cmd+Shift+]` | Bring to front |
| `Alt+Drag` | Duplicate shape or pan |
| `Space+Drag` | Pan canvas |
| `Cmd+/` | Show shortcuts |

### AI Assistant (Optional)

If you've set up an OpenAI API key, you can use natural language commands:

- "Create a red circle at 500, 500"
- "Add a blue rectangle"
- "Change the color to green"
- "Arrange all shapes in a row"

## 🏗️ Tech Stack

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript
- **Canvas:** Fabric.js 6 - High-performance 2D rendering
- **Backend:** Convex - Real-time database with automatic subscriptions
- **Auth:** Clerk - User authentication and management
- **Styling:** Tailwind CSS v4
- **AI:** OpenAI GPT-4o-mini (optional)
- **Package Manager:** Bun

## 📁 Project Structure

```
app/                      # Next.js App Router
├── dashboard/           # Main canvas page
├── projects/            # Project management
└── api/ai/             # AI assistant endpoints

components/
├── canvas/             # Canvas and tools
│   ├── tools/         # Tool strategy pattern
│   ├── shapes/        # Shape creation system
│   └── state/         # Centralized state
├── toolbar/           # Bottom toolbar
├── properties/        # Right sidebar panels
├── layers/            # Layer management
├── presence/          # Multiplayer presence
└── ui/                # Reusable UI components

convex/                # Backend (Convex)
├── schema.ts          # Database schema
├── shapes.ts          # Shape operations
├── presence.ts        # Presence management
├── projects.ts        # Project CRUD
└── crons.ts           # Background jobs

hooks/                 # React hooks
├── useShapes.ts       # Real-time shape sync
├── usePresence.ts     # Multiplayer presence
├── useKeyboard.ts     # Keyboard shortcuts
├── useHistory.ts      # Undo/redo
└── useClipboard.ts    # Copy/paste

lib/                   # Utilities
├── canvas/            # Canvas utilities
├── commands/          # Command pattern (undo/redo)
└── ai/                # AI integration

types/                 # TypeScript types
constants/             # Configuration
```

## 🧪 Testing

### Convex Database Tests
```bash
bun run test:convex
```

### Manual Testing
1. Open two browser windows
2. Sign in with different accounts
3. Create/move shapes in one window
4. Verify real-time sync in the other window

## 🔧 Development

### Available Scripts

```bash
bun run dev              # Start Next.js dev server
bunx convex dev          # Start Convex backend (separate terminal)
bun run build            # Build for production
bun run start            # Start production server
bun run test:convex      # Run database tests
```

### Architecture Highlights

#### Tool Strategy Pattern
Each canvas tool is isolated in its own hook, making the codebase maintainable:
- `useSelectTool` - Selection and manipulation
- `useHandTool` - Canvas panning
- `useShapeCreationTool` - Generic shape creation
- `useTextTool` - Text editing
- `usePolygonTool` - Multi-click polygons
- `usePencilTool` - Free drawing

#### Real-Time Sync
Convex provides automatic real-time subscriptions:
```typescript
const shapes = useQuery(api.shapes.getShapes); // Auto-updates
const createShape = useMutation(api.shapes.createShape);
```

#### Performance Optimizations
- Throttled cursor updates (50ms)
- Batch rendering for bulk updates
- Viewport culling via Fabric.js
- Optimistic UI updates
- Mutable state for internal tracking

## 📝 Documentation

- [CLAUDE.md](./CLAUDE.md) - Detailed architecture and development guide
- [CollabCanvas Rubric.md](./CollabCanvas%20Rubric.md) - Feature requirements
- [discussions-and-future-features/](./discussions-and-future-features/) - Future plans and technical discussions

## 📄 License

MIT

---

Built with ❤️ using Next.js, Convex, and Fabric.js

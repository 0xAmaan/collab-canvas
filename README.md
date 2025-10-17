# CollabCanvas MVP

A real-time collaborative canvas with multiplayer features built with Next.js, Convex, and Clerk.

## Features

### ✅ Implemented (PR #1-4)
- 🔐 Authentication with Clerk
- 🗄️ Convex database with shapes and presence schemas
- 🎨 Canvas with pan/zoom (5000x5000px workspace)
- ⚡ Built with Fabric.js for high-performance rendering
- 🔍 Zoom controls (10% - 400%)
- 💾 Viewport persistence

### 🚧 Coming Soon (PR #5-8)
- 📦 Rectangle shape creation and manipulation
- 🔄 Real-time synchronization between users (<100ms)
- 👥 Multiplayer cursors with name labels
- 👤 User presence awareness

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), React 18, TypeScript
- **Backend**: Convex (real-time database + backend functions)
- **Auth**: Clerk
- **Canvas**: Fabric.js
- **Styling**: Tailwind CSS
- **Package Manager**: Bun

## Setup Instructions

### Prerequisites

- Node.js 18+
- [Bun](https://bun.sh) package manager
- [Convex](https://convex.dev) account (free tier)
- [Clerk](https://clerk.com) account (free tier)

### Installation

1. **Install dependencies** (if not already done):
   ```bash
   bun install
   ```

2. **Set up Convex**:
   ```bash
   bunx convex dev
   ```
   - This will open your browser to create/link a Convex project
   - Copy the `NEXT_PUBLIC_CONVEX_URL` to `.env.local`

3. **Set up Clerk**:
   - Go to [dashboard.clerk.com](https://dashboard.clerk.com)
   - Create a new application
   - Copy the API keys to `.env.local`:
     - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
     - `CLERK_SECRET_KEY`

4. **Configure environment variables**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your actual keys
   ```

5. **Run the development server**:
   ```bash
   bun run dev
   ```

6. **In a separate terminal, run Convex dev**:
   ```bash
   bunx convex dev
   ```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

## AI Canvas Agent Setup

The AI Canvas Agent allows you to create and manipulate shapes using natural language commands.

1. **Get an OpenAI API key**:
   - Go to [platform.openai.com](https://platform.openai.com)
   - Create an API key

2. **Add to environment variables**:
   ```bash
   # Add to .env.local
   OPENAI_API_KEY=sk-xxxxx
   ```

3. **Restart the development server** for changes to take effect.

### Test Commands

Try these natural language commands in the AI input at the bottom of the canvas:

1. "Create a red circle at position 500, 500"
2. "Add a blue rectangle at 700, 500"
3. "Create text that says Hello World at 600, 400"
4. "Change the color of the red circle to green"
5. "Arrange all shapes in a horizontal row"

The AI agent uses GPT-4o-mini for fast responses and supports:
- Creating rectangles, circles, and text
- Updating shape properties (color, position, size)
- Arranging shapes in layouts (horizontal row, vertical column)

## Environment Variables

Create a `.env.local` file with the following variables:

```env
# Convex
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx

# OpenAI (for AI Canvas Agent)
OPENAI_API_KEY=sk-xxxxx
```

## Development

- `bun run dev` - Start Next.js development server
- `bunx convex dev` - Start Convex backend in development mode
- `bun run build` - Build for production
- `bun run start` - Start production server
- `bun run lint` - Run ESLint

## Testing

### Automated Database Tests

Run the test script to verify Convex mutations and queries:

```bash
bun run test:convex
```

> **Note:** Make sure your `.env.local` file has `NEXT_PUBLIC_CONVEX_URL` set. The test file may show TypeScript linter warnings, but the script will run correctly. These warnings are expected for string-based API calls.

This will test:
- ✅ Shape queries and mutations
- ✅ Presence queries and mutations
- ✅ Authentication requirements
- ✅ Schema validation
- ✅ Cron job configuration

### Manual Testing in Convex Dashboard

1. Go to [dashboard.convex.dev](https://dashboard.convex.dev)
2. Navigate to your project → **Functions** tab
3. Test individual mutations:
   - `shapes:createShape` - Create rectangles
   - `shapes:moveShape` - Move shapes
   - `shapes:updateShape` - Update properties
   - `shapes:deleteShape` - Delete shapes
   - `presence:joinCanvas` - Join canvas
   - `presence:updatePresence` - Update cursor
   - `presence:heartbeat` - Heartbeat ping
   - `presence:leaveCanvas` - Leave canvas

4. Check **Logs** tab to verify:
   - Cron job runs every 10 seconds
   - Look for "Cleaned up X stale presence record(s)" messages

### Real-Time Sync Testing

1. Open two browser windows at `http://localhost:3000/dashboard`
2. Sign in with different accounts in each window
3. Create/move shapes in one window
4. Verify they appear in the other window (<100ms latency)
5. Move your cursor and verify it appears in the other window

## Current Implementation Status

**Completed Pull Requests:**
- ✅ **PR #1**: Project Setup & Configuration
- ✅ **PR #2**: Authentication & Route Structure
- ✅ **PR #3**: Database Schema & Convex Setup
- ✅ **PR #4**: Canvas Infrastructure - Viewport & Rendering

**Next Up:**
- 🔜 **PR #5**: Shape Creation & Local Manipulation
- 🔜 **PR #6**: Real-Time Shape Synchronization
- 🔜 **PR #7**: Multiplayer Cursors
- 🔜 **PR #8**: Presence Panel & User List

See [CANVAS_IMPLEMENTATION.md](./CANVAS_IMPLEMENTATION.md) for detailed PR #4 documentation.

## Canvas Features (PR #4)

### Pan
- Hold `Alt` key and drag
- Or click empty canvas space and drag

### Zoom
- Use mouse wheel (10% - 400% range)
- Click zoom in/out buttons in toolbar
- Click percentage to reset to 100%

### Persistence
- Viewport position and zoom level persist across page refreshes
- Stored in browser localStorage

## Project Structure
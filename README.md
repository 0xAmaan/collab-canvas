# CollabCanvas MVP

A real-time collaborative canvas with multiplayer features built with Next.js, Convex, and Clerk.

## Features

- 🎨 Canvas with pan/zoom (5000x5000px workspace)
- 📦 Rectangle shape creation and manipulation
- 🔄 Real-time synchronization between users (<100ms)
- 👥 Multiplayer cursors with name labels
- 👤 User presence awareness
- 🔐 Authentication with Clerk
- ⚡ Built with Fabric.js for high-performance rendering

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

## Environment Variables

Create a `.env.local` file with the following variables:

```env
# Convex
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
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

## Project Structure
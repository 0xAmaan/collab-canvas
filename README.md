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

## Project Structure
# Convex + Clerk Setup Instructions

## Required Environment Variable

You need to add one more environment variable to your `.env` file for Convex to authenticate with Clerk:

### Getting Your Clerk JWT Issuer Domain

1. Go to your [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application
3. Navigate to **Configure** → **JWT Templates**
4. Click on **"Convex"** template (or create one if it doesn't exist)
5. You'll see the **Issuer** field - copy this value

### Example Issuer Domain

It will look something like:
```
https://your-app-name.clerk.accounts.dev
```

### Add to .env

Add this line to your `.env` file:

```bash
CLERK_JWT_ISSUER_DOMAIN=https://your-app-name.clerk.accounts.dev
```

**Note:** Remove `https://` if the domain value doesn't work - just use:
```bash
CLERK_JWT_ISSUER_DOMAIN=your-app-name.clerk.accounts.dev
```

## Verifying the Setup

After adding the environment variable:

1. Restart your Convex dev server: `bunx convex dev`
2. Restart your Next.js dev server: `bun run dev`
3. Visit `http://localhost:3000`
4. Sign in and navigate to `/dashboard`
5. Check the Convex dashboard - you should see your `auth.config.ts` file recognized

## What This Does

The `convex/auth.config.ts` file tells Convex:
- How to verify JWT tokens from Clerk
- That users authenticated by Clerk are valid
- Enables `ctx.auth.getUserIdentity()` in Convex mutations/queries

Without this setup, Convex won't know who's authenticated and all auth-protected queries will fail.

## Testing Authentication

Once configured, you can test auth in Convex functions:

```typescript
// Example: convex/shapes.ts
import { mutation } from "./_generated/server";

export const createShape = mutation({
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    console.log("User ID:", identity.subject);
    // Now you can create shapes with the user's ID
  }
});
```

## Troubleshooting

**Issue:** "Unauthenticated" errors in Convex
- **Solution:** Make sure `CLERK_JWT_ISSUER_DOMAIN` is set correctly in `.env`
- Restart both dev servers

**Issue:** Convex doesn't recognize auth.config.ts
- **Solution:** Make sure the file is at `convex/auth.config.ts` (not in a subfolder)
- Check that Convex dev is running and detected the file

**Issue:** JWT verification fails
- **Solution:** Double-check the issuer domain matches exactly what's in Clerk dashboard
- Try with and without `https://` prefix


# Fix: Convex getProject Server Error

## Problem

In production, users encountered this error:
```
Uncaught Error: [CONVEX Q(projects:getProject)] [Request ID: 132045a9cffb3269] Server Error
Called by client
```

This cryptic "Server Error" was thrown when the `getProject` query failed, causing the React component to crash.

## Root Cause

The issue was in `convex/projects.ts` in the `getProject` query handler:

```typescript
export const getProject = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const { project, isOwner } = await checkProjectAccess(ctx, args.projectId);
    return { ...project, isOwner };
  },
});
```

The `checkProjectAccess` helper function throws errors in several scenarios:
1. **Project not found** - The project was deleted or the ID is invalid
2. **User not authenticated** - JWT verification failed or user session expired
3. **No access** - User tried to access a private project they don't own

When these errors were thrown, Convex wrapped them as generic "Server Error" messages, which:
- Provided no useful debugging information
- Crashed the client-side React component
- Made it impossible to gracefully handle these expected error cases

## Why It Happened in Production

Several scenarios can trigger this:

1. **Stale Links**: User bookmarked a project URL, then the project was deleted
2. **Shared Links**: User received a link to a private project they can't access
3. **Auth Timing**: Race condition where the query runs before Clerk auth is fully initialized
4. **Session Expiry**: User's JWT token expired mid-session
5. **Invalid Project ID**: Malformed or corrupted project ID in URL

## Solution

### 1. Query Handler Error Handling

Modified `getProject` to catch errors and return `null` instead of throwing:

```typescript
export const getProject = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    try {
      const { project, isOwner } = await checkProjectAccess(ctx, args.projectId);
      return { ...project, isOwner };
    } catch (error: any) {
      // Log the error for debugging but don't throw to client
      console.error("getProject error:", error.message);
      
      // Return null instead of throwing - allows client to handle gracefully
      // This prevents "Server Error" in production
      return null;
    }
  },
});
```

**Benefits:**
- No more cryptic "Server Error" crashes
- Client can distinguish between loading (`undefined`) and error (`null`)
- Error is logged server-side for debugging
- Graceful degradation for users

### 2. Client-Side Error Handling

Updated `DashboardClient.tsx` to handle the three states:

```typescript
// project === undefined means loading (Convex query in progress)
if (project === undefined) {
  return <LoadingScreen />;
}

// project === null means error (project not found or no access)
if (project === null) {
  return <ErrorScreen />;
}

// project is valid object - render dashboard
return <Dashboard />;
```

This provides:
- Clear loading state while query executes
- User-friendly error message with "Back to Projects" link
- Clean separation of concerns

### 3. Hook Enhancement

Enhanced `useProject` hook to expose error state:

```typescript
return {
  project,
  updateProject,
  deleteProject,
  duplicateProject,
  updateThumbnail,
  isLoading: project === undefined,  // Query in progress
  hasError: project === null,        // Query returned null (error)
};
```

## Testing Scenarios

To verify the fix works, test these scenarios:

1. **Invalid Project ID**: Navigate to `/projects/invalid-id`
   - Should show "Project not found" instead of crashing
   
2. **Deleted Project**: Open a project, delete it, refresh the page
   - Should gracefully redirect to projects list
   
3. **Private Project Access**: Share a private project link with another user
   - Should show "Access denied" instead of crashing
   
4. **Slow Network**: Test on throttled connection
   - Should show loading state, not crash
   
5. **Auth Expiry**: Wait for JWT to expire, refresh page
   - Should handle gracefully, potentially redirect to login

## Migration Notes

This is a **non-breaking change**:
- Existing code continues to work
- Only affects error handling behavior
- No database migrations needed
- No API changes to other queries/mutations

## Best Practice Takeaway

**Always handle errors gracefully in Convex queries used by UI components:**

✅ **Do:**
```typescript
export const getSomething = query({
  handler: async (ctx, args) => {
    try {
      // ... query logic
      return result;
    } catch (error) {
      console.error("getSomething error:", error);
      return null; // or throw with specific message
    }
  },
});
```

❌ **Don't:**
```typescript
export const getSomething = query({
  handler: async (ctx, args) => {
    // Let errors bubble up as "Server Error"
    return await someThingThatMightFail();
  },
});
```

## Future Improvements

Consider implementing:

1. **Typed Error Returns**: Return `{ data: T | null, error: string | null }` instead of just `null`
2. **Retry Logic**: Add exponential backoff for transient failures
3. **Error Monitoring**: Integrate Sentry or similar for production error tracking
4. **Better Auth Flow**: Add auth loading state to prevent race conditions
5. **Audit Other Queries**: Apply same pattern to `getMyProjects`, `getPublicProjects`, etc.

## Files Modified

- `convex/projects.ts` - Added try/catch to `getProject` and `getMyProjects` queries
- `convex/shapes.ts` - Added try/catch to `getShapes` and `getShape` queries
- `app/dashboard/DashboardClient.tsx` - Added null handling and error UI
- `hooks/useProject.ts` - Added `hasError` return value

## Additional Fixes Applied

The same error handling pattern was applied to other queries that had similar issues:

### convex/projects.ts - getMyProjects

**Issue**: Threw "Not authenticated" error during race condition when page loads before Clerk auth initializes

**Fix**: Now returns an empty array `[]` instead of throwing when:
- User not yet authenticated (auth initializing)
- Auth verification fails
- JWT token issues

**Benefit**: Projects list page loads gracefully instead of crashing during auth initialization

### convex/shapes.ts

**getShapes query**: Now returns an empty array `[]` instead of throwing when:
- Project not found
- User lacks access to private project
- Auth verification fails

**getShape query**: Now returns `null` instead of throwing when:
- Shape not found
- User lacks access to shape's project
- Auth verification fails

This ensures that the canvas can gracefully render an empty state instead of crashing when shapes can't be loaded.


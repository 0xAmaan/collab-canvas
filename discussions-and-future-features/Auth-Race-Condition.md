# Auth Race Condition Fix

## The Problem

When a user navigates to `/projects`, there's a race condition between server-side auth and client-side Convex queries:

```
Timeline of Events (BEFORE FIX):

1. [Server] User requests /projects
2. [Server] Clerk auth check passes ✓
3. [Server] Page renders and sends HTML to client
4. [Client] React hydrates and ProjectsClient mounts
5. [Client] useProjects() hook triggers getMyProjects query
6. [Client] Convex query executes...
   ❌ BUT Clerk hasn't synced JWT to Convex yet!
7. [Convex] ctx.auth.getUserIdentity() returns null
8. [Convex] Query throws "Not authenticated"
9. [Client] React crashes with "Server Error"
```

## Why This Happens

### Server-Side Auth (Fast)
- Next.js server checks auth via cookies
- User has valid session cookie
- Auth check passes instantly
- Page is allowed to render

### Client-Side Auth (Slower)
1. Page loads in browser
2. Clerk client initializes
3. Clerk fetches JWT token
4. Clerk sends JWT to Convex
5. Convex can now verify user identity

**The Gap**: Steps 2-4 take ~100-500ms, but React queries run immediately on mount.

## The Solution

### Before: Throwing Error

```typescript
export const getMyProjects = query({
  handler: async (ctx) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      throw new Error("Not authenticated"); // ❌ Crashes client
    }
    // ... rest of query
  },
});
```

### After: Graceful Fallback

```typescript
export const getMyProjects = query({
  handler: async (ctx) => {
    try {
      const user = await ctx.auth.getUserIdentity();
      if (!user) {
        // ✅ Return empty array, allow auth to initialize
        console.log("getMyProjects: User not authenticated, returning empty array");
        return [];
      }
      // ... rest of query
    } catch (error: any) {
      console.error("getMyProjects error:", error.message);
      return []; // ✅ Always return valid data structure
    }
  },
});
```

## Timeline After Fix

```
Timeline of Events (AFTER FIX):

1. [Server] User requests /projects
2. [Server] Clerk auth check passes ✓
3. [Server] Page renders and sends HTML to client
4. [Client] React hydrates and ProjectsClient mounts
5. [Client] useProjects() hook triggers getMyProjects query
6. [Convex] ctx.auth.getUserIdentity() returns null
7. [Convex] Query returns [] (empty array) ✅
8. [Client] Page renders with "No projects yet" state
9. [Client] Clerk finishes auth initialization (100-500ms later)
10. [Convex] Query re-runs automatically (Convex reactivity)
11. [Convex] ctx.auth.getUserIdentity() now returns user
12. [Convex] Query returns actual projects
13. [Client] Page updates with projects list ✅
```

## User Experience

### Before Fix
- Page crashes with cryptic error
- User sees blank screen or error boundary
- Must refresh to try again
- Poor first impression

### After Fix
- Page loads instantly
- Brief "empty" state (< 500ms)
- Projects smoothly appear as auth completes
- Feels fast and polished

## Why Empty Array Is Safe

1. **Type Safe**: `useProjects` expects `Project[]`, gets `[]` - valid
2. **UI Safe**: ProjectsClient handles empty array correctly - shows "No projects yet"
3. **Reactive**: Convex automatically re-queries when auth state changes
4. **No Flash**: Empty state only shows for ~100-500ms, barely noticeable

## Alternative Approaches Considered

### ❌ Option 1: Add Loading State to Query
```typescript
if (!user) {
  return { loading: true, projects: [] };
}
```
**Problem**: Changes return type, breaks existing code

### ❌ Option 2: Delay Query Until Auth Ready
```typescript
const projects = useQuery(
  api.projects.getMyProjects,
  authReady ? undefined : "skip"
);
```
**Problem**: Requires tracking auth state in every component

### ✅ Option 3: Return Empty Array (Chosen)
```typescript
if (!user) {
  return [];
}
```
**Benefits**:
- No API changes
- No client-side changes needed
- Convex reactivity handles retry automatically
- Graceful degradation

## Testing the Fix

### Test 1: Cold Load
1. Clear all cookies/local storage
2. Navigate to `/projects`
3. Should see brief loading, then projects appear
4. No errors in console

### Test 2: Hot Reload
1. On projects page, trigger hot reload (save a file)
2. Should seamlessly reload
3. No auth errors

### Test 3: Slow Network
1. Enable network throttling (Slow 3G)
2. Navigate to `/projects`
3. Should show loading state gracefully
4. Projects appear once loaded

### Test 4: Auth Expiry
1. Stay on projects page for extended time
2. Let JWT expire
3. Trigger re-query (refresh or wait for reactivity)
4. Should handle gracefully, potentially redirect to login

## Related Issues

This same pattern should be applied to other auth-dependent queries:
- ✅ `getMyProjects` - Fixed
- ✅ `getProject` - Fixed (different error case)
- ✅ `getShapes` - Fixed
- ✅ `getShape` - Fixed
- ⏳ `getActiveUsers` - Check if needed
- ⏳ `getUserPresence` - Check if needed

## Monitoring

Watch for these logs in production:

```
✓ Normal: "getMyProjects: User not authenticated, returning empty array"
  This is expected during page load, should only happen briefly

❌ Investigate: Same log repeating every few seconds
  Indicates auth is never initializing - check Clerk config

❌ Investigate: "getMyProjects error: [error message]"
  Unexpected error, investigate root cause
```

## Prevention

To prevent similar issues in the future:

1. **Always return valid data structures** from queries, never throw
2. **Use try/catch** in all query handlers
3. **Log errors** server-side for debugging
4. **Test cold loads** after every auth change
5. **Consider auth timing** when adding new queries

## Key Takeaway

> **Auth is async. Queries are reactive. Design for the gap between them.**

When a query depends on auth, it should gracefully handle the "not yet authenticated" state, not crash. Convex's reactivity will automatically retry once auth completes.



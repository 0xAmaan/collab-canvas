# Test Plan: Error Handling for Convex Queries

This document outlines test scenarios to verify that the error handling fixes work correctly in production.

## Background

Fixed the "Server Error" crashes that occurred when Convex queries (`getProject`, `getShapes`, `getShape`) threw exceptions. These queries now return graceful fallback values instead of crashing the client.

## Test Scenarios

### 1. Invalid Project ID

**Scenario**: User navigates to a non-existent project

**Steps**:
1. Navigate to `/projects/invalid-project-id`
2. Observe the behavior

**Expected Result**:
- Loading spinner appears briefly
- Error message displays: "Project not found or access denied"
- "Back to Projects" button is shown
- No console errors or crashes
- Server logs show: `getProject error: Project not found`

**Status**: ⏳ Pending Test

---

### 2. Deleted Project

**Scenario**: User has a project open, it gets deleted, then they refresh

**Steps**:
1. Open a project (e.g., `/projects/abc123`)
2. In another tab/window, delete that project
3. Refresh the original tab

**Expected Result**:
- Brief loading state
- Error screen: "Project not found or access denied"
- User can click "Back to Projects"
- Canvas does not render
- No crashes

**Status**: ⏳ Pending Test

---

### 3. Private Project Access Attempt

**Scenario**: User B tries to access User A's private project

**Steps**:
1. User A creates a private project (get the project ID)
2. Ensure project is private (lock icon visible)
3. User B (different account) navigates to the project URL
4. Observe behavior

**Expected Result**:
- User B sees: "Project not found or access denied"
- User A's project data is not leaked
- Server logs: `getProject error: No access to this project`
- No crashes

**Status**: ⏳ Pending Test

---

### 4. Public Project Access (Happy Path)

**Scenario**: User B accesses User A's public project

**Steps**:
1. User A creates a project and makes it public (globe icon)
2. Copy the project URL
3. User B (different account) navigates to the URL
4. Observe behavior

**Expected Result**:
- Project loads successfully
- User B can see the canvas and shapes
- User B sees "Public Project" indicator
- User B cannot rename/delete the project (not owner)
- No errors

**Status**: ⏳ Pending Test

---

### 5. Unauthenticated User Access

**Scenario**: User is not logged in and tries to access a project

**Steps**:
1. Log out completely
2. Navigate to any project URL
3. Observe behavior

**Expected Result**:
- Either redirected to login (middleware should catch this)
- OR shows "Project not found or access denied"
- No crashes or "Server Error"

**Status**: ⏳ Pending Test

---

### 6. Auth Session Expiry

**Scenario**: User's JWT token expires while viewing a project

**Steps**:
1. Open a project
2. Wait for JWT to expire (or manually invalidate session)
3. Trigger a re-query (refresh page or wait for reactivity)
4. Observe behavior

**Expected Result**:
- Graceful error handling
- User is prompted to re-authenticate
- No crashes or undefined states
- Server logs auth failure

**Status**: ⏳ Pending Test

---

### 7. Project Access with Shapes Loading

**Scenario**: Verify shapes load correctly when project access succeeds

**Steps**:
1. Create a project with several shapes
2. Navigate away
3. Navigate back to the project
4. Observe loading sequence

**Expected Result**:
- Project data loads first
- Then shapes load and render
- No flicker or empty states
- All shapes visible after load

**Status**: ⏳ Pending Test

---

### 8. Project Access Denied - No Shapes Leak

**Scenario**: Ensure shapes don't load for inaccessible projects

**Steps**:
1. User A creates private project with shapes
2. User B tries to access it
3. Check network tab for any shape queries

**Expected Result**:
- `getProject` returns null
- `getShapes` returns empty array `[]`
- No shape data is sent to User B
- Canvas renders empty state
- No errors in console

**Status**: ⏳ Pending Test

---

### 9. Slow Network Conditions

**Scenario**: Test loading states on throttled connection

**Steps**:
1. Enable network throttling (Slow 3G in DevTools)
2. Navigate to a project
3. Observe loading sequence

**Expected Result**:
- "Loading project..." message appears
- No premature error states
- Eventually loads or shows error after timeout
- No crashes during loading

**Status**: ⏳ Pending Test

---

### 10. Race Condition - Auth vs Query

**Scenario**: Test race between auth initialization and query execution

**Steps**:
1. Clear all cookies/local storage
2. Navigate directly to a project URL (not via login flow)
3. Log in when prompted
4. Observe behavior

**Expected Result**:
- Query waits for auth to complete OR
- Query fails gracefully, then retries after auth
- Eventually loads project successfully
- No crashes

**Status**: ⏳ Pending Test

---

## Edge Cases

### EC1: Malformed Project ID

**Test**: Navigate to `/projects/not-a-valid-id-format`

**Expected**: Error screen, no crashes

---

### EC2: Project ID Type Confusion

**Test**: Navigate to `/projects/123` (numeric instead of Convex ID format)

**Expected**: Error screen, no crashes

---

### EC3: Special Characters in URL

**Test**: Navigate to `/projects/<script>alert('xss')</script>`

**Expected**: Error screen, no XSS vulnerability

---

### EC4: Empty Project ID

**Test**: Navigate to `/projects/`

**Expected**: Redirect to projects list or 404

---

## Monitoring & Debugging

### Server-Side Logs to Monitor

When testing in production, watch for these console logs:

```
getProject error: Project not found
getProject error: No access to this project
getShapes error: Project not found
getShapes error: No access to this project
getShape error: Shape not found
getShape error: No access to this project
```

These are **expected** logs for legitimate error conditions. They help debug issues without crashing the client.

### Client-Side Behavior to Monitor

- No uncaught exceptions in console
- Graceful error states (not blank screens)
- Proper loading indicators
- User can always navigate back to safety

### Metrics to Track

If you have analytics:
- Count of "Project not found" errors
- Count of "No access" errors
- Ratio of successful vs failed project loads
- Time to show error screen

## Rollout Strategy

1. **Staging Environment**:
   - Run all test scenarios in staging
   - Verify no regressions
   - Test with real production data snapshot

2. **Canary Deploy**:
   - Deploy to 5% of users first
   - Monitor error rates
   - Watch for any new crash patterns

3. **Full Deploy**:
   - If canary is successful, deploy to 100%
   - Continue monitoring for 24 hours
   - Have rollback plan ready

## Success Criteria

✅ **Fix is successful if**:
- Zero "Server Error" crashes for `getProject`/`getShapes`/`getShape`
- Users see helpful error messages instead of crashes
- Error rates are within expected bounds
- No new crashes or regressions introduced
- Server logs show clear error messages

❌ **Rollback if**:
- New crash patterns emerge
- Error rates spike unexpectedly
- Users report worse experience than before
- Performance degradation

## Post-Deploy Checklist

- [ ] Monitor error logs for 24 hours
- [ ] Check Sentry/error tracking for new issues
- [ ] Verify analytics show reduced crash rate
- [ ] Get user feedback on error messages
- [ ] Document any new edge cases discovered
- [ ] Update this test plan with results

## Notes

- All tests should be run in both development and production environments
- Test with different browsers (Chrome, Firefox, Safari)
- Test on mobile devices as well as desktop
- Consider automated E2E tests for critical paths



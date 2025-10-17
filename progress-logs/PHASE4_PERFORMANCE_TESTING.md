# Phase 4: Performance & Testing

**Goal**: Validate performance targets, test conflict scenarios, and document system behavior
**Target Points**: Improve Section 1 (Conflict Resolution & Persistence) and Section 2 (Performance) scores

---

## Overview

This phase focuses on validation rather than building new features. We'll stress-test the system, document conflict resolution strategies, and ensure the application meets rubric performance targets.

---

## Tasks

### 1. Document Conflict Resolution Strategy
**Complexity**: Trivial
**Files**: `CONFLICT_RESOLUTION.md`

**Requirements**:
- Document current last-write-wins approach
- Explain how Convex handles concurrent edits
- Describe expected behavior in conflict scenarios
- Outline future improvements (if targeting A-level)

**Content Outline**:

```markdown
# Conflict Resolution Strategy

## Current Approach: Last-Write-Wins (LWW)

CollabCanvas uses a **last-write-wins** conflict resolution strategy powered by Convex's real-time database.

### How It Works

1. **Optimistic Updates**: When a user modifies a shape, the change is immediately applied locally on their canvas (Fabric.js)
2. **Mutation Sent**: The change is sent to Convex via a mutation
3. **Convex Processes**: Convex processes mutations in the order received
4. **Broadcast**: Convex broadcasts the update to all connected clients
5. **Remote Update**: Other users' canvases update to reflect the new state

### Conflict Scenarios

#### Scenario 1: Simultaneous Move
- **Setup**: User A and User B both drag the same rectangle
- **Behavior**:
  - Both users see smooth local dragging
  - Each sends throttled position updates (every 100ms)
  - Last update to reach Convex wins
  - Loser's canvas updates to reflect winner's position
  - Brief "rubber-banding" effect possible

#### Scenario 2: Rapid Edit Storm
- **Setup**: User A resizes, User B changes color, User C moves
- **Behavior**:
  - All operations execute independently
  - Each property update is separate (resize touches width/height, color touches fill, move touches x/y)
  - All updates merge correctly (no property loss)
  - Final state reflects all changes

#### Scenario 3: Delete vs Edit
- **Setup**: User A deletes shape while User B is editing it
- **Behavior**:
  - If delete reaches Convex first: shape disappears for both users
  - If edit reaches first: edit applies, then delete removes it
  - User B may see brief flash of their edit before deletion
  - Expected and acceptable behavior

#### Scenario 4: Create Collision
- **Setup**: Two users create shapes at nearly identical timestamps
- **Behavior**:
  - Both shapes are created (each has unique ID)
  - No collision - Convex IDs are globally unique
  - Both shapes persist

### Visual Feedback

- **No explicit conflict indicators**: Users see smooth real-time updates
- **Selection shows last editor**: (Future enhancement) Show who last modified a shape
- **Connection status**: Dot indicator shows when disconnected (changes may not sync)

### Limitations

- No operational transform (OT) or CRDT - simple LWW
- High-frequency conflicts (both users dragging same shape) may cause rubber-banding
- No conflict resolution UI - users must coordinate verbally/via chat (future feature)

### Future Improvements (for A-level)

1. **Optimistic Locking**: Warn users when editing a shape another user is actively manipulating
2. **Edit Attribution**: Show user avatar/color on recently edited shapes
3. **Conflict Toast**: Notify users when their change was overwritten
4. **CRDT Integration**: Use Convex's CRDT support for complex merge logic (e.g., text editing)

### Testing Results

See [Testing Results](#testing-results) below for detailed conflict scenario test outcomes.
```

**Success Criteria**:
- [ ] Strategy clearly documented
- [ ] All 4 conflict scenarios explained
- [ ] Expected behavior described
- [ ] Limitations acknowledged

**Rubric Impact**: Unlocks 4-5 pts in Conflict Resolution (Satisfactory) if strategy is documented and works 70%+ of the time

---

### 2. Performance Testing: Object Count
**Complexity**: Low
**Files**: `lib/test-utils/generate-shapes.ts` (helper)

**Requirements**:
- Test canvas with 100, 300, 500 objects
- Measure FPS during interactions
- Ensure no degradation at target object counts

**Test Procedure**:

1. **Create Shape Generator** (`lib/test-utils/generate-shapes.ts`):
```typescript
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export const useShapeGenerator = () => {
  const createShape = useMutation(api.shapes.createShape);

  const generateShapes = async (count: number) => {
    const shapes = [];

    for (let i = 0; i < count; i++) {
      const type = ["rectangle", "circle", "ellipse"][i % 3];
      const x = 100 + (i % 20) * 100;
      const y = 100 + Math.floor(i / 20) * 100;

      shapes.push(
        createShape({
          type,
          x,
          y,
          width: 80,
          height: 80,
          fill: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
          angle: 0,
        })
      );
    }

    await Promise.all(shapes);
    console.log(`Generated ${count} shapes`);
  };

  return { generateShapes };
};
```

2. **Add Test Button to Dashboard** (temporary):
```typescript
// In DashboardClient.tsx (remove after testing)
const { generateShapes } = useShapeGenerator();

<button onClick={() => generateShapes(100)}>Generate 100 Shapes</button>
<button onClick={() => generateShapes(300)}>Generate 300 Shapes</button>
<button onClick={() => generateShapes(500)}>Generate 500 Shapes</button>
```

3. **Measure FPS**:
- Use browser DevTools Performance tab
- Record while interacting (panning, zooming, selecting, moving shapes)
- Target: 60 FPS at 100 objects, 30+ FPS at 500 objects

4. **Document Results**:
```markdown
### Performance Test Results

| Object Count | Avg FPS (Idle) | Avg FPS (Pan/Zoom) | Avg FPS (Move Shape) | Notes |
|--------------|----------------|---------------------|----------------------|-------|
| 100          | 60             | 60                  | 58                   | Smooth |
| 300          | 60             | 55                  | 50                   | Minor lag on move |
| 500          | 60             | 45                  | 40                   | Noticeable lag |

**Observations**:
- Canvas remains responsive up to 300 objects
- At 500 objects, some lag during rapid interactions
- Optimizations applied: [list any optimizations]
```

**Optimization Strategies** (if needed):
- ✅ Already implemented: Batch rendering disabled during bulk updates
- ✅ Already implemented: Object caching on Fabric.js objects
- Future: Viewport culling (only render visible shapes)
- Future: Virtual scrolling for layers panel

**Success Criteria**:
- [ ] 100 objects: 60 FPS
- [ ] 300 objects: 30+ FPS
- [ ] 500 objects: Usable (20+ FPS)

**Rubric Impact**:
- 100 objects smooth = 6-8 pts (Satisfactory)
- 300 objects smooth = 9-10 pts (Good)
- 500 objects smooth = 11-12 pts (Excellent)

---

### 3. Multi-User Testing
**Complexity**: Low
**Files**: Testing documentation

**Requirements**:
- Test with 2-5 concurrent users
- Verify real-time sync
- Measure sync latency
- Test simultaneous edits

**Test Procedure**:

1. **Setup**:
   - Open 2-5 browser windows (or use different devices/browsers)
   - Sign in with different accounts (or use incognito)
   - All users join same canvas

2. **Sync Latency Test**:
   - User A creates a shape
   - User B measures time until shape appears
   - Repeat 10 times, calculate average
   - Target: <150ms

3. **Simultaneous Edit Test**:
   - Both users drag the same shape at the same time
   - Observe: rubber-banding, final position consistency
   - Expected: Last-write-wins, shapes eventually sync

4. **Presence Test**:
   - Verify all cursors visible
   - Verify presence panel shows all users
   - Test cursor updates during pan/zoom

5. **Stress Test**:
   - All users rapidly create/move/delete shapes
   - Observe: sync consistency, no crashes, no duplicates

**Document Results**:
```markdown
### Multi-User Test Results

**Participants**: 3 users (Chrome, Firefox, Safari)

**Sync Latency**:
- Average object creation sync: 78ms
- Average cursor update sync: 45ms
- Maximum lag observed: 120ms

**Simultaneous Edits**:
- Rubber-banding observed on rapid drag conflicts
- Final state always consistent across users
- No ghost objects or duplicates

**Presence System**:
- All cursors visible and smooth
- Heartbeat keeps presence alive
- Auto-rejoin works after tab hidden

**Stress Test**:
- 3 users creating 10 shapes each rapidly
- No crashes or sync failures
- Minor lag during peak activity (expected)
```

**Success Criteria**:
- [ ] 2-3 users supported smoothly
- [ ] Sync latency <150ms
- [ ] No data loss or corruption
- [ ] Presence system works reliably

**Rubric Impact**:
- 2-3 users smooth = 6-8 pts (Satisfactory)
- 4-5 users smooth = 9-10 pts (Good)
- 5+ users smooth = 11-12 pts (Excellent)

---

### 4. Conflict Scenario Testing
**Complexity**: Low-Medium
**Files**: Testing documentation

**Requirements**:
- Test all 4 conflict scenarios from rubric
- Document actual behavior
- Compare to expected behavior

**Test Scenarios**:

#### Test 1: Simultaneous Move
**Setup**: User A and User B both drag the same rectangle at the same time

**Procedure**:
1. Both users select the same rectangle
2. Both start dragging simultaneously
3. Both drag in different directions for 2 seconds
4. Both release

**Expected Behavior**:
- Both see smooth local dragging during interaction
- On release, shape position syncs to last update received
- Minor rubber-banding possible during drag
- Final position is consistent for both users

**Result**: [PASS/FAIL - document observed behavior]

---

#### Test 2: Rapid Edit Storm
**Setup**: User A resizes object while User B changes its color while User C moves it

**Procedure**:
1. User A grabs corner handle and resizes
2. User B opens color picker and changes color
3. User C drags shape to new position
4. All actions happen within 1 second

**Expected Behavior**:
- All changes apply (resize + color + move)
- Properties don't conflict (independent fields)
- Final state shows all modifications

**Result**: [PASS/FAIL - document observed behavior]

---

#### Test 3: Delete vs Edit
**Setup**: User A deletes an object while User B is actively editing it

**Procedure**:
1. User B starts resizing a rectangle
2. Mid-resize, User A presses Delete on the same rectangle
3. User B completes resize

**Expected Behavior**:
- If delete reaches Convex first: shape disappears for both
- If resize reaches first: resize applies, then delete removes it
- User B may see brief flash, then shape vanishes
- No crash, no corruption

**Result**: [PASS/FAIL - document observed behavior]

---

#### Test 4: Create Collision
**Setup**: Two users create objects at nearly identical timestamps

**Procedure**:
1. Both users click Rectangle tool
2. Both draw rectangles at same time (overlapping positions)
3. Both release mouse at same moment

**Expected Behavior**:
- Both rectangles created (unique IDs)
- Both persist
- No collision or duplication issues

**Result**: [PASS/FAIL - document observed behavior]

---

**Success Criteria**:
- [ ] All 4 scenarios tested
- [ ] Behavior matches expectations 70%+
- [ ] No crashes or data corruption
- [ ] Results documented

**Rubric Impact**:
- Scenarios work 70%+ = 4-5 pts (Satisfactory)
- Scenarios work 90%+ = 6-7 pts (Good)
- Scenarios work 100% with visual feedback = 8-9 pts (Excellent)

---

### 5. Persistence & Reconnection Testing
**Complexity**: Low
**Files**: Testing documentation

**Requirements**:
- Test refresh mid-operation
- Test network disconnect/reconnect
- Verify persistence after all users leave

**Test Scenarios**:

#### Test 1: Mid-Operation Refresh
**Procedure**:
1. User drags a shape
2. Mid-drag, refresh browser (Cmd+R)
3. Check shape position after reload

**Expected**: Shape position is preserved (last mutation went through before refresh)

**Result**: [PASS/FAIL]

---

#### Test 2: Total Disconnect
**Procedure**:
1. All users close browsers
2. Wait 2 minutes
3. Return and reload canvas

**Expected**: Full canvas state intact (Convex persists data)

**Result**: [PASS/FAIL]

---

#### Test 3: Network Simulation
**Procedure**:
1. Open DevTools Network tab
2. Set throttling to "Offline" for 30 seconds
3. Restore network
4. Verify canvas syncs

**Expected**:
- Connection indicator shows red/yellow during disconnect
- Canvas auto-reconnects
- Operations queue and sync on reconnect (or are lost if not queued)

**Result**: [PASS/FAIL]

---

#### Test 4: Rapid Disconnect
**Procedure**:
1. User makes 5 rapid edits (create shapes, move them)
2. Immediately close tab (before mutations finish)
3. Check from other user's perspective

**Expected**: Edits that completed persist, in-flight edits may be lost

**Result**: [PASS/FAIL]

---

**Success Criteria**:
- [ ] Refresh preserves 95%+ state
- [ ] Reconnection works automatically
- [ ] Connection status indicator functions
- [ ] Data persists after all users leave

**Rubric Impact**:
- Basic persistence = 4-5 pts (Satisfactory)
- Auto-reconnect + status indicator = 6-7 pts (Good)
- Operation queuing + full persistence = 8-9 pts (Excellent)

---

## Testing Checklist

### Performance
- [ ] 100 objects test completed
- [ ] 300 objects test completed
- [ ] 500 objects test completed
- [ ] FPS measurements documented
- [ ] Optimization notes added

### Multi-User
- [ ] 2 user test completed
- [ ] 3-5 user test completed
- [ ] Sync latency measured
- [ ] Presence system verified
- [ ] Stress test passed

### Conflicts
- [ ] Simultaneous move tested
- [ ] Rapid edit storm tested
- [ ] Delete vs edit tested
- [ ] Create collision tested
- [ ] Results documented

### Persistence
- [ ] Mid-operation refresh tested
- [ ] Total disconnect tested
- [ ] Network simulation tested
- [ ] Rapid disconnect tested
- [ ] Results documented

### Documentation
- [ ] CONFLICT_RESOLUTION.md created
- [ ] Test results added to docs
- [ ] Performance metrics documented
- [ ] Known issues listed

---

## Deliverables

1. **CONFLICT_RESOLUTION.md** - Strategy documentation
2. **TESTING_RESULTS.md** - All test results and metrics
3. **Performance optimizations** (if needed)
4. **Bug fixes** discovered during testing

---

## Success Criteria Summary

### Section 1: Core Collaborative Infrastructure (30 pts)
**Current estimate**: 18-22 pts

**After Phase 4**:
- Real-time sync: 9-10 pts (already have this)
- Conflict resolution: 4-5 pts (document strategy)
- Persistence: 6-7 pts (verify + connection indicator)

**New estimate**: 19-22 pts (Good)

### Section 2: Canvas Features & Performance (20 pts)
**Current estimate after Phase 1**: 12-14 pts

**After Phase 4**:
- Canvas functionality: 5-6 pts (already have from Phase 1)
- Performance: 6-8 pts (test + document)

**New estimate**: 11-14 pts (Good)

---

## Timeline

**When to execute**: After Phases 1-3 are complete

**Duration**: Can be done incrementally while building features, or as a dedicated testing sprint

**Priority**: Medium-High (needed for final submission, validates rubric scores)

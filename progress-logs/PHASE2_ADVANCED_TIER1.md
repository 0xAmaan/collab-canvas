# Phase 2: Advanced Tier 1 Features

**Goal**: Implement Figma-inspired features to improve UX and unlock additional rubric points
**Target Points**: Section 3 Tier 1: 4-6 pts (2-3 features × 2 pts each)

---

## Overview

Add professional-grade features that enhance usability: undo/redo system, Alt+drag duplication, and enhanced keyboard shortcuts. These are table-stakes features users expect in any modern canvas tool.

---

## Features to Implement

### 1. Undo/Redo System
**Complexity**: Medium
**Branch**: `feature/undo-redo`

**Requirements**:
- Cmd/Ctrl+Z to undo
- Cmd/Ctrl+Shift+Z to redo
- Track shape operations: create, update, delete, move
- Track text edits
- Session-based history (lost on refresh)
- Cap at 25 operations

**Implementation Details**:

**History Architecture**:

**Option A: Command Pattern** (Recommended)
```typescript
// Each operation is a command with undo/redo methods
interface Command {
  execute: () => void;
  undo: () => void;
  redo: () => void;
}

// Examples:
class CreateShapeCommand implements Command {
  constructor(private shapeData: Shape) {}
  execute() { /* create shape */ }
  undo() { /* delete shape */ }
  redo() { /* create shape again */ }
}

class UpdateShapeCommand implements Command {
  constructor(
    private shapeId: string,
    private oldData: Partial<Shape>,
    private newData: Partial<Shape>
  ) {}
  execute() { /* apply newData */ }
  undo() { /* apply oldData */ }
  redo() { /* apply newData */ }
}

class DeleteShapeCommand implements Command {
  constructor(private shapeData: Shape) {}
  execute() { /* delete shape */ }
  undo() { /* restore shape */ }
  redo() { /* delete shape again */ }
}
```

**Option B: State Snapshots** (Simpler but more memory)
```typescript
// Store full canvas state at each operation
interface HistoryState {
  timestamp: number;
  shapes: Shape[];
}

// On undo: restore previous state
// On redo: restore next state
```

**Recommendation**: Use **Command Pattern** (Option A) for efficiency.

**History Hook** (`hooks/useHistory.ts`):
```typescript
interface HistoryManager {
  undoStack: Command[];
  redoStack: Command[];
  maxSize: number; // 25

  execute: (command: Command) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  clear: () => void;
}

export const useHistory = (): HistoryManager => {
  const [undoStack, setUndoStack] = useState<Command[]>([]);
  const [redoStack, setRedoStack] = useState<Command[]>([]);

  const execute = (command: Command) => {
    command.execute();

    // Add to undo stack
    setUndoStack(prev => {
      const newStack = [...prev, command];
      // Cap at 25
      if (newStack.length > 25) newStack.shift();
      return newStack;
    });

    // Clear redo stack (new action invalidates redo)
    setRedoStack([]);
  };

  const undo = () => {
    if (undoStack.length === 0) return;

    const command = undoStack[undoStack.length - 1];
    command.undo();

    setUndoStack(prev => prev.slice(0, -1));
    setRedoStack(prev => [...prev, command]);
  };

  const redo = () => {
    if (redoStack.length === 0) return;

    const command = redoStack[redoStack.length - 1];
    command.redo();

    setRedoStack(prev => prev.slice(0, -1));
    setUndoStack(prev => [...prev, command]);
  };

  return {
    undoStack,
    redoStack,
    maxSize: 25,
    execute,
    undo,
    redo,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    clear: () => {
      setUndoStack([]);
      setRedoStack([]);
    },
  };
};
```

**Integration with Canvas**:

Every shape operation must go through the history system:

```typescript
// Instead of calling mutations directly:
createShape(data);

// Wrap in command:
const command = new CreateShapeCommand(data, createShapeMutation);
history.execute(command);
```

**Operations to Track**:
1. ✅ Create shape
2. ✅ Delete shape
3. ✅ Move shape (single mutation after drag)
4. ✅ Resize shape (single mutation after resize)
5. ✅ Rotate shape
6. ✅ Change color
7. ✅ Edit text content
8. ✅ Copy/paste (create operation)

**Operations to NOT Track** (to avoid noise):
- ❌ Cursor movement
- ❌ Selection changes
- ❌ Zoom/pan
- ❌ Hover states

**Keyboard Shortcuts** (`hooks/useKeyboard.ts`):
```typescript
case "z":
  if (metaKey && shiftKey) {
    history.redo();
  } else if (metaKey) {
    history.undo();
  }
  break;
```

**UI Feedback** (Optional):
- Show undo/redo buttons in toolbar
- Display "Undo [operation]" in tooltip
- Gray out buttons when stack is empty

**Multi-User Considerations**:
- Each user has their own local history
- User A's undo doesn't affect User B
- When User B modifies a shape User A created, User A can still undo their creation (shape gets deleted)
- **Conflict**: If User A undoes a create while User B is editing it → shape disappears for both (expected behavior)

**Files to Create/Modify**:
- ➕ `hooks/useHistory.ts` - History manager hook
- ➕ `lib/commands/` - Command implementations
  - `CreateShapeCommand.ts`
  - `UpdateShapeCommand.ts`
  - `DeleteShapeCommand.ts`
  - `types.ts` - Command interface
- ✏️ `components/canvas/Canvas.tsx` - Wrap all mutations in commands
- ✏️ `hooks/useKeyboard.ts` - Add undo/redo shortcuts
- ✏️ `app/dashboard/DashboardClient.tsx` - Provide history context
- ✏️ `components/ui/KeyboardShortcutsHelp.tsx` - Add undo/redo to help

**Testing**:
- [ ] Cmd+Z undoes last operation
- [ ] Cmd+Shift+Z redoes operation
- [ ] Can undo/redo multiple times
- [ ] Redo stack clears after new operation
- [ ] History caps at 25 operations
- [ ] Works for all operation types (create, delete, move, etc.)
- [ ] Each user has independent history
- [ ] Text edits can be undone

**Edge Cases**:
- [ ] Undo shape creation while another user is editing it
- [ ] Undo text edit mid-edit (should restore previous text)
- [ ] Rapid undo/redo doesn't cause sync issues
- [ ] History persists during same session (lost on refresh)

---

### 2. Duplicate with Alt+Drag
**Complexity**: Low
**Branch**: Can be part of `feature/copy-paste` or standalone

**Requirements**:
- Hold Alt while dragging a shape to duplicate it
- Original stays in place, drag the duplicate
- Works with single shapes
- Visual feedback (cursor change or ghost shape)

**Implementation Details**:

**Duplicate Detection** (`components/canvas/Canvas.tsx`):
```typescript
// On mouse down with Alt key:
canvas.on('mouse:down', (e) => {
  if (!e.e.altKey) return;
  if (!e.target) return;

  const original = e.target;

  // Clone the shape data
  const duplicate = cloneShape(original);

  // Add duplicate to canvas (invisible or low opacity)
  canvas.add(duplicate);

  // Set duplicate as active object (being dragged)
  canvas.setActiveObject(duplicate);

  // Original stays in place
  isDuplicating = true;
});

// On mouse up:
canvas.on('mouse:up', (e) => {
  if (!isDuplicating) return;

  // Save duplicate to Convex
  const duplicateData = extractShapeData(e.target);
  createShapeMutation(duplicateData);

  isDuplicating = false;
});
```

**Keyboard Shortcut Alternative**:
- Cmd+D also duplicates selected shape(s) in place with slight offset
- Alt+Drag is more intuitive for users familiar with Figma

**Visual Feedback**:
- Change cursor to indicate duplication mode
- Show duplicate with slight opacity until placed
- Snap to grid if enabled (future feature)

**Files to Create/Modify**:
- ✏️ `components/canvas/Canvas.tsx` - Alt+drag logic
- ✏️ `hooks/useKeyboard.ts` - Cmd+D shortcut
- ✏️ `components/ui/KeyboardShortcutsHelp.tsx` - Document Alt+drag

**Testing**:
- [ ] Alt+drag creates duplicate
- [ ] Original stays in place
- [ ] Duplicate syncs to Convex
- [ ] Works with all shape types
- [ ] Visual feedback is clear
- [ ] Duplicate has independent ID

---

### 3. Enhanced Keyboard Shortcuts
**Complexity**: Low
**Branch**: Can be integrated into existing branches

**Requirements**:
- Cmd+A to select all
- Cmd+D to duplicate
- Improve existing shortcuts

**Implementation Details**:

**Select All** (`hooks/useKeyboard.ts`):
```typescript
case "a":
  if (metaKey) {
    e.preventDefault();
    // Select all objects on canvas
    const allObjects = canvas.getObjects();
    const selection = new fabric.ActiveSelection(allObjects, { canvas });
    canvas.setActiveObject(selection);
    canvas.requestRenderAll();
  }
  break;
```

**Duplicate** (`hooks/useKeyboard.ts`):
```typescript
case "d":
  if (metaKey) {
    e.preventDefault();
    duplicateSelected(); // Clone and offset by (10, 10)
  }
  break;
```

**Updated Shortcuts List**:
| Key | Action | Description |
|-----|--------|-------------|
| R | Rectangle Tool | Create rectangles |
| C | Circle Tool | Create circles |
| E | Ellipse Tool | Create ellipses |
| L | Line Tool | Create lines |
| T | Text Tool | Create text |
| V / Esc | Select Tool | Selection mode |
| Delete / Backspace | Delete | Remove selected |
| Cmd+C | Copy | Copy selected |
| Cmd+V | Paste | Paste copied |
| Cmd+D | Duplicate | Duplicate selected |
| Cmd+Z | Undo | Undo last action |
| Cmd+Shift+Z | Redo | Redo last undo |
| Cmd+A | Select All | Select all shapes |
| Alt+Drag | Duplicate | Duplicate while dragging |
| ? | Help | Show shortcuts |

**Files to Create/Modify**:
- ✏️ `hooks/useKeyboard.ts` - Add Cmd+A, Cmd+D
- ✏️ `constants/keyboard.ts` - Update shortcut mappings
- ✏️ `components/ui/KeyboardShortcutsHelp.tsx` - Update help modal

**Testing**:
- [ ] Cmd+A selects all shapes
- [ ] Cmd+D duplicates selected
- [ ] All shortcuts work without conflicts
- [ ] Help modal shows updated list

---

## Future Enhancements (Post-Phase 2)

### Omnibar / Command Palette
**Complexity**: Medium
**Description**: Figma-style quick actions menu

**Features**:
- Cmd+K to open command palette
- Search for actions: "Create rectangle", "Change color", "Delete"
- Fuzzy search
- Recent commands
- Keyboard navigation

**Implementation**:
- Use Headless UI Combobox or custom component
- Action registry with search index
- Execute actions programmatically

**Priority**: Low (nice-to-have for polish phase)

---

## Execution Order

1. **Undo/Redo** (foundational, affects other features)
2. **Alt+Drag Duplicate** (leverages copy/paste)
3. **Enhanced Keyboard Shortcuts** (quick wins)

---

## Merge Strategy

**Recommended merge order**:
1. `feature/undo-redo` → `main` (must be first, wraps all operations)
2. `feature/copy-paste` (if Alt+drag is part of it) → `main`
3. Enhanced shortcuts merged into existing branches

**Conflict Hotspots**:
- `Canvas.tsx` - Undo/redo wraps all mutations
- `useKeyboard.ts` - All shortcuts update this file

**Merge Tips**:
- Test undo/redo extensively before merging (affects everything)
- Document command pattern for future contributors
- Keep command implementations isolated in `lib/commands/`

---

## Success Criteria

- [ ] Undo/redo works for all operations
- [ ] History caps at 25 operations
- [ ] Alt+drag creates duplicates smoothly
- [ ] Cmd+A, Cmd+D, and all shortcuts functional
- [ ] Help modal reflects all shortcuts
- [ ] No performance issues with history tracking
- [ ] Multi-user undo doesn't break

**Estimated Section 3 Score**: 4-6 points (2-3 Tier 1 features)

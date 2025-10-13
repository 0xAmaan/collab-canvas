# Canvas Component Documentation

## Overview

This directory contains the main Canvas component built with Fabric.js for the CollabCanvas application. The canvas provides pan and zoom functionality as part of PR #4.

## Components

### Canvas.tsx

The main canvas component that:
- Initializes a Fabric.js canvas instance
- Handles viewport rendering
- Implements pan functionality (Alt+Drag or drag on empty space)
- Implements zoom functionality (mouse wheel)
- Persists viewport state to localStorage
- Auto-resizes to fit the container

**Props:**
- `onCanvasReady?: (canvas: FabricCanvas) => void` - Callback fired when canvas is initialized

**Features:**
- **Pan**: Hold Alt key and drag, or drag on empty canvas space
- **Zoom**: Use mouse wheel to zoom in/out (10% - 400%)
- Zoom centers on cursor position
- Smooth 60 FPS rendering
- Responsive canvas that fills container

## Usage

```tsx
import { Canvas } from '@/components/canvas';

function MyComponent() {
  const handleCanvasReady = (canvas: FabricCanvas) => {
    console.log('Canvas ready:', canvas);
  };

  return (
    <div className="h-screen">
      <Canvas onCanvasReady={handleCanvasReady} />
    </div>
  );
}
```

## Implementation Details

### Fabric.js Integration

The component uses Fabric.js for object-based canvas manipulation. Key Fabric.js features used:

- `fabric.Canvas` - Main canvas instance
- `viewportTransform` - Matrix for pan/zoom transformations
- `mouse:wheel` event - For zoom functionality
- `mouse:down/move/up` events - For pan functionality
- `zoomToPoint()` - To zoom toward cursor position

### Viewport Transform

The viewport transform is a 2D transformation matrix:
```
[scaleX, skewY, skewX, scaleY, translateX, translateY]
```

For pan/zoom:
- `scaleX` and `scaleY` = zoom level
- `translateX` = horizontal pan offset
- `translateY` = vertical pan offset

### Event Handling

**Zoom (Mouse Wheel):**
1. Capture wheel event
2. Calculate new zoom from delta
3. Clamp zoom between MIN (0.1) and MAX (4.0)
4. Apply zoom centered on cursor position

**Pan (Mouse Drag):**
1. On mouse down: Check if Alt key or no target clicked
2. Set `isPanning` flag and disable selection
3. On mouse move: Update viewport transform translation
4. On mouse up: Reset panning state and re-enable selection

## Next Steps (Future PRs)

- PR #5: Add shape creation and manipulation
- PR #6: Real-time shape synchronization with Convex
- PR #7: Multiplayer cursors
- PR #8: Presence panel

## Related Files

- `/hooks/useViewport.ts` - Viewport state management hook
- `/lib/viewport-utils.ts` - Viewport calculation utilities
- `/lib/canvas-utils.ts` - Canvas helper functions
- `/types/viewport.ts` - Viewport TypeScript types
- `/constants/shapes.ts` - Canvas and zoom constants


# Quick Start Guide - Canvas Development

## Running the Application

```bash
# Start the Next.js dev server
bun run dev

# In another terminal, start Convex (if not already running)
bunx convex dev
```

Open http://localhost:3000 and sign in with Clerk.

## Testing Canvas Features (PR #4)

### Pan the Canvas
1. **Method 1:** Hold `Alt` key and drag with mouse
2. **Method 2:** Click on empty canvas space and drag

### Zoom the Canvas
1. **Method 1:** Use mouse wheel (scroll up = zoom in, scroll down = zoom out)
2. **Method 2:** Click the zoom in `+` button in the toolbar
3. **Method 3:** Click the zoom out `-` button in the toolbar
4. **Reset:** Click the percentage display (e.g., "100%") to reset to default zoom

### Viewport Persistence
1. Pan and zoom the canvas
2. Refresh the page (Cmd+R / Ctrl+R)
3. Notice your viewport position is restored

## Development Info

### Canvas Overlay (Bottom-Left)
Shows real-time information:
- Canvas dimensions (your viewport size)
- Virtual canvas size (5000x5000)
- Keyboard shortcuts

### Console Debugging
Open browser DevTools console to see:
- Canvas initialization messages
- Viewport changes
- Any errors (there shouldn't be any!)

## Current Features (PR #4 Complete)

✅ Fabric.js canvas initialized
✅ Pan with Alt+Drag or drag on empty space
✅ Zoom with mouse wheel (10% - 400%)
✅ Zoom controls UI
✅ Viewport persistence
✅ Responsive canvas (fills screen)
✅ 60 FPS performance

## Coming in PR #5

- Rectangle creation tool
- Keyboard shortcut: 'R'
- Shape selection
- Shape dragging
- Toolbar with tool buttons

## Project Structure

```
/components/canvas/Canvas.tsx       - Main Fabric canvas
/components/toolbar/ZoomControls.tsx - Zoom UI
/hooks/useViewport.ts               - Viewport state
/lib/viewport-utils.ts              - Helper functions
/types/viewport.ts                  - TypeScript types
/constants/shapes.ts                - Configuration
```

## Troubleshooting

### Canvas doesn't appear
- Check browser console for errors
- Make sure you're signed in
- Try refreshing the page

### Pan/Zoom not working
- Make sure you're on the dashboard page (/dashboard)
- Try clicking the canvas first to focus it
- Check that mouse wheel events aren't being blocked

### Viewport doesn't persist
- Check browser localStorage (DevTools > Application > Local Storage)
- Look for key: `collab-canvas-viewport`
- Try clearing localStorage and testing again

## Next Steps

1. **Test the canvas** - Try all pan/zoom features
2. **Check performance** - Should maintain 60 FPS
3. **Verify persistence** - Refresh and see viewport restore
4. **Ready for PR #5** - Move on to shape creation!


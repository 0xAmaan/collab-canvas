AI Agent Enhancement: Complete Summary & Batch 4 Context
Overview
Enhanced the AI canvas agent from basic creation to a comprehensive, viewport-aware system with selection context, advanced manipulation, and intelligent multi-object creation.
Architecture Overview
Key Files & Responsibilities:
lib/ai/types.ts: TypeScript interfaces for all AI commands and requests
app/api/ai/canvas/route.ts: API endpoint that receives commands, calls OpenAI with tools, returns tool calls
lib/ai/client-executor.ts: Client-side executor that translates AI tool calls → Convex mutations
app/dashboard/DashboardClient.tsx: Orchestrates AI requests, passes context (shapes, selection, viewport)
components/canvas/Canvas.tsx: Fabric.js canvas rendering and real-time sync
Data Flow:
Completed Batches
Batch 1: Foundation & Quick Wins ✅
1.1 Selection Context
Pass selectedShapeIds in AICommandRequest
System prompt: "When shapes selected + user says 'change this', omit selector or use 'selected'"
Result: "Select square, say 'make it red'" works reliably
1.2 Shape Identification by Name/Number
Enhanced resolveSelector() to identify shapes by number (e.g., "rectangle 14" = 14th rectangle by creation order)
Counts shapes of same type to determine index
Result: "Edit rectangle 14 to be 500px wider" works
1.3 Expanded Shape Creation
Added tools: create_ellipse, create_line, create_polygon
Fixed rendering: Set originX: "left", originY: "top" for ellipses/polygons
Line fix: Use strokeColor for stroke property
Result: All shape types render correctly on canvas
1.4 UI Enhancement: Object Labels
Added "Object Name" section in PropertiesSidebar.tsx
Shows "Rectangle 3" or "5 objects selected"
Horizontal layout (justify-between) to save space
Result: Easy shape identification in UI
1.5 Immediate UI Updates
Modified Canvas.tsx update logic (lines ~974-983)
Changed: Now applies ALL updates (color, size, position, angle) to selected Fabric.js objects immediately
Previously: Skipped updates for selected objects to prevent jitter
Result: AI changes reflect instantly, no need to deselect
Batch 2: Manipulation Commands ✅
Added Tools:
delete_shape: Deletes shapes by selector
duplicate_shape: Duplicates shapes with 50px offset
rotate_shape: Rotates by angle delta (e.g., +45° or -90°)
resize_shape: Key innovation - relative sizing
Resize Shape Deep Dive:
Problem: LLM rounding errors when calculating "100px wider"
Solution: Shift math from LLM → TypeScript
Implementation:
Tool accepts: widthDelta, heightDelta, OR scale
Executor retrieves current dimensions from shape
Performs precise math: newWidth = currentWidth + widthDelta
System prompt guides: "For relative sizing, use resize_shape with deltas"
Result: 100% accurate, no rounding, faster execution
Skipped: Undo/redo integration (deferred for now)
Batch 3: Smart Grid Layout ✅
Multi-Object Creation:
Added count (1-500) and spacing parameters to create_rectangle, create_circle, create_ellipse
calculateGridDimensions(): Finds most square-like grid (e.g., 25 → 5×5, 10 → 5×2)
Grid centering: Calculate total grid dimensions, then position shapes systematically
System Prompt Guidance:
Result: Clean, organized multi-object creation
Batch 3.5: Viewport-Aware Positioning ✅
Problem: Shapes always created at canvas center (1000, 1000), often off-screen when zoomed/panned
Solution:
Calculate viewport center in DashboardClient.tsx:
Extract viewport transform matrix from Fabric.js
Convert viewport screen coordinates → canvas coordinates using zoom/pan
Pass to executor via AICommandRequest and ExecutorContext
Position with offset in grid layout functions:
Offset: +300px right, +200px down from viewport center
Falls back to (1000, 1000) if no viewport info
Result: Shapes always appear in bottom-right quadrant of current view, never off-screen
System Prompt Key Points
Selection Awareness:
"When shapes selected + 'change this' → omit selector or use 'selected'"
Never use "all shapes" when selection exists
Relative Sizing:
"For relative changes (100px wider), use resize_shape with widthDelta/heightDelta"
Never use update_shape for relative sizing
Multi-Shape Creation:
"If asked for multiple objects, use count parameter"
"AI auto-arranges in grid, handles positioning"
Colors:
"Use hex values: #3b82f6 (blue), #ef4444 (red), #22c55e (green)"
AI interprets color names → hex automatically
Positioning:
Default: viewport center (handled automatically via context)
Relative: "to the right" = +150px offset
Layouts: Calculate mathematically for rows/columns
Batch 4: Complex Multi-Step Commands (PENDING)
Goal:
Enable AI to create multi-element UIs with proper relationships and positioning.
Target Commands:
"create a login form" → username field, password field, submit button, label text
"build a navigation bar with 5 items" → horizontal layout, evenly spaced text elements
"make a card layout" → rectangle background, title text, body text, properly nested
Batch 4 Implementation Strategy
Approach 1: Multi-Step Tool (Recommended)
Create a new create_complex_layout tool:
Executor Implementation:
executeCreateComplexLayout() function
Switch on layoutType
Each type has hardcoded layout logic:
Use viewport center for positioning
Create all shapes with Promise.all() for efficiency
Return array of created shape IDs for potential grouping
Pros:
Clean system prompt
Predictable, consistent layouts
Fast execution (no LLM reasoning per element)
Easy to add new layout types
Cons:
Less flexible (predefined layouts only)
Requires updating executor for each new layout type
Approach 2: Enhanced Existing Tools
No new tool, just better prompting:
System prompt addition:
Pros:
More flexible (any arrangement possible)
No code changes needed
LLM creativity for variations
Cons:
Slower (7+ tool calls vs 1)
Inconsistent results
Higher token cost
More prompt engineering needed
Approach 3: Hybrid (Best of Both)
Combine predefined templates + custom arrangements:
Add create_complex_layout for common patterns (login, navbar, card)
Enhance system prompt to guide multi-step creation for custom requests
Add arrange_in_grid or distribute_evenly helper tools for spacing
Pros:
Fast + consistent for common cases
Flexible for unique requests
Best user experience
Recommended Batch 4 Plan
Phase 1: Implement Predefined Layouts
Create create_complex_layout tool in API route
Add executor function in client-executor.ts
Implement 3 layouts:
login_form: 2 labeled inputs + button
navbar: Horizontal text elements with even spacing
card: Background rectangle + title + body text
Phase 2: Test & Refine
Test each layout type
Adjust spacing, sizing, colors for visual appeal
Ensure viewport-aware positioning works
Phase 3: Expand
Add more layout types based on user needs
Consider adding align_shapes or distribute_shapes tools for post-creation adjustment
Technical Considerations for Batch 4
Shape Relationships:
No native grouping yet: Convex schema doesn't have parent-child relationships
Workaround: Return array of shape IDs, could add groupId field later for selection
Alternative: Create shapes at calculated positions, user can group manually
Text Sizing & Overflow:
Text shapes don't auto-resize based on content
Solution: Calculate approximate width (chars × fontSize × 0.6) or use fixed widths
Z-Index / Layering:
Background elements should render first (lower in layers)
Solution: Create shapes in correct order (backgrounds → content)
Styling Consistency:
Define default color palettes for layouts
Example: Login form uses background: #1e1e1e, accent: #3b82f6, text: #ffffff
Positioning Math:
All positions relative to viewport center + offset
Pattern:
Summary for Next Agent
What's Built:
✅ Selection-aware AI that understands "change this"
✅ Shape identification by name/number
✅ Full CRUD operations (create, update, delete, duplicate, rotate, resize)
✅ Precise relative sizing (no LLM rounding errors)
✅ Smart grid layout for multi-object creation
✅ Viewport-aware positioning (shapes always visible)
What's Next:
⏳ Complex multi-element layouts (login forms, navbars, cards)
Key Insight:
When the LLM struggles with precision (math, positioning), shift the logic to TypeScript. The LLM should choose tools and parameters, TypeScript does the calculations. This pattern (like resize_shape) ensures reliability.
Recommended Approach:
Start with Approach 1 (predefined layouts). They're fast, consistent, and users will mostly request common patterns. Add flexibility later if needed.
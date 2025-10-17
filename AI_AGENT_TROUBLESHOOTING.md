# AI Canvas Agent - Potential Issues & Troubleshooting

## Current Issue: Missing `fill` Field ❌

**Error**: `Object is missing the required field 'fill'`

**Cause**: Shape data has `fillColor` but Convex mutation expects `fill`

**Check**: Look at console logs to see if `fillColor` is actually present in the shape object

---

## Other Potential Errors

### 1. **Missing OpenAI API Key** 🔑
**Error**: `OpenAI API key not configured`

**Cause**: `OPENAI_API_KEY` not set in `.env.local`

**Fix**:
```bash
# Add to .env.local
OPENAI_API_KEY=sk-xxxxx

# Restart server
bun run dev
```

---

### 2. **AI Returns No Tool Calls** 🤖
**Error**: No commands executed, empty response

**Cause**: 
- AI doesn't understand the command
- AI returns text response instead of tool calls
- Tool schemas don't match AI's interpretation

**Debug**: Check terminal logs for `[AI Canvas] Full tool call:`

**Fix**:
- Rephrase command more explicitly
- Add more examples to system prompt
- Check if `result.toolCalls` is undefined

---

### 3. **Wrong Tool Parameter Names** 🏷️
**Error**: Parameters are undefined (e.g., `radius: undefined`)

**Cause**: AI SDK returns tool call args differently than expected

**Current Issue**: We're using `(toolCall as any).args` but AI SDK v5 might use different property

**Debug**: Check `[AI Canvas] Full tool call:` JSON output

**Fix**: Update line 169 in `app/api/ai/canvas/route.ts` to use correct property name

**Possible properties**:
- `.args` ✓ (current)
- `.input` 
- `.arguments`
- `.parameters`

---

### 4. **Selector Doesn't Match Any Shapes** 🎯
**Error**: `No shapes found matching "..."`

**Cause**: 
- Color doesn't match hex values exactly
- Type name doesn't match
- No shapes on canvas

**Examples**:
- ❌ "the reddish circle" → won't match "#ef4444"
- ✅ "the red circle" → matches "#ef4444"
- ❌ "the square" → won't match "rectangle"
- ✅ "the rectangle" → matches

**Fix**: Update selector resolution in `lib/ai/client-executor.ts` (lines 22-72) to be more flexible

---

### 5. **Missing Position/Dimensions** 📐
**Error**: `x`, `y`, `width`, or `height` is undefined

**Cause**: AI doesn't provide all required parameters

**Current Defaults** (in `lib/ai/client-executor.ts`):
```typescript
width: cmd.width || 100,
height: cmd.height || 100,
radius: cmd.radius || 50,
fontSize: cmd.fontSize || 16,
fill: cmd.fill || "#3b82f6",
```

**Note**: If AI provides `x: undefined`, it will remain undefined (no default)

**Fix**: Add defaults for x and y:
```typescript
x: cmd.x ?? 1000,  // Default to canvas center
y: cmd.y ?? 1000,
```

---

### 6. **Text Shape Missing Required Fields** 📝
**Error**: Missing `text`, `fontSize`, or `fontFamily`

**Cause**: AI doesn't provide text content

**Fix**: Defaults are already in place:
- `text: cmd.text || "Text"`
- `fontSize: cmd.fontSize || 16`
- `fontFamily: "Inter, Arial, sans-serif"` (hardcoded)

---

### 7. **Line Shape Not Supported** ➖
**Status**: Line creation not implemented in AI tools

**Error**: None (tool doesn't exist)

**Impact**: User can't ask AI to create lines

**Fix**: Add `create_line` tool to `app/api/ai/canvas/route.ts`

---

### 8. **Update Command Overwrites All Properties** ⚠️
**Issue**: If AI says "move the circle to 800, 800", it might also reset the color if `fill` isn't specified

**Cause**: The mutation applies all provided fields, but defaults might override existing values

**Check**: Line 171 in `lib/ai/client-executor.ts`:
```typescript
const updates: any = {};
if (cmd.x !== undefined) updates.x = cmd.x;
if (cmd.y !== undefined) updates.y = cmd.y;
// Only adds defined fields ✓
```

**Status**: ✅ Already handled correctly (only updates defined fields)

---

### 9. **Arrange Shapes with Empty Canvas** 🎨
**Error**: `No shapes to arrange`

**Cause**: Canvas is empty or selector doesn't match

**Fix**: Already handled - returns error message

---

### 10. **Network/Timeout Errors** ⏱️
**Error**: `Failed to execute command` (network failure)

**Causes**:
- OpenAI API is down
- Network connection lost
- Request takes > 10 seconds
- Rate limit exceeded

**Debug**: Check browser Network tab for failed requests to `/api/ai/canvas`

**Fix**: Add timeout and retry logic in `app/dashboard/DashboardClient.tsx`

---

### 11. **Multiple Users Creating Shapes Simultaneously** 👥
**Issue**: Race conditions when multiple users use AI at same time

**Impact**: 
- Selector might match wrong shapes
- "The circle" might refer to different circles for different users

**Current Behavior**: Each user's AI command is independent

**Potential Fix** (future): Add timestamps or user context to selectors

---

### 12. **AI Creates Shapes Outside Canvas Bounds** 🗺️
**Issue**: AI might create shapes at (-1000, -1000) or (5000, 5000)

**Canvas Size**: 2000x2000 (documented in system prompt)

**Fix**: Add validation in `lib/ai/client-executor.ts`:
```typescript
const x = Math.max(0, Math.min(2000, cmd.x));
const y = Math.max(0, Math.min(2000, cmd.y));
```

---

### 13. **OpenAI API Rate Limits** 💰
**Error**: 429 Too Many Requests

**Causes**:
- Free tier: 3 RPM (requests per minute)
- Paid tier: Higher limits based on tier

**Fix**: Add rate limiting or upgrade OpenAI account

---

### 14. **Token Limits Exceeded** 📊
**Error**: Context length exceeded

**Cause**: Passing too many shapes in context

**Current**: Sends all shapes to AI: `shapes: ${shapes.length} items`

**Impact**: 
- 100 shapes × 50 chars = 5000 chars = ~1250 tokens
- GPT-4o-mini limit: 128k tokens (should be fine)

**Fix** (if needed): Only send shape count and types, not full details

---

### 15. **Type Mismatches in Commands** 🔤
**Issue**: AI might return string instead of number

**Example**: `x: "500"` instead of `x: 500`

**Protection**: Zod schemas should validate and coerce:
```typescript
x: z.number().describe("X position")
```

**Status**: ✅ Should be handled by Zod

---

## Debugging Checklist

When AI command fails:

1. ✅ **Check Terminal Logs** (server-side)
   - `[AI Canvas] Full tool call:` → See what OpenAI returned
   - `[AI Canvas] All commands to execute:` → See parsed commands

2. ✅ **Check Browser Console** (client-side)
   - `[Client Executor] Create circle command:` → See command received
   - `[Client Executor] Shape data to create:` → See data sent to Convex
   - `[useShapes] Creating shape with data:` → See shape object
   - `[useShapes] Mutation args to send to Convex:` → See final mutation

3. ✅ **Check Convex Dashboard**
   - Go to convex.dev dashboard
   - Check Logs tab for mutation errors
   - Check Functions tab to manually test `createShape` mutation

4. ✅ **Check Network Tab**
   - Filter for `/api/ai/canvas`
   - Check request payload (command + shapes)
   - Check response (commands array)

---

## Files Showing Agent Functionality

### 1. **`app/api/ai/canvas/route.ts`** (lines 36-102)
**Purpose**: Defines all AI tools

**5 Tools**:
```typescript
1. create_rectangle(x, y, width, height, fill)
2. create_circle(x, y, radius, fill)
3. create_text(x, y, text, fontSize, fill)
4. update_shape(selector, x?, y?, fill?, width?, height?)
5. arrange_shapes(selector, layout, spacing?)
```

### 2. **`lib/ai/client-executor.ts`**
**Purpose**: Executes AI commands

**Functions**:
- `executeCreateRectangle()`
- `executeCreateCircle()`
- `executeCreateText()`
- `executeUpdateShape()`
- `executeArrangeShapes()`
- `resolveSelector()` - Matches shapes by color/type

### 3. **`lib/ai/types.ts`**
**Purpose**: TypeScript type definitions

**Types**:
- `CreateRectangleCommand`
- `CreateCircleCommand`
- `CreateTextCommand`
- `UpdateShapeCommand`
- `ArrangeShapesCommand`

---

## Quick Fixes for Common Issues

### Fix 1: Add Position Defaults
```typescript
// lib/ai/client-executor.ts, line 84
x: cmd.x ?? 1000,
y: cmd.y ?? 1000,
width: cmd.width || 100,
height: cmd.height || 100,
fillColor: cmd.fill || "#3b82f6",
```

### Fix 2: Add Bounds Checking
```typescript
// lib/ai/client-executor.ts
const clamp = (val: number, min: number, max: number) => 
  Math.max(min, Math.min(max, val));

x: clamp(cmd.x ?? 1000, 0, 2000),
y: clamp(cmd.y ?? 1000, 0, 2000),
```

### Fix 3: More Flexible Color Matching
```typescript
// lib/ai/client-executor.ts, line 26
if (lower.includes("red"))
  return shapes.filter(s => 
    s.fillColor?.toLowerCase().includes("red") || 
    s.fillColor?.includes("#ef4") ||
    s.fillColor?.includes("#f44") ||
    s.fillColor?.includes("red")
  );
```

---

## Testing Commands

### Basic Creation
- "Create a red circle at 500, 500"
- "Add a blue rectangle at 700, 500"
- "Create text that says Hello World at 600, 400"

### With Defaults (test missing params)
- "Create a circle" → Should use defaults
- "Make a red rectangle" → Should use center position

### Selection & Updates
- "Change the red circle to green"
- "Move the blue rectangle to 800, 600"
- "Make all rectangles purple"

### Layout
- "Arrange all shapes in a horizontal row"
- "Arrange the circles in a vertical column"

### Edge Cases
- "Create 5 blue circles" → Test multiple shapes
- "Delete all shapes" → Tool doesn't exist, should fail gracefully
- "Make the purple triangle blue" → No triangles, should error


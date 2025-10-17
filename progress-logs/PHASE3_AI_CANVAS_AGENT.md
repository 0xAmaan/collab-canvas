# Phase 3: AI Canvas Agent

**Goal**: Build an AI agent that can create and manipulate shapes via natural language commands
**Target Points**: Section 4: 15-18 pts (Good/Satisfactory level)

---

## Overview

Implement an AI-powered canvas agent using OpenAI's function calling API. The agent should understand natural language commands and execute them by creating, modifying, and arranging shapes on the canvas. This is the highest-value feature section (25 points total).

---

## Architecture

### High-Level Flow

```
User Input → Command Parser → OpenAI Function Calling → Command Executor → Canvas Update → Convex Sync
```

### Component Breakdown

1. **AI Input UI**: Chat-like interface for user commands
2. **OpenAI Client**: API integration with function calling
3. **Command Parser**: Translate OpenAI function calls to canvas operations
4. **Command Executor**: Execute operations on canvas
5. **Feedback System**: Show AI thinking/success/error states

### Execution Strategy

**Local Execution (Phase 3)**:
- User types command in AI input
- Send to OpenAI API (client-side)
- OpenAI returns function calls
- Execute locally, create shapes via normal Convex mutations
- Results sync across users like any other shape

**Future Enhancement** (for A-level):
- Move AI execution to Convex actions
- Store command history in Convex
- Broadcast "AI is thinking..." to all users
- Multi-user AI command queue

---

## Implementation Details

### 1. OpenAI Integration
**Complexity**: Low
**Files**: `lib/ai/openai-client.ts`

**Setup**:
```typescript
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // Client-side for now
});

export const executeCommand = async (
  userMessage: string,
  canvasContext: CanvasContext
): Promise<CommandResult> => {
  const response = await openai.chat.completions.create({
    model: "gpt-4o", // or gpt-4o-mini for speed
    messages: [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: userMessage,
      },
    ],
    tools: AI_TOOLS,
    tool_choice: "auto",
  });

  // Process function calls
  const toolCalls = response.choices[0].message.tool_calls;

  if (!toolCalls) {
    return { success: false, error: "No action understood" };
  }

  // Execute each function call
  const results = await Promise.all(
    toolCalls.map(call => executeToolCall(call, canvasContext))
  );

  return { success: true, results };
};
```

**Environment Variable**:
```bash
# .env.local
NEXT_PUBLIC_OPENAI_API_KEY=sk-...
```

**System Prompt**:
```typescript
const SYSTEM_PROMPT = `You are a canvas design assistant. You can create and manipulate shapes on a collaborative canvas.

Available shapes: rectangle, circle, ellipse, line, text
Canvas dimensions: 2000x2000 pixels
Canvas center: (1000, 1000)

When the user asks you to create or modify shapes, use the provided functions.

Guidelines:
- Default positions to center (1000, 1000) if not specified
- Default sizes: rectangles/circles 100px, text 16px font
- Use sensible spacing when creating multiple shapes (e.g., 150px apart)
- For colors, use hex values (e.g., #3b82f6)
- For relative positions like "to the right", offset by ~150px
- For layouts (row/column/grid), calculate positions mathematically

Be helpful and assume reasonable defaults when user is vague.`;
```

---

### 2. Function/Tool Definitions
**Complexity**: Medium
**Files**: `lib/ai/tools.ts`

Define OpenAI functions for canvas operations:

```typescript
export const AI_TOOLS: OpenAI.Chat.ChatCompletionTool[] = [
  // CREATION COMMANDS
  {
    type: "function",
    function: {
      name: "create_rectangle",
      description: "Create a rectangle on the canvas",
      parameters: {
        type: "object",
        properties: {
          x: { type: "number", description: "X position (center)" },
          y: { type: "number", description: "Y position (center)" },
          width: { type: "number", description: "Width in pixels" },
          height: { type: "number", description: "Height in pixels" },
          fill: { type: "string", description: "Fill color (hex)" },
        },
        required: ["x", "y", "width", "height"],
      },
    },
  },

  {
    type: "function",
    function: {
      name: "create_circle",
      description: "Create a circle on the canvas",
      parameters: {
        type: "object",
        properties: {
          x: { type: "number", description: "X position (center)" },
          y: { type: "number", description: "Y position (center)" },
          radius: { type: "number", description: "Radius in pixels" },
          fill: { type: "string", description: "Fill color (hex)" },
        },
        required: ["x", "y", "radius"],
      },
    },
  },

  {
    type: "function",
    function: {
      name: "create_text",
      description: "Create a text element on the canvas",
      parameters: {
        type: "object",
        properties: {
          x: { type: "number", description: "X position" },
          y: { type: "number", description: "Y position" },
          text: { type: "string", description: "Text content" },
          fontSize: { type: "number", description: "Font size in pixels" },
          fill: { type: "string", description: "Text color (hex)" },
        },
        required: ["x", "y", "text"],
      },
    },
  },

  // MANIPULATION COMMANDS
  {
    type: "function",
    function: {
      name: "update_shape",
      description: "Update an existing shape's properties",
      parameters: {
        type: "object",
        properties: {
          selector: {
            type: "string",
            description: "How to identify the shape (e.g., 'the red rectangle', 'the circle', 'all shapes')",
          },
          x: { type: "number", description: "New X position" },
          y: { type: "number", description: "New Y position" },
          fill: { type: "string", description: "New fill color" },
          width: { type: "number", description: "New width" },
          height: { type: "number", description: "New height" },
        },
        required: ["selector"],
      },
    },
  },

  {
    type: "function",
    function: {
      name: "delete_shape",
      description: "Delete shape(s) from the canvas",
      parameters: {
        type: "object",
        properties: {
          selector: {
            type: "string",
            description: "How to identify the shape (e.g., 'the blue circle', 'all rectangles')",
          },
        },
        required: ["selector"],
      },
    },
  },

  // LAYOUT COMMANDS
  {
    type: "function",
    function: {
      name: "arrange_shapes",
      description: "Arrange multiple shapes in a layout",
      parameters: {
        type: "object",
        properties: {
          selector: {
            type: "string",
            description: "Which shapes to arrange (e.g., 'all shapes', 'the rectangles')",
          },
          layout: {
            type: "string",
            enum: ["horizontal_row", "vertical_column", "grid"],
            description: "Layout type",
          },
          spacing: {
            type: "number",
            description: "Spacing between shapes in pixels",
          },
          gridColumns: {
            type: "number",
            description: "Number of columns (for grid layout)",
          },
        },
        required: ["selector", "layout"],
      },
    },
  },

  // COMPLEX COMMANDS
  {
    type: "function",
    function: {
      name: "create_component",
      description: "Create a complex UI component made of multiple shapes",
      parameters: {
        type: "object",
        properties: {
          componentType: {
            type: "string",
            enum: ["button", "card", "navbar", "input_field", "login_form"],
            description: "Type of component to create",
          },
          x: { type: "number", description: "X position (top-left)" },
          y: { type: "number", description: "Y position (top-left)" },
          text: { type: "string", description: "Text content (if applicable)" },
          width: { type: "number", description: "Component width" },
          height: { type: "number", description: "Component height" },
        },
        required: ["componentType", "x", "y"],
      },
    },
  },
];
```

**Total Functions**: 7 (meets 6-8 requirement)

**Categories Covered**:
- ✅ Creation (3): create_rectangle, create_circle, create_text
- ✅ Manipulation (2): update_shape, delete_shape
- ✅ Layout (1): arrange_shapes
- ✅ Complex (1): create_component

---

### 3. Command Executor
**Complexity**: Medium-High
**Files**: `lib/ai/command-executor.ts`

Execute OpenAI function calls:

```typescript
import { useConvexMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export interface CanvasContext {
  shapes: Shape[];
  createShape: (data: ShapeData) => Promise<Id<"shapes">>;
  updateShape: (id: Id<"shapes">, data: Partial<ShapeData>) => Promise<void>;
  deleteShape: (id: Id<"shapes">) => Promise<void>;
  canvasWidth: number;
  canvasHeight: number;
}

export const executeToolCall = async (
  toolCall: OpenAI.Chat.ChatCompletionMessageToolCall,
  context: CanvasContext
): Promise<ExecutionResult> => {
  const { name, arguments: args } = toolCall.function;
  const params = JSON.parse(args);

  switch (name) {
    case "create_rectangle":
      return createRectangle(params, context);

    case "create_circle":
      return createCircle(params, context);

    case "create_text":
      return createText(params, context);

    case "update_shape":
      return updateShape(params, context);

    case "delete_shape":
      return deleteShape(params, context);

    case "arrange_shapes":
      return arrangeShapes(params, context);

    case "create_component":
      return createComponent(params, context);

    default:
      return { success: false, error: `Unknown function: ${name}` };
  }
};

// Implementation of each function:

const createRectangle = async (
  params: { x: number; y: number; width: number; height: number; fill?: string },
  context: CanvasContext
): Promise<ExecutionResult> => {
  const shapeId = await context.createShape({
    type: "rectangle",
    x: params.x,
    y: params.y,
    width: params.width,
    height: params.height,
    fill: params.fill || "#3b82f6",
    angle: 0,
  });

  return {
    success: true,
    message: `Created rectangle at (${params.x}, ${params.y})`,
    shapeIds: [shapeId],
  };
};

const createCircle = async (
  params: { x: number; y: number; radius: number; fill?: string },
  context: CanvasContext
): Promise<ExecutionResult> => {
  const shapeId = await context.createShape({
    type: "circle",
    x: params.x,
    y: params.y,
    width: params.radius * 2,
    height: params.radius * 2,
    fill: params.fill || "#3b82f6",
  });

  return {
    success: true,
    message: `Created circle at (${params.x}, ${params.y})`,
    shapeIds: [shapeId],
  };
};

const createText = async (
  params: { x: number; y: number; text: string; fontSize?: number; fill?: string },
  context: CanvasContext
): Promise<ExecutionResult> => {
  const shapeId = await context.createShape({
    type: "text",
    x: params.x,
    y: params.y,
    text: params.text,
    fontSize: params.fontSize || 16,
    fontFamily: "Inter, Arial, sans-serif",
    fill: params.fill || "#ffffff",
    width: 200, // Placeholder
    height: params.fontSize || 16,
  });

  return {
    success: true,
    message: `Created text "${params.text}" at (${params.x}, ${params.y})`,
    shapeIds: [shapeId],
  };
};

// MANIPULATION FUNCTIONS

const updateShape = async (
  params: { selector: string; x?: number; y?: number; fill?: string; width?: number; height?: number },
  context: CanvasContext
): Promise<ExecutionResult> => {
  // Resolve selector to shape IDs
  const targetShapes = resolveSelector(params.selector, context.shapes);

  if (targetShapes.length === 0) {
    return { success: false, error: `No shapes found matching "${params.selector}"` };
  }

  // Update each shape
  await Promise.all(
    targetShapes.map(shape =>
      context.updateShape(shape._id, {
        x: params.x ?? shape.x,
        y: params.y ?? shape.y,
        fill: params.fill ?? shape.fill,
        width: params.width ?? shape.width,
        height: params.height ?? shape.height,
      })
    )
  );

  return {
    success: true,
    message: `Updated ${targetShapes.length} shape(s)`,
    shapeIds: targetShapes.map(s => s._id),
  };
};

const deleteShape = async (
  params: { selector: string },
  context: CanvasContext
): Promise<ExecutionResult> => {
  const targetShapes = resolveSelector(params.selector, context.shapes);

  if (targetShapes.length === 0) {
    return { success: false, error: `No shapes found matching "${params.selector}"` };
  }

  await Promise.all(targetShapes.map(shape => context.deleteShape(shape._id)));

  return {
    success: true,
    message: `Deleted ${targetShapes.length} shape(s)`,
    shapeIds: targetShapes.map(s => s._id),
  };
};

// LAYOUT FUNCTIONS

const arrangeShapes = async (
  params: { selector: string; layout: string; spacing?: number; gridColumns?: number },
  context: CanvasContext
): Promise<ExecutionResult> => {
  const targetShapes = resolveSelector(params.selector, context.shapes);
  const spacing = params.spacing || 150;

  if (targetShapes.length === 0) {
    return { success: false, error: "No shapes to arrange" };
  }

  // Calculate positions based on layout type
  let positions: { x: number; y: number }[] = [];

  switch (params.layout) {
    case "horizontal_row":
      positions = targetShapes.map((_, i) => ({
        x: 500 + i * spacing,
        y: 500,
      }));
      break;

    case "vertical_column":
      positions = targetShapes.map((_, i) => ({
        x: 500,
        y: 500 + i * spacing,
      }));
      break;

    case "grid":
      const cols = params.gridColumns || 3;
      positions = targetShapes.map((_, i) => ({
        x: 500 + (i % cols) * spacing,
        y: 500 + Math.floor(i / cols) * spacing,
      }));
      break;
  }

  // Update positions
  await Promise.all(
    targetShapes.map((shape, i) =>
      context.updateShape(shape._id, {
        x: positions[i].x,
        y: positions[i].y,
      })
    )
  );

  return {
    success: true,
    message: `Arranged ${targetShapes.length} shapes in ${params.layout}`,
    shapeIds: targetShapes.map(s => s._id),
  };
};

// COMPLEX FUNCTIONS

const createComponent = async (
  params: { componentType: string; x: number; y: number; text?: string; width?: number; height?: number },
  context: CanvasContext
): Promise<ExecutionResult> => {
  const createdIds: Id<"shapes">[] = [];

  switch (params.componentType) {
    case "button":
      // Create rectangle + text
      const buttonBg = await context.createShape({
        type: "rectangle",
        x: params.x,
        y: params.y,
        width: params.width || 120,
        height: params.height || 40,
        fill: "#3b82f6",
      });

      const buttonText = await context.createShape({
        type: "text",
        x: params.x,
        y: params.y,
        text: params.text || "Button",
        fontSize: 14,
        fontFamily: "Inter, Arial, sans-serif",
        fill: "#ffffff",
        width: 100,
        height: 14,
      });

      createdIds.push(buttonBg, buttonText);
      break;

    case "login_form":
      // Create title + 2 input fields (rectangles) + button
      const title = await context.createShape({
        type: "text",
        x: params.x,
        y: params.y,
        text: "Login",
        fontSize: 24,
        fontFamily: "Inter, Arial, sans-serif",
        fill: "#ffffff",
        width: 100,
        height: 24,
      });

      const usernameField = await context.createShape({
        type: "rectangle",
        x: params.x,
        y: params.y + 60,
        width: 250,
        height: 40,
        fill: "#1e293b",
      });

      const passwordField = await context.createShape({
        type: "rectangle",
        x: params.x,
        y: params.y + 120,
        width: 250,
        height: 40,
        fill: "#1e293b",
      });

      const submitButton = await context.createShape({
        type: "rectangle",
        x: params.x,
        y: params.y + 180,
        width: 250,
        height: 40,
        fill: "#3b82f6",
      });

      createdIds.push(title, usernameField, passwordField, submitButton);
      break;

    // Add more component types as needed
  }

  return {
    success: true,
    message: `Created ${params.componentType} component`,
    shapeIds: createdIds,
  };
};

// HELPER: Resolve selector to shape IDs
const resolveSelector = (selector: string, shapes: Shape[]): Shape[] => {
  const lower = selector.toLowerCase();

  // Match by color
  if (lower.includes("red")) return shapes.filter(s => s.fill?.includes("f44") || s.fill?.includes("red"));
  if (lower.includes("blue")) return shapes.filter(s => s.fill?.includes("3b82f6") || s.fill?.includes("blue"));
  if (lower.includes("green")) return shapes.filter(s => s.fill?.includes("22c55e") || s.fill?.includes("green"));

  // Match by type
  if (lower.includes("rectangle")) return shapes.filter(s => s.type === "rectangle");
  if (lower.includes("circle")) return shapes.filter(s => s.type === "circle");
  if (lower.includes("text")) return shapes.filter(s => s.type === "text");

  // Match "all"
  if (lower.includes("all")) return shapes;

  // Match "the" + type (singular) → return most recent
  if (lower.startsWith("the ")) {
    const type = lower.replace("the ", "").trim();
    const matching = shapes.filter(s => s.type.includes(type) || s.fill?.toLowerCase().includes(type));
    return matching.slice(-1); // Most recent
  }

  return [];
};
```

---

### 4. AI Input UI
**Complexity**: Low-Medium
**Files**: `components/ai/AIInput.tsx`, `components/ai/AIFeedback.tsx`

**AIInput Component**:
```typescript
interface AIInputProps {
  onSubmit: (command: string) => void;
  isLoading: boolean;
}

export const AIInput: React.FC<AIInputProps> = ({ onSubmit, isLoading }) => {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    onSubmit(input);
    setInput("");
  };

  return (
    <form onSubmit={handleSubmit} className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[600px]">
      <div className="bg-slate-800/90 backdrop-blur-sm rounded-lg border border-slate-700 p-3 shadow-lg">
        <div className="flex items-center gap-3">
          {isLoading && <Spinner />}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask AI to create or modify shapes..."
            className="flex-1 bg-transparent text-white placeholder-slate-400 outline-none"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded text-white text-sm font-medium disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </form>
  );
};
```

**AIFeedback Component**:
```typescript
interface AIFeedbackProps {
  status: "idle" | "thinking" | "success" | "error";
  message?: string;
}

export const AIFeedback: React.FC<AIFeedbackProps> = ({ status, message }) => {
  if (status === "idle") return null;

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2">
      <div
        className={cn(
          "px-4 py-2 rounded-lg text-sm font-medium",
          status === "thinking" && "bg-purple-600 text-white",
          status === "success" && "bg-green-600 text-white",
          status === "error" && "bg-red-600 text-white"
        )}
      >
        {status === "thinking" && "AI is thinking..."}
        {status === "success" && (message || "Done!")}
        {status === "error" && (message || "Something went wrong")}
      </div>
    </div>
  );
};
```

**Integration in DashboardClient**:
```typescript
const [aiStatus, setAIStatus] = useState<"idle" | "thinking" | "success" | "error">("idle");
const [aiMessage, setAIMessage] = useState<string>("");

const handleAICommand = async (command: string) => {
  setAIStatus("thinking");

  try {
    const context: CanvasContext = {
      shapes,
      createShape: createShapeMutation,
      updateShape: updateShapeMutation,
      deleteShape: deleteShapeMutation,
      canvasWidth: 2000,
      canvasHeight: 2000,
    };

    const result = await executeCommand(command, context);

    if (result.success) {
      setAIStatus("success");
      setAIMessage(result.message || "Command executed successfully");
    } else {
      setAIStatus("error");
      setAIMessage(result.error || "Failed to execute command");
    }
  } catch (error) {
    setAIStatus("error");
    setAIMessage("An error occurred");
    console.error(error);
  }

  // Reset after 3 seconds
  setTimeout(() => setAIStatus("idle"), 3000);
};

return (
  <>
    {/* ... existing canvas, toolbar ... */}
    <AIInput onSubmit={handleAICommand} isLoading={aiStatus === "thinking"} />
    <AIFeedback status={aiStatus} message={aiMessage} />
  </>
);
```

---

### 5. Testing & Examples
**Complexity**: Low

**Test Commands** (document these):

**Creation Commands**:
1. "Create a red circle at position 500, 500"
2. "Add a text that says 'Hello World' at 600, 400"
3. "Make a 200x300 blue rectangle at the center"

**Manipulation Commands**:
1. "Move the red circle to 800, 800"
2. "Change the color of the rectangle to green"
3. "Resize the blue rectangle to be 400px wide"
4. "Delete the circle"

**Layout Commands**:
1. "Arrange all shapes in a horizontal row"
2. "Create a 3x3 grid of squares"
3. "Space the rectangles evenly in a column"

**Complex Commands**:
1. "Create a button that says 'Submit'"
2. "Build a login form at 500, 300"
3. "Make a navigation bar with 4 menu items"

---

## Files to Create

### New Directories:
- `lib/ai/` - AI logic
- `components/ai/` - AI UI components

### New Files:
- ✏️ `lib/ai/openai-client.ts` - OpenAI API integration
- ✏️ `lib/ai/tools.ts` - Function definitions
- ✏️ `lib/ai/command-executor.ts` - Execute commands
- ✏️ `lib/ai/types.ts` - AI-related types
- ✏️ `components/ai/AIInput.tsx` - Command input UI
- ✏️ `components/ai/AIFeedback.tsx` - Status feedback
- ✏️ `app/dashboard/DashboardClient.tsx` - Integrate AI UI
- ✏️ `.env.local` - Add OpenAI API key

---

## Dependencies

**Install OpenAI SDK**:
```bash
bun add openai
```

**Environment Setup**:
```bash
# .env.local
NEXT_PUBLIC_OPENAI_API_KEY=sk-...
```

---

## Success Criteria

### Command Breadth (10 pts target: 5-6 pts)
- [ ] 6+ distinct command types implemented
- [ ] Covers creation, manipulation, layout, complex categories
- [ ] Commands execute reliably

### Complex Command Execution (8 pts target: 3-4 pts)
- [ ] "Create button" produces rectangle + text
- [ ] "Create login form" produces 3+ elements
- [ ] Layout commands position shapes correctly
- [ ] Handles ambiguity reasonably

### AI Performance & Reliability (7 pts target: 2-3 pts)
- [ ] Sub-3 second responses (using gpt-4o-mini for speed)
- [ ] 60%+ accuracy on test commands
- [ ] Basic UX with loading feedback
- [ ] Results sync across users (via Convex)

**Total Estimated**: 15-18 points (Good/Satisfactory)

---

## Future Enhancements (for A-level)

1. **Move to Server-Side Execution**:
   - Execute AI in Convex actions
   - Store command history
   - Broadcast AI activity to all users

2. **Advanced Selector Parsing**:
   - Support complex queries: "the top-left rectangle"
   - Spatial relationships: "shapes near the circle"
   - Property-based: "all shapes larger than 100px"

3. **Undo/Redo Integration**:
   - AI commands can be undone as a unit
   - Show command in history: "AI: Create login form"

4. **Multi-Step Commands**:
   - "Create a dashboard with 3 cards and a header"
   - Break down into multiple function calls
   - Execute sequentially with animation

5. **AI Suggestions**:
   - Autocomplete common commands
   - Suggest next actions based on context
   - "You might also want to..."

6. **Voice Input**:
   - Use Web Speech API for voice commands
   - "Hey Canvas, create a red circle"

---

## Branching Strategy

**Branch**: `feature/ai-agent`

**Dependencies**:
- All shape types must be implemented
- Color picker should be available
- Copy/paste logic can be leveraged

**Conflicts**:
- Minimal - mostly isolated to new `lib/ai/` and `components/ai/`
- `DashboardClient.tsx` will have UI integration

**Merge Tips**:
- Test thoroughly before merging
- Document test commands in PR
- Include example video of AI in action
- Add OpenAI API key setup to README

---

## Estimated Complexity: Medium-High

**Why**:
- OpenAI integration is straightforward
- Function calling simplifies parsing
- Command execution leverages existing mutations
- Main challenge: selector resolution and error handling
- Multi-step complex commands require careful orchestration

**Time Estimate** (against your request, but FYI):
- OpenAI setup: 30 min
- Function definitions: 1 hour
- Command executor: 2-3 hours
- UI components: 1 hour
- Testing & refinement: 2 hours
- **Total**: ~6-7 hours

---

## Demo Script

For demo video, showcase:
1. "Create a blue rectangle at 500, 500" → instant creation
2. "Add a red circle next to it" → positioned correctly
3. "Change the rectangle to green" → color updates
4. "Arrange them in a horizontal row" → layout applied
5. "Create a login form at 300, 200" → complex multi-shape creation
6. Show multi-user: AI commands sync across browsers

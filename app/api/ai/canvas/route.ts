/**
 * AI Canvas Agent API Route
 * Server-side execution of natural language commands
 */

import type {
  AICommandRequest,
  AICommandResponse,
  ShapeCommand,
} from "@/lib/ai/types";
import { openai } from "@ai-sdk/openai";
import { generateText, tool } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";

// System prompt for the AI assistant
const SYSTEM_PROMPT = `You are a canvas design assistant. You can create and manipulate shapes on a collaborative canvas.

Available shapes: rectangle, circle, ellipse, line, polygon, text
Canvas dimensions: 2000x2000 pixels
Canvas center: (1000, 1000)

When the user asks you to create or modify shapes, use the provided functions.

IMPORTANT - Selection Context:
- If shapes are selected, they will be listed as "CURRENTLY SELECTED SHAPES" below with their current dimensions
- When shapes are selected AND the user says "change this", "move it", "edit this color", etc., you MUST omit the selector parameter or use selector: "selected"
- NEVER use "all shapes" or color-based selectors when shapes are currently selected and the command refers to "this" or "it"
- You can also target shapes by ID or number (e.g., "rectangle 14" = 14th rectangle by creation order)

IMPORTANT - Relative Sizing:
- Use the 'resize_shape' tool for relative changes like "100 pixels wider", "50 pixels taller", "twice as big"
- For "X pixels wider", use widthDelta: X (e.g., "100 pixels wider" = widthDelta: 100)
- For "X pixels narrower", use widthDelta: -X (e.g., "50 pixels narrower" = widthDelta: -50)
- For "X pixels taller", use heightDelta: X (e.g., "50 pixels taller" = heightDelta: 50)
- For "X pixels shorter", use heightDelta: -X (e.g., "25 pixels shorter" = heightDelta: -25)
- For "twice as big", use scale: 2
- For "half the size", use scale: 0.5
- The system will automatically calculate the final dimensions based on current size

Guidelines:
- Default positions to center (1000, 1000) if not specified
- Default sizes: rectangles/circles/ellipses 100px, text 16px font, lines 200px, polygons radius 50px
- Use sensible spacing when creating multiple shapes (e.g., 150px apart)
- For colors, use hex values (e.g., #3b82f6 for blue, #ef4444 for red, #22c55e for green)
- For relative positions like "to the right", offset by ~150px
- For layouts (row/column), calculate positions mathematically
- For lines, default stroke color is white (#ffffff), strokeWidth is 2
- For polygons: 3 sides = triangle, 5 = pentagon, 6 = hexagon, 8 = octagon

Be helpful and assume reasonable defaults when user is vague.`;

// Define AI tools
const tools = {
  create_rectangle: tool({
    description: "Create a rectangle on the canvas",
    inputSchema: z.object({
      x: z.number().describe("X position (center)"),
      y: z.number().describe("Y position (center)"),
      width: z.number().describe("Width in pixels"),
      height: z.number().describe("Height in pixels"),
      fill: z.string().describe("Fill color (hex)"),
    }),
  }),

  create_circle: tool({
    description: "Create a circle on the canvas",
    inputSchema: z.object({
      x: z.number().describe("X position (center)"),
      y: z.number().describe("Y position (center)"),
      radius: z.number().describe("Radius in pixels"),
      fill: z.string().describe("Fill color (hex)"),
    }),
  }),

  create_text: tool({
    description: "Create a text element on the canvas",
    inputSchema: z.object({
      x: z.number().describe("X position"),
      y: z.number().describe("Y position"),
      text: z.string().describe("Text content"),
      fontSize: z.number().describe("Font size in pixels"),
      fill: z.string().describe("Text color (hex)"),
    }),
  }),

  create_ellipse: tool({
    description: "Create an ellipse on the canvas",
    inputSchema: z.object({
      x: z.number().describe("X position (center)"),
      y: z.number().describe("Y position (center)"),
      width: z.number().describe("Width in pixels"),
      height: z.number().describe("Height in pixels"),
      fill: z.string().describe("Fill color (hex)"),
    }),
  }),

  create_line: tool({
    description: "Create a line on the canvas",
    inputSchema: z.object({
      x1: z.number().describe("Start X position"),
      y1: z.number().describe("Start Y position"),
      x2: z.number().describe("End X position"),
      y2: z.number().describe("End Y position"),
      strokeWidth: z
        .number()
        .optional()
        .describe("Line width in pixels (default 2)"),
      strokeColor: z.string().describe("Line color (hex)"),
    }),
  }),

  create_polygon: tool({
    description:
      "Create a polygon on the canvas (triangle, pentagon, hexagon, etc.)",
    inputSchema: z.object({
      x: z.number().describe("X position (center)"),
      y: z.number().describe("Y position (center)"),
      sides: z
        .number()
        .describe("Number of sides (3=triangle, 5=pentagon, 6=hexagon, etc.)"),
      radius: z.number().describe("Radius from center to vertices in pixels"),
      fill: z.string().describe("Fill color (hex)"),
    }),
  }),

  update_shape: tool({
    description:
      "Update an existing shape's properties. Can target by selection, ID, number, or description.",
    inputSchema: z.object({
      selector: z
        .string()
        .optional()
        .describe(
          "How to identify the shape (e.g., 'the red rectangle', 'rectangle 14', shape ID, or 'selected'). If omitted and shapes are selected, will update selected shapes.",
        ),
      x: z.number().optional().describe("New X position (absolute value)"),
      y: z.number().optional().describe("New Y position (absolute value)"),
      fill: z.string().optional().describe("New fill color"),
      width: z
        .number()
        .optional()
        .describe(
          "New width (absolute value - calculate from current width if relative change requested)",
        ),
      height: z
        .number()
        .optional()
        .describe(
          "New height (absolute value - calculate from current height if relative change requested)",
        ),
      angle: z
        .number()
        .optional()
        .describe("New rotation angle in degrees (absolute value)"),
    }),
  }),

  arrange_shapes: tool({
    description: "Arrange multiple shapes in a layout",
    inputSchema: z.object({
      selector: z
        .string()
        .describe(
          "Which shapes to arrange (e.g., 'all shapes', 'the rectangles')",
        ),
      layout: z
        .enum(["horizontal_row", "vertical_column"])
        .describe("Layout type"),
      spacing: z
        .number()
        .optional()
        .describe("Spacing between shapes in pixels"),
    }),
  }),

  resize_shape: tool({
    description:
      "Resize shape(s) with relative changes. Use for 'X pixels wider/taller', 'twice as big', etc.",
    inputSchema: z.object({
      selector: z
        .string()
        .optional()
        .describe(
          "Which shape to resize. If omitted and shapes are selected, will resize selected shapes.",
        ),
      widthDelta: z
        .number()
        .optional()
        .describe(
          "Change in width in pixels (positive = wider, negative = narrower). E.g., 100 for '100 pixels wider'",
        ),
      heightDelta: z
        .number()
        .optional()
        .describe(
          "Change in height in pixels (positive = taller, negative = shorter). E.g., 50 for '50 pixels taller'",
        ),
      scale: z
        .number()
        .optional()
        .describe(
          "Scale multiplier for both dimensions. E.g., 2 for 'twice as big', 0.5 for 'half size'",
        ),
    }),
  }),

  delete_shape: tool({
    description: "Delete shape(s) from the canvas",
    inputSchema: z.object({
      selector: z
        .string()
        .optional()
        .describe(
          "Which shape(s) to delete. If omitted and shapes are selected, will delete selected shapes.",
        ),
    }),
  }),

  duplicate_shape: tool({
    description: "Duplicate shape(s) on the canvas",
    inputSchema: z.object({
      selector: z
        .string()
        .optional()
        .describe(
          "Which shape(s) to duplicate. If omitted and shapes are selected, will duplicate selected shapes.",
        ),
      offsetX: z
        .number()
        .optional()
        .describe("Horizontal offset for duplicate in pixels (default: 10)"),
      offsetY: z
        .number()
        .optional()
        .describe("Vertical offset for duplicate in pixels (default: 10)"),
    }),
  }),

  rotate_shape: tool({
    description: "Rotate shape(s) on the canvas",
    inputSchema: z.object({
      selector: z
        .string()
        .optional()
        .describe(
          "Which shape(s) to rotate. If omitted and shapes are selected, will rotate selected shapes.",
        ),
      angle: z
        .number()
        .describe(
          "Rotation angle in degrees. Use positive for clockwise, negative for counter-clockwise.",
        ),
      relative: z
        .boolean()
        .optional()
        .describe(
          "If true, add to current rotation. If false, set absolute rotation. Default: true.",
        ),
    }),
  }),
};

export const POST = async (request: Request) => {
  try {
    // Parse request body
    const body: AICommandRequest = await request.json();
    const { command, shapes, selectedShapeIds = [] } = body;

    if (!command || typeof command !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid command",
          commands: [],
        } as AICommandResponse,
        { status: 400 },
      );
    }

    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          message: "OpenAI API key not configured",
          commands: [],
        } as AICommandResponse,
        { status: 500 },
      );
    }

    // Build context about current shapes
    const getShapePosition = (s: any) => {
      if (s.type === "line") {
        return `from (${s.x1},${s.y1}) to (${s.x2},${s.y2})`;
      }
      return `at (${s.x || 0},${s.y || 0})`;
    };

    const getShapeColor = (s: any) => {
      if (s.type === "line") {
        return s.strokeColor || s.fill || "#ffffff";
      }
      return s.fill || "#ffffff";
    };

    const shapesContext =
      shapes.length > 0
        ? `\n\nCurrent shapes on canvas: ${shapes
            .map(
              (s, index) =>
                `${s.type} #${index + 1} (ID: ${s._id}) ${getShapePosition(s)} with color ${getShapeColor(s)}`,
            )
            .join(", ")}`
        : "\n\nCanvas is currently empty.";

    // Build context about selected shapes with dimensions
    const selectedShapes = shapes.filter((s) =>
      selectedShapeIds.includes(s._id),
    );

    const getShapeDimensions = (s: any) => {
      if (s.type === "line") {
        return `line from (${s.x1},${s.y1}) to (${s.x2},${s.y2})`;
      }
      if (s.type === "circle") {
        return `${s.width}px diameter at (${s.x},${s.y})`;
      }
      if (s.type === "text") {
        return `"${s.text}" fontSize ${s.fontSize}px at (${s.x},${s.y})`;
      }
      if (s.type === "rectangle" || s.type === "ellipse") {
        return `${s.width}x${s.height}px at (${s.x},${s.y})`;
      }
      if (s.type === "polygon") {
        return `${s.sides || s.points?.length || "?"} sides at (${s.x},${s.y})`;
      }
      return `at (${s.x || 0},${s.y || 0})`;
    };

    const selectionContext =
      selectedShapes.length > 0
        ? `\n\nCURRENTLY SELECTED SHAPES: ${selectedShapes
            .map((s) => `${s.type} (ID: ${s._id}) - ${getShapeDimensions(s)}`)
            .join(
              ", ",
            )}. Commands like "change this", "move it", "edit this" refer to these selected shapes. Use the dimensions above to calculate relative changes.`
        : "\n\nNo shapes currently selected.";

    // Call OpenAI with tools
    const result = await generateText({
      model: openai("gpt-4o-mini"),
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT + shapesContext + selectionContext,
        },
        {
          role: "user",
          content: command,
        },
      ],
      tools,
    });

    // Extract tool calls from result
    const commands: ShapeCommand[] = [];

    if (result.toolCalls) {
      for (const toolCall of result.toolCalls) {
        // Debug: log the entire tool call object

        // Vercel AI SDK v5 uses different property names
        // Try multiple possible property names for compatibility
        const args = (toolCall as any).input || (toolCall as any).args || {};

        const cmd: any = {
          type: toolCall.toolName,
          ...args,
        };

        commands.push(cmd as ShapeCommand);
      }
    }

    // Build response message
    let message = result.text || "Command executed successfully";
    if (commands.length > 0) {
      message = `Executed ${commands.length} operation(s): ${result.text || "Done"}`;
    }

    return NextResponse.json({
      success: true,
      message,
      commands,
    } as AICommandResponse);
  } catch (error: any) {
    console.error("AI Canvas API Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to process command",
        commands: [],
      } as AICommandResponse,
      { status: 500 },
    );
  }
};

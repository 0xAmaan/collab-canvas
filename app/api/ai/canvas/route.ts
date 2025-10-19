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

Available shapes: rectangle, circle, text
Canvas dimensions: 2000x2000 pixels
Canvas center: (1000, 1000)

When the user asks you to create or modify shapes, use the provided functions.

Guidelines:
- Default positions to center (1000, 1000) if not specified
- Default sizes: rectangles/circles 100px, text 16px font
- Use sensible spacing when creating multiple shapes (e.g., 150px apart)
- For colors, use hex values (e.g., #3b82f6 for blue, #ef4444 for red, #22c55e for green)
- For relative positions like "to the right", offset by ~150px
- For layouts (row/column), calculate positions mathematically

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

  update_shape: tool({
    description: "Update an existing shape's properties",
    inputSchema: z.object({
      selector: z
        .string()
        .describe(
          "How to identify the shape (e.g., 'the red rectangle', 'the circle', 'all shapes')",
        ),
      x: z.number().optional().describe("New X position"),
      y: z.number().optional().describe("New Y position"),
      fill: z.string().optional().describe("New fill color"),
      width: z.number().optional().describe("New width"),
      height: z.number().optional().describe("New height"),
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
};

export async function POST(request: Request) {
  try {
    // Parse request body
    const body: AICommandRequest = await request.json();
    const { command, shapes } = body;

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
    const shapesContext =
      shapes.length > 0
        ? `\n\nCurrent shapes on canvas: ${shapes
            .map(
              (s) =>
                `${s.type} at (${s.type === "line" ? `${s.x1},${s.y1} to ${s.x2},${s.y2}` : `${s.x},${s.y}`}) with color ${s.fillColor}`,
            )
            .join(", ")}`
        : "\n\nCanvas is currently empty.";

    // Call OpenAI with tools
    const result = await generateText({
      model: openai("gpt-4o-mini"),
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT + shapesContext,
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
}

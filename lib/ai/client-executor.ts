/**
 * Client-side executor for AI commands
 * Translates AI commands into Convex mutations
 */

import type { Shape } from "@/types/shapes";
import type {
  ShapeCommand,
  CreateRectangleCommand,
  CreateCircleCommand,
  CreateTextCommand,
  UpdateShapeCommand,
  ArrangeShapesCommand,
} from "@/lib/ai/types";

interface ExecutorContext {
  shapes: Shape[];
  createShape: (shape: any) => Promise<string>;
  updateShape: (shapeId: string, updates: any) => Promise<void>;
}

/**
 * Convert hex color to RGB
 */
const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

/**
 * Check if RGB values match a color name using heuristics
 */
const rgbMatchesColorName = (
  r: number,
  g: number,
  b: number,
  colorName: string,
): boolean => {
  // Normalize to 0-1 range
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;

  // Find dominant channel
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const saturation = max === 0 ? 0 : (max - min) / max;

  // Low saturation = gray/white/black
  if (saturation < 0.2) {
    if (colorName === "gray" || colorName === "grey") return true;
    if (colorName === "white" && max > 0.8) return true;
    if (colorName === "black" && max < 0.2) return true;
    return false;
  }

  // Color matching based on dominant channels
  switch (colorName.toLowerCase()) {
    case "red":
      return rn > gn && rn > bn && rn > 0.5;
    case "green":
      return gn > rn && gn > bn && gn > 0.4;
    case "blue":
      return bn > rn && bn > gn && bn > 0.5;
    case "yellow":
      return rn > 0.6 && gn > 0.6 && bn < 0.5;
    case "cyan":
    case "aqua":
      return gn > 0.5 && bn > 0.5 && rn < 0.5;
    case "magenta":
    case "pink":
      return rn > 0.5 && bn > 0.4 && gn < rn * 0.8;
    case "purple":
    case "violet":
      return rn > 0.4 && bn > 0.4 && gn < Math.min(rn, bn) * 0.8;
    case "orange":
      return rn > 0.7 && gn > 0.3 && gn < 0.7 && bn < 0.4;
    case "brown":
      return rn > 0.3 && gn > 0.2 && bn < 0.3 && rn > gn && max < 0.7;
    case "white":
      return rn > 0.8 && gn > 0.8 && bn > 0.8;
    case "black":
      return max < 0.2;
    case "gray":
    case "grey":
      return saturation < 0.2 && max > 0.2 && max < 0.8;
    default:
      return false;
  }
};

/**
 * Check if a color hex code matches a color name (dynamic)
 */
const isColorMatch = (hex: string | undefined, colorName: string): boolean => {
  if (!hex) return false;
  const lower = hex.toLowerCase();

  // Direct string match in hex (e.g., color name in CSS)
  if (lower.includes(colorName.toLowerCase())) return true;

  // Parse hex and check RGB values
  const rgb = hexToRgb(hex);
  if (!rgb) return false;

  return rgbMatchesColorName(rgb.r, rgb.g, rgb.b, colorName);
};

/**
 * Resolve selector to matching shapes
 */
const resolveSelector = (selector: string, shapes: Shape[]): Shape[] => {
  const lower = selector.toLowerCase();

  // List of common color names to check
  const colorNames = [
    "red",
    "blue",
    "green",
    "yellow",
    "purple",
    "violet",
    "pink",
    "orange",
    "brown",
    "cyan",
    "aqua",
    "magenta",
    "white",
    "black",
    "gray",
    "grey",
  ];

  // Match by color - check all common colors dynamically
  for (const colorName of colorNames) {
    if (lower.includes(colorName)) {
      const matches = shapes.filter((s) => isColorMatch(s.fill, colorName));
      if (matches.length > 0) return matches;
    }
  }

  // Match by type
  if (lower.includes("rectangle"))
    return shapes.filter((s) => s.type === "rectangle");
  if (lower.includes("circle"))
    return shapes.filter((s) => s.type === "circle");
  if (lower.includes("ellipse"))
    return shapes.filter((s) => s.type === "ellipse");
  if (lower.includes("text")) return shapes.filter((s) => s.type === "text");
  if (lower.includes("line")) return shapes.filter((s) => s.type === "line");

  // Match "all"
  if (lower.includes("all")) return shapes;

  // Match "the" + type (singular) → return most recent
  if (lower.startsWith("the ")) {
    const type = lower.replace("the ", "").trim();
    const matching = shapes.filter(
      (s) => s.type.includes(type) || s.fill?.toLowerCase().includes(type),
    );
    return matching.slice(-1); // Most recent
  }

  return [];
};

/**
 * Execute create rectangle command
 */
async function executeCreateRectangle(
  cmd: CreateRectangleCommand,
  context: ExecutorContext,
): Promise<string> {
  const shapeId = await context.createShape({
    type: "rectangle",
    x: cmd.x,
    y: cmd.y,
    width: cmd.width || 100,
    height: cmd.height || 100,
    fill: cmd.fill || "#3b82f6",
    angle: 0,
    createdBy: "ai",
    createdAt: Date.now(),
    lastModified: Date.now(),
    lastModifiedBy: "ai",
  });

  return `Created rectangle at (${cmd.x}, ${cmd.y})`;
}

/**
 * Execute create circle command
 */
async function executeCreateCircle(
  cmd: CreateCircleCommand,
  context: ExecutorContext,
): Promise<string> {
  // Ensure radius has a default value
  const radius = cmd.radius || 50;

  const shapeData = {
    type: "circle" as const,
    x: cmd.x,
    y: cmd.y,
    width: radius * 2,
    height: radius * 2,
    fill: cmd.fill,
    angle: 0,
    createdBy: "ai",
    createdAt: Date.now(),
    lastModified: Date.now(),
    lastModifiedBy: "ai",
  };

  const shapeId = await context.createShape(shapeData);

  return `Created circle at (${cmd.x}, ${cmd.y})`;
}

/**
 * Execute create text command
 */
async function executeCreateText(
  cmd: CreateTextCommand,
  context: ExecutorContext,
): Promise<string> {
  const shapeId = await context.createShape({
    type: "text",
    x: cmd.x,
    y: cmd.y,
    text: cmd.text || "Text",
    fontSize: cmd.fontSize || 16,
    fontFamily: "Inter, Arial, sans-serif",
    fill: cmd.fill || "#ffffff",
    createdBy: "ai",
    createdAt: Date.now(),
    lastModified: Date.now(),
    lastModifiedBy: "ai",
  });

  return `Created text "${cmd.text}" at (${cmd.x}, ${cmd.y})`;
}

/**
 * Execute update shape command
 */
async function executeUpdateShape(
  cmd: UpdateShapeCommand,
  context: ExecutorContext,
): Promise<string> {
  const targetShapes = resolveSelector(cmd.selector, context.shapes);

  if (targetShapes.length === 0) {
    throw new Error(`No shapes found matching "${cmd.selector}"`);
  }

  // Build updates object
  const updates: any = {};
  if (cmd.x !== undefined) updates.x = cmd.x;
  if (cmd.y !== undefined) updates.y = cmd.y;
  if (cmd.fill !== undefined) updates.fill = cmd.fill;
  if (cmd.width !== undefined) updates.width = cmd.width;
  if (cmd.height !== undefined) updates.height = cmd.height;

  // Update each shape
  await Promise.all(
    targetShapes.map((shape) => context.updateShape(shape._id, updates)),
  );

  return `Updated ${targetShapes.length} shape(s)`;
}

/**
 * Execute arrange shapes command
 */
async function executeArrangeShapes(
  cmd: ArrangeShapesCommand,
  context: ExecutorContext,
): Promise<string> {
  const targetShapes = resolveSelector(cmd.selector, context.shapes);
  const spacing = cmd.spacing || 150;

  if (targetShapes.length === 0) {
    throw new Error("No shapes to arrange");
  }

  // Calculate positions based on layout type
  let positions: { x: number; y: number }[] = [];

  switch (cmd.layout) {
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
  }

  // Update positions
  await Promise.all(
    targetShapes.map((shape, i) =>
      context.updateShape(shape._id, {
        x: positions[i].x,
        y: positions[i].y,
      }),
    ),
  );

  return `Arranged ${targetShapes.length} shapes in ${cmd.layout}`;
}

/**
 * Execute a single command
 */
async function executeCommand(
  command: ShapeCommand,
  context: ExecutorContext,
): Promise<string> {
  switch (command.type) {
    case "create_rectangle":
      return executeCreateRectangle(command, context);

    case "create_circle":
      return executeCreateCircle(command, context);

    case "create_text":
      return executeCreateText(command, context);

    case "update_shape":
      return executeUpdateShape(command, context);

    case "arrange_shapes":
      return executeArrangeShapes(command, context);

    default:
      throw new Error(`Unknown command type: ${(command as any).type}`);
  }
}

/**
 * Execute all commands from AI response
 */
export async function executeAICommands(
  commands: ShapeCommand[],
  context: ExecutorContext,
): Promise<{ success: boolean; message: string }> {
  try {
    if (commands.length === 0) {
      return {
        success: true,
        message: "No operations to execute",
      };
    }

    // Execute all commands
    const results = await Promise.all(
      commands.map((cmd) => executeCommand(cmd, context)),
    );

    return {
      success: true,
      message: results.join(", "),
    };
  } catch (error: any) {
    console.error("Failed to execute AI commands:", error);
    return {
      success: false,
      message: error.message || "Failed to execute commands",
    };
  }
}

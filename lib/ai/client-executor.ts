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
  CreateEllipseCommand,
  CreateLineCommand,
  CreatePolygonCommand,
  UpdateShapeCommand,
  ArrangeShapesCommand,
  ResizeShapeCommand,
  DeleteShapeCommand,
  DuplicateShapeCommand,
  RotateShapeCommand,
} from "@/lib/ai/types";

interface ExecutorContext {
  shapes: Shape[];
  createShape: (shape: any) => Promise<string>;
  updateShape: (shapeId: string, updates: any) => Promise<void>;
  deleteShape?: (shapeId: string) => Promise<void>;
  selectedShapeIds?: string[]; // IDs of currently selected shapes
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
 * Enhanced to support: selection context, IDs, shape numbers (e.g., "rectangle 14")
 */
const resolveSelector = (
  selector: string | undefined,
  shapes: Shape[],
  selectedShapeIds?: string[],
): Shape[] => {
  // If no selector provided, use selected shapes
  if (!selector || selector.toLowerCase() === "selected") {
    if (selectedShapeIds && selectedShapeIds.length > 0) {
      return shapes.filter((s) => selectedShapeIds.includes(s._id));
    }
    return [];
  }

  const lower = selector.toLowerCase();

  // Match by exact ID
  const byId = shapes.find((s) => s._id === selector);
  if (byId) return [byId];

  // Match by shape number (e.g., "rectangle 14" = 14th rectangle)
  const numberMatch = lower.match(/(\w+)\s+(\d+)/);
  if (numberMatch) {
    const [, shapeType, numberStr] = numberMatch;
    const number = parseInt(numberStr, 10);
    const matchingType = shapes.filter((s) =>
      s.type.toLowerCase().includes(shapeType),
    );
    if (matchingType.length >= number && number > 0) {
      return [matchingType[number - 1]]; // 1-indexed for user
    }
  }

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
 * Execute create ellipse command
 */
async function executeCreateEllipse(
  cmd: CreateEllipseCommand,
  context: ExecutorContext,
): Promise<string> {
  const shapeId = await context.createShape({
    type: "ellipse",
    x: cmd.x,
    y: cmd.y,
    width: cmd.width || 100,
    height: cmd.height || 60,
    fill: cmd.fill || "#3b82f6",
    angle: 0,
    createdBy: "ai",
    createdAt: Date.now(),
    lastModified: Date.now(),
    lastModifiedBy: "ai",
  });

  return `Created ellipse at (${cmd.x}, ${cmd.y})`;
}

/**
 * Execute create line command
 */
async function executeCreateLine(
  cmd: CreateLineCommand,
  context: ExecutorContext,
): Promise<string> {
  const shapeId = await context.createShape({
    type: "line",
    x1: cmd.x1,
    y1: cmd.y1,
    x2: cmd.x2,
    y2: cmd.y2,
    strokeWidth: cmd.strokeWidth || 2,
    strokeColor: cmd.strokeColor || "#ffffff",
    fill: cmd.strokeColor || "#ffffff", // For consistency
    createdBy: "ai",
    createdAt: Date.now(),
    lastModified: Date.now(),
    lastModifiedBy: "ai",
  });

  return `Created line from (${cmd.x1}, ${cmd.y1}) to (${cmd.x2}, ${cmd.y2})`;
}

/**
 * Execute create polygon command
 */
async function executeCreatePolygon(
  cmd: CreatePolygonCommand,
  context: ExecutorContext,
): Promise<string> {
  // Calculate polygon points based on sides and radius
  const points: { x: number; y: number }[] = [];
  const sides = cmd.sides || 6;
  const radius = cmd.radius || 50;

  for (let i = 0; i < sides; i++) {
    const angle = (i * 2 * Math.PI) / sides - Math.PI / 2; // Start at top
    points.push({
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    });
  }

  const shapeId = await context.createShape({
    type: "polygon",
    x: cmd.x,
    y: cmd.y,
    points,
    width: radius * 2,
    height: radius * 2,
    fill: cmd.fill || "#3b82f6",
    angle: 0,
    createdBy: "ai",
    createdAt: Date.now(),
    lastModified: Date.now(),
    lastModifiedBy: "ai",
  });

  const shapeName =
    sides === 3
      ? "triangle"
      : sides === 5
        ? "pentagon"
        : sides === 6
          ? "hexagon"
          : sides === 8
            ? "octagon"
            : `${sides}-sided polygon`;

  return `Created ${shapeName} at (${cmd.x}, ${cmd.y})`;
}

/**
 * Execute update shape command
 */
async function executeUpdateShape(
  cmd: UpdateShapeCommand,
  context: ExecutorContext,
): Promise<string> {
  const targetShapes = resolveSelector(
    cmd.selector,
    context.shapes,
    context.selectedShapeIds,
  );

  if (targetShapes.length === 0) {
    throw new Error(
      `No shapes found matching "${cmd.selector || "selection"}"`,
    );
  }

  // Build updates object
  const updates: any = {};
  if (cmd.x !== undefined) updates.x = cmd.x;
  if (cmd.y !== undefined) updates.y = cmd.y;
  if (cmd.fill !== undefined) updates.fill = cmd.fill;
  if (cmd.width !== undefined) updates.width = cmd.width;
  if (cmd.height !== undefined) updates.height = cmd.height;
  if ((cmd as any).angle !== undefined) updates.angle = (cmd as any).angle;

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
  const targetShapes = resolveSelector(
    cmd.selector,
    context.shapes,
    context.selectedShapeIds,
  );
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
 * Execute resize shape command (relative sizing with math)
 */
async function executeResizeShape(
  cmd: ResizeShapeCommand,
  context: ExecutorContext,
): Promise<string> {
  const targetShapes = resolveSelector(
    cmd.selector,
    context.shapes,
    context.selectedShapeIds,
  );

  if (targetShapes.length === 0) {
    throw new Error(
      `No shapes found matching "${cmd.selector || "selection"}"`,
    );
  }

  // Resize each shape
  const results = await Promise.all(
    targetShapes.map(async (shape) => {
      const updates: any = {};

      // Get current dimensions
      const currentWidth = "width" in shape ? (shape as any).width : undefined;
      const currentHeight =
        "height" in shape ? (shape as any).height : undefined;

      // Apply scale if provided (multiplier for both dimensions)
      if (cmd.scale !== undefined) {
        if (currentWidth !== undefined) {
          updates.width = Math.round(currentWidth * cmd.scale);
        }
        if (currentHeight !== undefined) {
          updates.height = Math.round(currentHeight * cmd.scale);
        }
        // For circles, update diameter
        if (shape.type === "circle" && currentWidth !== undefined) {
          updates.width = Math.round(currentWidth * cmd.scale);
          updates.height = Math.round(currentWidth * cmd.scale); // Keep circular
        }
      }

      // Apply width delta (additive change)
      if (cmd.widthDelta !== undefined && currentWidth !== undefined) {
        updates.width = currentWidth + cmd.widthDelta;
      }

      // Apply height delta (additive change)
      if (cmd.heightDelta !== undefined && currentHeight !== undefined) {
        updates.height = currentHeight + cmd.heightDelta;
      }

      // For circles, keep dimensions equal (maintain circular shape)
      if (shape.type === "circle" && (updates.width || updates.height)) {
        const newDimension = updates.width || updates.height;
        updates.width = newDimension;
        updates.height = newDimension;
      }

      // Apply updates
      if (Object.keys(updates).length > 0) {
        await context.updateShape(shape._id, updates);
      }

      return shape;
    }),
  );

  // Build descriptive message
  let message = `Resized ${results.length} shape(s)`;
  if (cmd.scale) {
    message += ` by ${cmd.scale}x`;
  }
  if (cmd.widthDelta) {
    message += ` (width ${cmd.widthDelta > 0 ? "+" : ""}${cmd.widthDelta}px)`;
  }
  if (cmd.heightDelta) {
    message += ` (height ${cmd.heightDelta > 0 ? "+" : ""}${cmd.heightDelta}px)`;
  }

  return message;
}

/**
 * Execute delete shape command
 */
async function executeDeleteShape(
  cmd: DeleteShapeCommand,
  context: ExecutorContext,
): Promise<string> {
  if (!context.deleteShape) {
    throw new Error("Delete operation not available");
  }

  const targetShapes = resolveSelector(
    cmd.selector,
    context.shapes,
    context.selectedShapeIds,
  );

  if (targetShapes.length === 0) {
    throw new Error(
      `No shapes found matching "${cmd.selector || "selection"}"`,
    );
  }

  // Delete each shape
  await Promise.all(
    targetShapes.map((shape) => context.deleteShape!(shape._id)),
  );

  return `Deleted ${targetShapes.length} shape(s)`;
}

/**
 * Execute duplicate shape command
 */
async function executeDuplicateShape(
  cmd: DuplicateShapeCommand,
  context: ExecutorContext,
): Promise<string> {
  const targetShapes = resolveSelector(
    cmd.selector,
    context.shapes,
    context.selectedShapeIds,
  );

  if (targetShapes.length === 0) {
    throw new Error(
      `No shapes found matching "${cmd.selector || "selection"}"`,
    );
  }

  const offsetX = cmd.offsetX ?? 10;
  const offsetY = cmd.offsetY ?? 10;

  // Duplicate each shape
  const duplicated = await Promise.all(
    targetShapes.map(async (shape) => {
      // Create a copy with offset position
      const duplicate: any = { ...shape };
      delete duplicate._id; // Remove ID so a new one is generated

      // Handle different shape types
      if (shape.type === "line") {
        duplicate.x1 = shape.x1 + offsetX;
        duplicate.y1 = shape.y1 + offsetY;
        duplicate.x2 = shape.x2 + offsetX;
        duplicate.y2 = shape.y2 + offsetY;
      } else if ("x" in shape && "y" in shape) {
        duplicate.x = (shape as any).x + offsetX;
        duplicate.y = (shape as any).y + offsetY;
      }

      // Update metadata
      duplicate.createdBy = "ai";
      duplicate.createdAt = Date.now();
      duplicate.lastModified = Date.now();
      duplicate.lastModifiedBy = "ai";

      await context.createShape(duplicate);
      return duplicate;
    }),
  );

  return `Duplicated ${duplicated.length} shape(s)`;
}

/**
 * Execute rotate shape command
 */
async function executeRotateShape(
  cmd: RotateShapeCommand,
  context: ExecutorContext,
): Promise<string> {
  const targetShapes = resolveSelector(
    cmd.selector,
    context.shapes,
    context.selectedShapeIds,
  );

  if (targetShapes.length === 0) {
    throw new Error(
      `No shapes found matching "${cmd.selector || "selection"}"`,
    );
  }

  const isRelative = cmd.relative ?? true;

  // Rotate each shape
  await Promise.all(
    targetShapes.map(async (shape) => {
      const currentAngle = shape.angle ?? 0;
      const newAngle = isRelative ? currentAngle + cmd.angle : cmd.angle;

      await context.updateShape(shape._id, { angle: newAngle });
    }),
  );

  const rotationType = isRelative ? "by" : "to";
  return `Rotated ${targetShapes.length} shape(s) ${rotationType} ${cmd.angle}°`;
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

    case "create_ellipse":
      return executeCreateEllipse(command, context);

    case "create_line":
      return executeCreateLine(command, context);

    case "create_polygon":
      return executeCreatePolygon(command, context);

    case "update_shape":
      return executeUpdateShape(command, context);

    case "arrange_shapes":
      return executeArrangeShapes(command, context);

    case "resize_shape":
      return executeResizeShape(command, context);

    case "delete_shape":
      return executeDeleteShape(command, context);

    case "duplicate_shape":
      return executeDuplicateShape(command, context);

    case "rotate_shape":
      return executeRotateShape(command, context);

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

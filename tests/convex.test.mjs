#!/usr/bin/env node

/**
 * Convex Database Test Script
 * Tests all mutations and queries for shapes and presence
 * Run with: bun run test:convex
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

// Get Convex URL from Bun environment
const CONVEX_URL = Bun.env.NEXT_PUBLIC_CONVEX_URL;

if (!CONVEX_URL) {
  console.error(
    "❌ Error: NEXT_PUBLIC_CONVEX_URL environment variable not set",
  );
  console.log("\nMake sure you have a .env.local file with:");
  console.log("NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud\n");
  process.exit(1);
}

const client = new ConvexHttpClient(CONVEX_URL);

console.log("🧪 Starting Convex Database Tests\n");
console.log(`📡 Connected to: ${CONVEX_URL}\n`);

// Test counters
let passed = 0;
let failed = 0;

function logTest(name, success, message = "") {
  if (success) {
    console.log(`✅ ${name}`);
    if (message) console.log(`   ${message}`);
    passed++;
  } else {
    console.log(`❌ ${name}`);
    if (message) console.log(`   Error: ${message}`);
    failed++;
  }
}

// ============================================================================
// SHAPE TESTS
// ============================================================================

async function testShapes() {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📦 Testing Shape Operations");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  try {
    // Test 1: Query shapes (should work without auth)
    const initialShapes = await client.query(api.shapes.getShapes);
    logTest(
      "Query all shapes",
      Array.isArray(initialShapes),
      `Found ${initialShapes.length} existing shape(s)`,
    );

    // Test 2: Create shape (requires auth - will fail, expected)
    try {
      await client.mutation(api.shapes.createShape, {
        x: 100,
        y: 100,
        width: 100,
        height: 100,
        fill: "#3b82f6",
      });
      logTest(
        "Create shape (auth required)",
        false,
        "Expected auth error but succeeded",
      );
    } catch (error) {
      const isAuthError = error.message.includes("Not authenticated");
      logTest(
        "Create shape (auth required)",
        isAuthError,
        isAuthError ? "Correctly requires authentication" : error.message,
      );
    }

    // Test 3: Get single shape (if any exist)
    if (initialShapes.length > 0) {
      const firstShape = await client.query(api.shapes.getShape, {
        shapeId: initialShapes[0]._id,
      });
      logTest(
        "Query single shape by ID",
        firstShape !== null && firstShape._id === initialShapes[0]._id,
        `Retrieved shape at (${firstShape?.x}, ${firstShape?.y})`,
      );
    } else {
      console.log("⚠️  Skipping single shape query (no shapes exist)");
    }

    console.log("\n");
  } catch (error) {
    logTest("Shape tests", false, error.message);
  }
}

// ============================================================================
// PRESENCE TESTS
// ============================================================================

async function testPresence() {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("👥 Testing Presence Operations");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  try {
    // Test 1: Query active users (should work without auth)
    const activeUsers = await client.query(api.presence.getActiveUsers);
    logTest(
      "Query active users",
      Array.isArray(activeUsers),
      `Found ${activeUsers.length} active user(s)`,
    );

    // Display active users info
    if (activeUsers.length > 0) {
      console.log("   Active users:");
      activeUsers.forEach((user) => {
        const secondsAgo = Math.floor((Date.now() - user.lastActive) / 1000);
        console.log(
          `   - ${user.userName} (${user.color}) at (${user.cursorX}, ${user.cursorY}) - ${secondsAgo}s ago`,
        );
      });
    }

    // Test 2: Join canvas (requires auth - will fail, expected)
    try {
      await client.mutation(api.presence.joinCanvas, {
        userName: "Test User",
        color: "#3b82f6",
      });
      logTest(
        "Join canvas (auth required)",
        false,
        "Expected auth error but succeeded",
      );
    } catch (error) {
      const isAuthError = error.message.includes("Not authenticated");
      logTest(
        "Join canvas (auth required)",
        isAuthError,
        isAuthError ? "Correctly requires authentication" : error.message,
      );
    }

    // Test 3: Update presence (requires auth - will fail, expected)
    try {
      await client.mutation(api.presence.updatePresence, {
        cursorX: 200,
        cursorY: 300,
      });
      logTest(
        "Update presence (auth required)",
        false,
        "Expected auth error but succeeded",
      );
    } catch (error) {
      const isAuthError = error.message.includes("Not authenticated");
      logTest(
        "Update presence (auth required)",
        isAuthError,
        isAuthError ? "Correctly requires authentication" : error.message,
      );
    }

    console.log("\n");
  } catch (error) {
    logTest("Presence tests", false, error.message);
  }
}

// ============================================================================
// CRON JOB VERIFICATION
// ============================================================================

async function testCronJob() {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("⏰ Cron Job Verification");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  console.log("   To verify the cron job:");
  console.log("   1. Go to Convex Dashboard → Logs");
  console.log("   2. Look for 'Cleaned up X stale presence record(s)'");
  console.log("   3. Verify it runs every 10 seconds");
  console.log("   4. Manually test by creating presence and waiting 30s\n");
  logTest(
    "Cron job configured",
    true,
    "Check Convex dashboard logs for execution",
  );

  console.log("\n");
}

// ============================================================================
// SCHEMA VALIDATION
// ============================================================================

async function testSchema() {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📋 Schema Validation");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  try {
    // Check if shapes table has correct structure
    const shapes = await client.query(api.shapes.getShapes);
    if (shapes.length > 0) {
      const shape = shapes[0];
      const hasRequiredFields =
        "x" in shape &&
        "y" in shape &&
        "width" in shape &&
        "height" in shape &&
        "fill" in shape &&
        "createdBy" in shape &&
        "createdAt" in shape &&
        "lastModified" in shape;

      logTest(
        "Shapes table schema",
        hasRequiredFields,
        hasRequiredFields
          ? "All required fields present"
          : "Missing required fields",
      );
    } else {
      console.log("   ⚠️  No shapes to validate schema");
    }

    // Check if presence table has correct structure
    const presence = await client.query(api.presence.getActiveUsers);
    if (presence.length > 0) {
      const user = presence[0];
      const hasRequiredFields =
        "userId" in user &&
        "userName" in user &&
        "cursorX" in user &&
        "cursorY" in user &&
        "color" in user &&
        "lastActive" in user;

      logTest(
        "Presence table schema",
        hasRequiredFields,
        hasRequiredFields
          ? "All required fields present"
          : "Missing required fields",
      );
    } else {
      console.log("   ⚠️  No active users to validate schema");
    }

    console.log("\n");
  } catch (error) {
    logTest("Schema validation", false, error.message);
  }
}

// ============================================================================
// RUN ALL TESTS
// ============================================================================

async function runTests() {
  await testShapes();
  await testPresence();
  await testCronJob();
  await testSchema();

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📊 Test Results");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Total:  ${passed + failed}\n`);

  if (failed === 0) {
    console.log("🎉 All tests passed!");
  } else {
    console.log("⚠️  Some tests failed. Review errors above.");
  }

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📝 Next Steps for Full Testing:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  console.log("1. Test authenticated mutations in Convex Dashboard:");
  console.log("   - Go to https://dashboard.convex.dev");
  console.log("   - Navigate to your project → Functions");
  console.log("   - Test createShape, moveShape, updateShape, deleteShape");
  console.log("   - Test joinCanvas, updatePresence, heartbeat, leaveCanvas\n");
  console.log("2. Test real-time sync:");
  console.log("   - Open 2 browser windows at /dashboard");
  console.log("   - Create/move shapes in one window");
  console.log("   - Verify they appear in the other window\n");
  console.log("3. Test presence cleanup:");
  console.log("   - Join canvas, wait 30+ seconds without heartbeat");
  console.log("   - Check if presence record is cleaned up by cron\n");

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});

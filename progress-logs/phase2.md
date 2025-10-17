  🌊 Phase 2: Application Flow - Request Lifecycle

  We'll follow two journeys:

  1. Initial page load - User visits /dashboard
  2. Creating a shape - User clicks and drags to create a rectangle

  Let's read the key files first:

⏺ Read(app/dashboard/page.tsx)
  ⎿  Read 19 lines

⏺ Read(components/providers/ConvexClientProvider.tsx)
  ⎿  Read 34 lines

> /context 

⏺ Perfect! Now let's trace the flow.

  ---
  🚀 Journey 1: Initial Page Load

  User types: localhost:3000/dashboard

  Let me visualize the complete flow:

  Browser → Middleware → Server Component → Client Component → Convex Connection

  ---
  Step 1: Middleware Check (Before anything else)

  File: middleware.ts

  export default clerkMiddleware();

  What happens:
  1. Request hits the edge server (closest to user)
  2. Clerk checks: "Is there an auth cookie/token?"
  3. Two paths:

  ✅ Has valid token → Middleware adds user info to request → Continue to page
  ❌ No token → Redirect to sign-in page

  Key point: This happens before the page even starts loading. The page component doesn't know about this -
  middleware handles it silently.

  ---
  Step 2: Root Layout Wrapper

  File: app/layout.tsx

  export default function RootLayout({ children }) {
    return (
      <ClerkProvider>  {/* ← Provides auth context */}
        <html lang="en">
          <body>
            <ConvexClientProvider>  {/* ← Establishes Convex connection */}
              {children}  {/* ← Your actual page */}
            </ConvexClientProvider>
          </body>
        </html>
      </ClerkProvider>
    );
  }

  What's happening:

  1. ClerkProvider:
    - Reads auth token from cookies
    - Makes it available to all child components via useUser() hook
    - Provides <UserButton>, useAuth(), etc.
  2. ConvexClientProvider (let's dive deeper):

  // Creates Convex client instance
  const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

  // Wraps children with provider
  <ConvexProviderWithClerk client={convex} useAuth={useAuthWithTemplate}>
    {children}
  </ConvexProviderWithClerk>

  What ConvexProviderWithClerk does:

  1. Establishes WebSocket connection to Convex servers
  2. Gets auth token from Clerk (via useAuth hook)
  3. Sends token to Convex for authentication
  4. Keeps connection alive
  5. Listens for real-time updates

  Visual:
  Browser ←→ WebSocket ←→ Convex Server
           (stays open)

  This connection stays alive for the entire session. When ANY user updates the database, Convex pushes updates
  through this socket.

  ---
  Step 3: Dashboard Page (Server Component)

  File: app/dashboard/page.tsx

  export default async function DashboardPage() {
    const { userId } = await auth();  // ← Server-side Clerk auth

    if (!userId) {
      redirect("/");  // ← Server-side redirect
    }

    const user = await currentUser();  // ← Fetch user data
    const userName = user?.username || "User";

    return <DashboardClient userName={userName} />;
  }

  Why is this a server component?

  Notice the async keyword? Server components can:
  - Use await directly (no useEffect needed)
  - Access servers/databases
  - Keep secrets (API keys not exposed to browser)

  What's happening:

  1. await auth() - Gets user ID from Clerk (server-side check)
  2. If no user, redirect to home page
  3. await currentUser() - Fetches full user object (name, email, etc.)
  4. Passes userName to client component

  Why double-check auth here?
  - Middleware protects the route
  - But this server component also checks, for extra security
  - Defense in depth: If someone bypasses middleware (edge case), this catches it

  ---
  Step 4: Dashboard Client (Client Component)

  File: app/dashboard/DashboardClient.tsx

  export function DashboardClient({ userName }: DashboardClientProps) {
    const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
    const [activeTool, setActiveTool] = useState<Tool>("select");
    const { user } = useUser();  // ← Clerk hook

    const userId = user?.id || "anonymous";
    const userColor = getUserColor(userId);

    // 🔥 This is where real-time sync begins!
    const { allUsers, otherUsers, updateCursorPosition, isReady } = usePresence({
      userId,
      userName,
      userColor,
      enabled: !!user?.id,
    });

    return (
      <div>
        <Toolbar activeTool={activeTool} onToolChange={handleToolChange} />
        <Canvas
          onCanvasReady={handleCanvasReady}
          activeTool={activeTool}
          userId={userId}
          userName={userName}
          updateCursorPosition={updateCursorPosition}
        />
        <PresencePanel activeUsers={allUsers} />
      </div>
    );
  }

  What's happening:

  1. useState - Creates local UI state (canvas, active tool)
  2. useUser() - Gets user info from Clerk context (provided by ClerkProvider)
  3. usePresence() - This is where the magic happens! Let's trace it...

  ---
  Step 5: usePresence Hook - Joining the Canvas

  File: hooks/usePresence.ts (lines 107-161)

  useEffect(() => {
    if (!enabled || hasJoinedRef.current) return;

    const join = async () => {
      console.log("[usePresence] Calling joinCanvas for user:", userName);
      await joinCanvas({  // ← Convex mutation!
        userName,
        color: userColor,
      });
      hasJoinedRef.current = true;
      setIsReady(true);
    };

    join();
  }, [enabled, userId, userName, userColor]);

  What happens:

  1. Component mounts
  2. useEffect runs (on mount)
  3. Calls joinCanvas mutation
  4. This sends a message to Convex: "User X is here!"

  ---
  Step 6: Convex Mutation - joinCanvas

  File: convex/presence.ts (lines 18-59)

  export const joinCanvas = mutation({
    args: {
      userName: v.string(),
      color: v.string(),
    },
    handler: async (ctx, args) => {
      const user = await ctx.auth.getUserIdentity();  // ← Get user from token
      if (!user) {
        throw new Error("Not authenticated");
      }

      const userId = user.subject;  // ← Clerk user ID

      // Check if user already has a presence record
      const existing = await ctx.db
        .query("presence")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .first();

      if (existing) {
        // Update existing record
        await ctx.db.patch(existing._id, {
          userName: args.userName,
          color: args.color,
          lastActive: Date.now(),
        });
        return existing._id;
      } else {
        // Create new record
        const presenceId = await ctx.db.insert("presence", {
          userId,
          userName: args.userName,
          cursorX: 0,
          cursorY: 0,
          color: args.color,
          lastActive: Date.now(),
        });
        return presenceId;
      }
    },
  });

  What's happening:

  1. Convex receives the mutation request
  2. Checks auth token (sent automatically by ConvexProvider)
  3. If authenticated, creates/updates presence record in database
  4. Returns the presence ID

  ---
  Step 7: Real-Time Update Propagation

  Here's the magic moment:

  User A joins → Convex creates presence record → Database updates →
  All active queries listening to "presence" table get notified →
  All connected clients receive update via WebSocket →
  Their components re-render with new data

  In User B's browser:

  // This query is running in User B's app
  const activeUsers = useQuery(api.presence.getActiveUsers);

  // Convex says: "Hey! The presence table changed!"
  // Query re-runs automatically
  // activeUsers now includes User A
  // Component re-renders
  // User B sees User A's cursor appear!

  No polling! No manual refresh! Pure magic! ✨

  ---
  Complete Flow Diagram

  User types URL
      ↓
  [EDGE SERVER] Middleware checks auth
      ↓ (authenticated)
  [SERVER] Root Layout loads
      ↓
  [SERVER] ClerkProvider initializes
      ↓
  [SERVER] ConvexClientProvider establishes WebSocket
      ↓
  [SERVER] Dashboard page checks auth again
      ↓
  [SERVER] Fetches user data
      ↓
  [CLIENT] DashboardClient renders
      ↓
  [CLIENT] usePresence calls joinCanvas mutation
      ↓
  [CONVEX] joinCanvas creates presence record
      ↓
  [DATABASE] Presence table updated
      ↓
  [CONVEX] Notifies all active queries
      ↓
  [ALL CLIENTS] Queries re-run, components update
      ↓
  [RESULT] User sees other users' cursors!

  ---
  ★ Insight ─────────────────────────────────────
  The key insight: There's a server component (DashboardPage) and a client component (DashboardClient). The server
   component runs on Next.js server, fetches data securely, then passes it to the client component. The client
  component runs in the browser and handles interactivity. This separation lets you keep auth logic secure while
  maintaining a rich interactive UI.
  ─────────────────────────────────────────────────

  ---
  🎨 Journey 2: Creating a Shape

  Now let's follow what happens when User A creates a rectangle.

  User clicks and drags on the canvas

  I'll trace this step-by-step. Want me to continue with Journey 2, or do you have questions about Journey 1
  first?

⏺ I can see you have convex/shapes.ts open! Perfect timing - we're about to trace through how shapes are created.
  Let me continue with Journey 2: Creating a Shape.

  ---
  🎨 Journey 2: Creating a Rectangle Shape

  Let's trace what happens when you click and drag to create a rectangle.

  User Action: Mouse Down on Canvas

⏺ Read(components/canvas/Canvas.tsx)
  ⎿  Read 150 lines

⏺ Perfect! Now let me trace the complete flow with visual diagrams.

  ---
  🎨 Journey 2: Creating a Rectangle - Complete Flow

  The Three Phases of Shape Creation

  Phase 1: LOCAL (Instant feedback)
  Phase 2: SYNC (Save to Convex)
  Phase 3: BROADCAST (Update other users)

  ---
  Phase 1: Mouse Events (Local - Instant)

  Step 1: Mouse Down (Line 203-237)

  fabricCanvas.on("mouse:down", (opt) => {
    const pointer = fabricCanvas.getPointer(e);

    if (activeToolRef.current === "rectangle" && !opt.target) {
      // Set flag: "We're creating a rectangle"
      isCreatingRectRef.current = true;

      // Remember where we started
      creatingStartPointRef.current = { x: pointer.x, y: pointer.y };

      // Create temporary rectangle (0x0 size initially)
      const rect = new Rect({
        left: pointer.x,
        top: pointer.y,
        width: 0,
        height: 0,
        fill: DEFAULT_SHAPE.FILL_COLOR,
        selectable: false,  // ← Can't select while creating
      });

      creatingRectRef.current = rect;
      fabricCanvas.add(rect);  // Add to canvas
      fabricCanvas.renderAll();  // Draw it!
    }
  });

  What happens:
  1. User clicks → mouse:down event fires
  2. Check: Are we in rectangle mode? Yes!
  3. Check: Did we click on empty space? Yes!
  4. Create a tiny (0×0) rectangle at click position
  5. Store it in creatingRectRef so we can modify it later
  6. Render canvas → User sees nothing (it's 0×0!)

  ---
  Step 2: Mouse Move (Dragging) (Line 269-303)

  fabricCanvas.on("mouse:move", (opt) => {
    const pointer = fabricCanvas.getPointer(e);

    // Are we creating a rectangle?
    if (isCreatingRectRef.current && creatingRectRef.current) {
      const startX = creatingStartPointRef.current.x;
      const startY = creatingStartPointRef.current.y;

      // Calculate how far we've dragged
      const width = pointer.x - startX;
      const height = pointer.y - startY;

      // Handle negative dimensions (dragging left/up)
      if (width < 0) {
        creatingRectRef.current.set({
          left: pointer.x,  // Rectangle starts at cursor
          width: Math.abs(width),
        });
      } else {
        creatingRectRef.current.set({
          left: startX,  // Rectangle starts at original click
          width: width,
        });
      }

      // Same for height...

      fabricCanvas.renderAll();  // Redraw with new size!
    }
  });

  What happens:
  1. User drags → mouse:move fires (60+ times per second!)
  2. Check: Are we creating? Yes!
  3. Calculate distance from start point
  4. Update rectangle dimensions
  5. Render canvas → User sees rectangle growing in real-time!

  Why it's smooth: Using useRef means no React re-renders. Pure canvas operations at 60fps.

  ---
  Step 3: Mouse Up (Finalize) (Line 326-352)

  fabricCanvas.on("mouse:up", () => {
    if (isCreatingRectRef.current && creatingRectRef.current) {
      const createdRect = creatingRectRef.current;

      // Make it selectable now
      createdRect.set({
        stroke: undefined,
        selectable: true,
        evented: true,
      });

      // THIS IS WHERE CONVEX SYNC HAPPENS!
      finalizeRectangle(createdRect);  // ← Magic!

      // Reset flags
      isCreatingRectRef.current = false;
      creatingRectRef.current = null;

      // Select the new rectangle
      fabricCanvas.setActiveObject(createdRect);
      fabricCanvas.renderAll();
    }
  });

  What happens:
  1. User releases mouse → mouse:up fires
  2. Check: Were we creating? Yes!
  3. Make rectangle selectable (creation is done)
  4. Call finalizeRectangle → This triggers Convex sync
  5. Clean up refs
  6. Select the new shape

  ---
  Phase 2: Sync to Convex (Save to Database)

  Step 4: finalizeRectangle (Line 96-133)

  const finalizeRectangle = useCallback(async (rect: Rect) => {
    // Validation: Too small? Delete it
    if ((rect.width || 0) < 5 || (rect.height || 0) < 5) {
      fabricCanvasRef.current.remove(rect);
      return;
    }

    try {
      // THIS IS THE CONVEX MUTATION CALL!
      const shapeId = await createShapeInConvex({
        type: "rectangle",
        x: rect.left || 0,
        y: rect.top || 0,
        width: rect.width || DEFAULT_SHAPE.WIDTH,
        height: rect.height || DEFAULT_SHAPE.HEIGHT,
        fillColor: DEFAULT_SHAPE.FILL_COLOR,
        createdBy: userId,
        createdAt: Date.now(),
        lastModified: Date.now(),
        lastModifiedBy: userId,
      });

      // Store the real database ID in the Fabric object
      rect.set("data", { shapeId: shapeId });

    } catch (error) {
      console.error("Failed to create shape:", error);
      // Remove from canvas if save failed
      fabricCanvasRef.current.remove(rect);
    }
  }, [userId, createShapeInConvex]);

  What happens:
  1. Check if rectangle is big enough (5×5 minimum)
  2. Call createShapeInConvex → This is from your useShapes hook!
  3. Wait for Convex to respond with the new shape ID
  4. Store the ID in the Fabric object's data property
  5. If it fails, remove the rectangle from canvas

  ---
  Step 5: useShapes Hook (hooks/useShapes.ts)

  Let me read the relevant part:
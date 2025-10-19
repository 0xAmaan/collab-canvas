# CollabCanvas - System Architecture

## Complete System Architecture Diagram

```mermaid
graph TB
    subgraph "Client Browser"
        subgraph "Next.js Frontend (React)"
            UI[User Interface Layer]
            
            subgraph "Pages (App Router)"
                Home[Home Page<br/>Landing & Auth]
                Dashboard[Dashboard Page<br/>Canvas Workspace]
            end
            
            subgraph "React Components"
                Canvas[Canvas Component<br/>Main workspace]
                Toolbar[Toolbar<br/>Shape tools]
                PresencePanel[Presence Panel<br/>Online users]
                MultiCursor[Multiplayer Cursors<br/>Real-time cursors]
                ShapeRenderer[Shape Renderer<br/>Draw rectangles]
            end
            
            subgraph "Custom Hooks"
                useViewport[useViewport<br/>Pan/zoom state]
                useShapes[useShapes<br/>Shape CRUD]
                usePresence[usePresence<br/>User presence]
                useKeyboard[useKeyboard<br/>Shortcuts]
                useThrottle[useThrottle<br/>Rate limiting]
            end
            
            subgraph "Utilities"
                CanvasUtils[Canvas Utils<br/>Coordinate transforms]
                ShapeUtils[Shape Utils<br/>Collision detection]
                ColorUtils[Color Utils<br/>Palette management]
            end
        end
        
        LocalStorage[(Local Storage<br/>Viewport state)]
    end
    
    subgraph "Authentication Layer"
        Clerk[Clerk Auth Service<br/>User management]
        ClerkProvider[Clerk Provider<br/>React context]
        ClerkMiddleware[Clerk Middleware<br/>Route protection]
    end
    
    subgraph "Convex Backend"
        ConvexClient[Convex Client<br/>Real-time subscriptions]
        
        subgraph "Convex Functions"
            ShapeQueries[Shape Queries<br/>getShapes, getShape]
            ShapeMutations[Shape Mutations<br/>createShape, moveShape, deleteShape]
            PresenceQueries[Presence Queries<br/>getActiveUsers]
            PresenceMutations[Presence Mutations<br/>updatePresence, joinCanvas, leaveCanvas]
        end
        
        subgraph "Convex Database"
            ShapesTable[(Shapes Table<br/>Shape data)]
            PresenceTable[(Presence Table<br/>User cursors & status)]
        end
        
        subgraph "Convex Background Jobs"
            PresenceCron[Presence Cleanup Cron<br/>Remove stale users every 10s]
        end
        
        ConvexAuth[Convex Auth<br/>JWT validation]
    end
    
    subgraph "Deployment Infrastructure"
        Vercel[Vercel<br/>Next.js hosting]
        ConvexCloud[Convex Cloud<br/>Backend hosting]
        ClerkCloud[Clerk Cloud<br/>Auth hosting]
    end

    %% Client to Components Flow
    UI --> Home
    UI --> Dashboard
    Dashboard --> Canvas
    Dashboard --> Toolbar
    Dashboard --> PresencePanel
    Canvas --> MultiCursor
    Canvas --> ShapeRenderer
    
    %% Components to Hooks Flow
    Canvas --> useViewport
    Canvas --> useShapes
    Canvas --> usePresence
    Canvas --> useKeyboard
    usePresence --> useThrottle
    
    %% Hooks to Utils Flow
    useViewport --> CanvasUtils
    useShapes --> ShapeUtils
    usePresence --> ColorUtils
    
    %% Local Storage
    useViewport -.->|Save/Load viewport| LocalStorage
    
    %% Authentication Flow
    Home --> ClerkProvider
    Dashboard --> ClerkMiddleware
    ClerkProvider --> Clerk
    ClerkMiddleware --> Clerk
    Clerk -.->|JWT token| ConvexAuth
    
    %% Convex Integration
    useShapes -->|Subscribe & Mutate| ConvexClient
    usePresence -->|Subscribe & Mutate| ConvexClient
    
    ConvexClient -->|Real-time updates| ShapeQueries
    ConvexClient -->|Real-time updates| PresenceQueries
    ConvexClient -->|Execute| ShapeMutations
    ConvexClient -->|Execute| PresenceMutations
    
    %% Convex to Database
    ShapeQueries --> ShapesTable
    ShapeMutations --> ShapesTable
    PresenceQueries --> PresenceTable
    PresenceMutations --> PresenceTable
    
    %% Background Jobs
    PresenceCron -->|Cleanup old records| PresenceTable
    
    %% Auth Integration
    ConvexAuth -.->|Validate user| ShapeMutations
    ConvexAuth -.->|Validate user| PresenceMutations
    
    %% Deployment
    UI -.->|Deployed on| Vercel
    ConvexClient -.->|Connects to| ConvexCloud
    Clerk -.->|Hosted on| ClerkCloud

    style UI fill:#3b82f6,stroke:#1e40af,stroke-width:3px,color:#fff
    style ConvexClient fill:#8b5cf6,stroke:#6d28d9,stroke-width:3px,color:#fff
    style Clerk fill:#ef4444,stroke:#b91c1c,stroke-width:3px,color:#fff
```

---

## Data Flow Diagrams

### 1. User Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant NextJS as Next.js App
    participant Clerk
    participant Convex
    
    User->>Browser: Visit app
    Browser->>NextJS: Load homepage
    NextJS->>Clerk: Check auth status
    
    alt User not authenticated
        Clerk-->>NextJS: Not authenticated
        NextJS->>Browser: Show landing page
        User->>Browser: Click "Get Started"
        Browser->>Clerk: Open sign-up modal
        User->>Clerk: Enter credentials
        Clerk->>Clerk: Create account
        Clerk-->>Browser: JWT token
        Browser->>NextJS: Redirect to /dashboard
    else User authenticated
        Clerk-->>NextJS: JWT token
        NextJS->>Browser: Auto-redirect to /dashboard
    end
    
    Browser->>Convex: Connect with JWT
    Convex->>Convex: Validate JWT
    Convex-->>Browser: Authenticated session
```

---

### 2. Real-Time Shape Creation & Sync Flow

```mermaid
sequenceDiagram
    participant User1 as User 1 Browser
    participant Convex
    participant User2 as User 2 Browser
    
    Note over User1: User clicks rectangle tool
    Note over User1: User clicks on canvas
    
    User1->>User1: Create shape locally (optimistic)
    User1->>User1: Render shape immediately
    User1->>Convex: createShape mutation
    
    Convex->>Convex: Validate auth
    Convex->>Convex: Insert into shapes table
    Convex->>Convex: Generate shape ID
    
    Convex-->>User1: Shape created (with ID)
    User1->>User1: Replace local ID with server ID
    
    Convex->>User2: Real-time update (new shape)
    User2->>User2: Add shape to local state
    User2->>User2: Render new shape
    
    Note over User1,User2: Both users see the same shape<br/>Sync completed in <100ms
```

---

### 3. Multiplayer Cursor Synchronization Flow

```mermaid
sequenceDiagram
    participant User1 as User 1 Browser
    participant Throttle as Throttle Hook (50ms)
    participant Convex
    participant User2 as User 2 Browser
    
    loop Every mouse move
        User1->>Throttle: Mouse move event (x, y)
    end
    
    Throttle->>Throttle: Wait 50ms
    Throttle->>Convex: updatePresence mutation (x, y)
    
    Convex->>Convex: Update presence table
    Convex->>Convex: Update lastActive timestamp
    
    Convex-->>User2: Real-time cursor update
    User2->>User2: Interpolate cursor movement
    User2->>User2: Render cursor at new position
    
    Note over User1,User2: Cursor updates <50ms<br/>Smooth movement via CSS transitions
```

---

### 4. Presence Management & Cleanup Flow

```mermaid
sequenceDiagram
    participant User as User Browser
    participant Convex
    participant Cron as Presence Cron Job
    
    User->>Convex: Load dashboard
    Convex->>Convex: joinCanvas mutation
    Convex->>Convex: Create presence record
    
    loop Every 5 seconds
        User->>Convex: heartbeat mutation
        Convex->>Convex: Update lastActive
    end
    
    loop Every 10 seconds
        Cron->>Convex: Run cleanup job
        Convex->>Convex: Find presence records<br/>where lastActive > 30s ago
        Convex->>Convex: Delete stale records
    end
    
    alt User closes tab
        User->>Convex: beforeunload event
        Convex->>Convex: leaveCanvas mutation
        Convex->>Convex: Delete presence record
    else Browser crash/network failure
        Note over Convex: Cron job will clean up<br/>within 30 seconds
    end
```

---

## Component Interaction Diagram

```mermaid
graph LR
    subgraph "Dashboard Page"
        Dashboard[Dashboard Component]
    end
    
    subgraph "Canvas System"
        Canvas[Canvas Component]
        CanvasRenderer[Canvas Renderer]
        Viewport[Viewport Transform]
    end
    
    subgraph "Shape Management"
        Toolbar[Toolbar]
        ShapeComponent[Shape Component]
        SelectionBox[Selection Box]
    end
    
    subgraph "Multiplayer"
        PresencePanel[Presence Panel]
        MultiCursor[Multiplayer Cursors]
        UserAvatar[User Avatars]
    end
    
    subgraph "State Management (Hooks)"
        useShapes[useShapes Hook]
        usePresence[usePresence Hook]
        useViewport[useViewport Hook]
    end
    
    subgraph "Convex Backend"
        ConvexQueries[Convex Queries]
        ConvexMutations[Convex Mutations]
        Database[(Database)]
    end
    
    Dashboard --> Canvas
    Dashboard --> Toolbar
    Dashboard --> PresencePanel
    
    Canvas --> CanvasRenderer
    Canvas --> Viewport
    Canvas --> ShapeComponent
    Canvas --> SelectionBox
    Canvas --> MultiCursor
    
    PresencePanel --> UserAvatar
    
    Canvas --> useViewport
    Canvas --> useShapes
    Canvas --> usePresence
    
    Toolbar --> useShapes
    
    useShapes --> ConvexQueries
    useShapes --> ConvexMutations
    usePresence --> ConvexQueries
    usePresence --> ConvexMutations
    
    ConvexQueries --> Database
    ConvexMutations --> Database
    
    style Dashboard fill:#3b82f6,stroke:#1e40af,stroke-width:2px,color:#fff
    style useShapes fill:#8b5cf6,stroke:#6d28d9,stroke-width:2px,color:#fff
    style usePresence fill:#8b5cf6,stroke:#6d28d9,stroke-width:2px,color:#fff
    style Database fill:#ef4444,stroke:#b91c1c,stroke-width:2px,color:#fff
```

---

## Database Schema Diagram

```mermaid
erDiagram
    SHAPES {
        id string PK "Unique shape ID"
        type string "Rectangle only for MVP"
        x number "X position on canvas"
        y number "Y position on canvas"
        width number "Shape width"
        height number "Shape height"
        fillColor string "Hex color code"
        createdBy string FK "Clerk user ID"
        createdAt number "Unix timestamp"
        lastModified number "Unix timestamp"
        lastModifiedBy string FK "Clerk user ID"
    }
    
    PRESENCE {
        id string PK "Unique presence ID"
        userId string FK "Clerk user ID"
        userName string "User display name"
        userAvatar string "Avatar URL (optional)"
        cursorColor string "Hex color (blue/purple/red)"
        cursorX number "Cursor X position"
        cursorY number "Cursor Y position"
        lastActive number "Unix timestamp"
    }
    
    SHAPES ||--o{ PRESENCE : "created_by"
```

---

## Technology Stack Diagram

```mermaid
graph TB
    subgraph "Frontend Technologies"
        NextJS[Next.js 14+<br/>App Router]
        React[React 18<br/>UI Framework]
        TypeScript[TypeScript<br/>Type Safety]
        Tailwind[Tailwind CSS<br/>Styling]
    end
    
    subgraph "State & Data Management"
        ConvexClient[Convex Client<br/>Real-time subscriptions]
        ReactHooks[React Hooks<br/>State management]
        LocalStorage[Browser LocalStorage<br/>Viewport persistence]
    end
    
    subgraph "Backend Services"
        ConvexBackend[Convex<br/>Backend & Database]
        ClerkAuth[Clerk<br/>Authentication]
    end
    
    subgraph "Development Tools"
        Bun[Bun<br/>Package Manager]
        Git[Git<br/>Version Control]
        ESLint[ESLint<br/>Code Quality]
    end
    
    subgraph "Deployment Platforms"
        Vercel[Vercel<br/>Frontend Hosting]
        ConvexCloud[Convex Cloud<br/>Backend Hosting]
        ClerkCloud[Clerk Cloud<br/>Auth Hosting]
    end
    
    NextJS --> React
    NextJS --> TypeScript
    NextJS --> Tailwind
    
    React --> ReactHooks
    ReactHooks --> ConvexClient
    ReactHooks --> LocalStorage
    
    ConvexClient --> ConvexBackend
    NextJS --> ClerkAuth
    
    NextJS -.->|Built with| Bun
    NextJS -.->|Tracked in| Git
    NextJS -.->|Linted by| ESLint
    
    NextJS -.->|Deployed to| Vercel
    ConvexBackend -.->|Hosted on| ConvexCloud
    ClerkAuth -.->|Hosted on| ClerkCloud
    
    style NextJS fill:#3b82f6,stroke:#1e40af,stroke-width:2px,color:#fff
    style ConvexBackend fill:#8b5cf6,stroke:#6d28d9,stroke-width:2px,color:#fff
    style ClerkAuth fill:#ef4444,stroke:#b91c1c,stroke-width:2px,color:#fff
```

---

## Canvas Coordinate System Diagram

```mermaid
graph TB
    subgraph "Browser Window (Screen Space)"
        ScreenCoords[Screen Coordinates<br/>Mouse X, Y relative to viewport]
    end
    
    subgraph "Canvas Element"
        CanvasCoords[Canvas Coordinates<br/>Transformed by viewport]
    end
    
    subgraph "Virtual Canvas (World Space)"
        WorldCoords[World Coordinates<br/>Actual shape positions<br/>5000x5000px space]
    end
    
    subgraph "Viewport Transform"
        Pan[Pan Offset<br/>offsetX, offsetY]
        Zoom[Zoom Scale<br/>0.1 to 4.0]
    end
    
    ScreenCoords -->|Mouse Event| CanvasCoords
    CanvasCoords -->|Apply Pan| Pan
    Pan -->|Apply Zoom| Zoom
    Zoom -->|Result| WorldCoords
    
    WorldCoords -.->|Inverse Transform<br/>For Rendering| ScreenCoords
    
    style ScreenCoords fill:#3b82f6,stroke:#1e40af,stroke-width:2px,color:#fff
    style WorldCoords fill:#ef4444,stroke:#b91c1c,stroke-width:2px,color:#fff
```

---

## State Management Flow

```mermaid
graph TB
    subgraph "User Actions"
        MouseMove[Mouse Move]
        MouseClick[Mouse Click]
        KeyPress[Key Press]
        MouseDrag[Mouse Drag]
    end
    
    subgraph "React Components"
        Canvas[Canvas Component]
    end
    
    subgraph "Custom Hooks (Local State)"
        useViewport[useViewport<br/>Pan/Zoom State]
        useKeyboard[useKeyboard<br/>Tool State]
    end
    
    subgraph "Custom Hooks (Convex State)"
        useShapes[useShapes<br/>Shape State]
        usePresence[usePresence<br/>Presence State]
    end
    
    subgraph "Convex Backend"
        Database[(Database)]
    end
    
    MouseMove --> Canvas
    MouseClick --> Canvas
    KeyPress --> Canvas
    MouseDrag --> Canvas
    
    Canvas --> useViewport
    Canvas --> useKeyboard
    Canvas --> useShapes
    Canvas --> usePresence
    
    useViewport -.->|Local Only| Canvas
    useKeyboard -.->|Local Only| Canvas
    
    useShapes -->|Subscribe| Database
    useShapes -->|Mutate| Database
    Database -->|Real-time Updates| useShapes
    
    usePresence -->|Subscribe| Database
    usePresence -->|Mutate| Database
    Database -->|Real-time Updates| usePresence
    
    useShapes --> Canvas
    usePresence --> Canvas
    
    style useViewport fill:#3b82f6,stroke:#1e40af,stroke-width:2px,color:#fff
    style useShapes fill:#8b5cf6,stroke:#6d28d9,stroke-width:2px,color:#fff
    style usePresence fill:#8b5cf6,stroke:#6d28d9,stroke-width:2px,color:#fff
    style Database fill:#ef4444,stroke:#b91c1c,stroke-width:2px,color:#fff
```

---

## Request/Response Flow with Optimistic Updates

```mermaid
sequenceDiagram
    participant User
    participant UI as React Component
    participant Hook as useShapes Hook
    participant Convex
    participant DB as Database
    participant OtherUsers as Other Users
    
    User->>UI: Drag shape to new position
    
    UI->>Hook: moveShape(shapeId, newX, newY)
    
    Note over Hook: Optimistic Update
    Hook->>Hook: Update local state immediately
    Hook->>UI: Re-render with new position
    UI->>User: Shape moves instantly (local)
    
    Hook->>Convex: Mutation: moveShape(shapeId, newX, newY)
    Convex->>Convex: Validate auth
    Convex->>DB: Update shape position
    DB-->>Convex: Success
    
    Convex-->>Hook: Mutation confirmed
    Note over Hook: Local state already updated<br/>No additional render needed
    
    Convex->>OtherUsers: Real-time update via subscription
    OtherUsers->>OtherUsers: Update local state
    OtherUsers->>OtherUsers: Re-render shape
    
    alt Mutation fails
        Convex-->>Hook: Error
        Hook->>Hook: Revert optimistic update
        Hook->>UI: Re-render with old position
        UI->>User: Show error toast
    end
```

---

## Network Communication Patterns

```mermaid
graph LR
    subgraph "Client Browser"
        Components[React Components]
        Hooks[Custom Hooks]
    end
    
    subgraph "Real-Time Communication"
        WebSocket[WebSocket Connection<br/>Convex Client]
    end
    
    subgraph "Convex Backend"
        Queries[Queries<br/>Subscribe pattern]
        Mutations[Mutations<br/>Request/Response]
    end
    
    Components --> Hooks
    
    Hooks -->|Subscribe| WebSocket
    WebSocket -->|Real-time updates| Queries
    Queries -.->|Stream changes| WebSocket
    WebSocket -.->|Update local state| Hooks
    Hooks -.->|Trigger re-render| Components
    
    Hooks -->|Execute| Mutations
    Mutations -->|Database write| Mutations
    Mutations -.->|Broadcast change| Queries
    
    style WebSocket fill:#8b5cf6,stroke:#6d28d9,stroke-width:3px,color:#fff
```

---

## File Structure to Architecture Mapping

```mermaid
graph TB
    subgraph "src/app/ - Next.js Pages"
        HomePage[page.tsx<br/>Landing/Auth]
        DashboardPage[dashboard/page.tsx<br/>Main App]
        Layout[layout.tsx<br/>Clerk Provider]
    end
    
    subgraph "src/components/ - UI Layer"
        Canvas[canvas/Canvas.tsx]
        Toolbar[toolbar/Toolbar.tsx]
        Presence[presence/PresencePanel.tsx]
    end
    
    subgraph "src/hooks/ - State Layer"
        useShapesHook[useShapes.ts]
        usePresenceHook[usePresence.ts]
        useViewportHook[useViewport.ts]
    end
    
    subgraph "src/lib/ - Utility Layer"
        CanvasUtils[canvas-utils.ts]
        ShapeUtils[shape-utils.ts]
        ColorUtils[color-utils.ts]
    end
    
    subgraph "convex/ - Backend Layer"
        Schema[schema.ts<br/>Database Schema]
        ShapesFuncs[shapes.ts<br/>Queries & Mutations]
        PresenceFuncs[presence.ts<br/>Queries & Mutations]
        Crons[crons.ts<br/>Background Jobs]
    end
    
    Layout --> HomePage
    Layout --> DashboardPage
    
    DashboardPage --> Canvas
    DashboardPage --> Toolbar
    DashboardPage --> Presence
    
    Canvas --> useViewportHook
    Canvas --> useShapesHook
    Canvas --> usePresenceHook
    
    useViewportHook --> CanvasUtils
    useShapesHook --> ShapeUtils
    usePresenceHook --> ColorUtils
    
    useShapesHook -.->|Convex Client| ShapesFuncs
    usePresenceHook -.->|Convex Client| PresenceFuncs
    
    ShapesFuncs --> Schema
    PresenceFuncs --> Schema
    Crons --> Schema
    
    style DashboardPage fill:#3b82f6,stroke:#1e40af,stroke-width:2px,color:#fff
    style useShapesHook fill:#8b5cf6,stroke:#6d28d9,stroke-width:2px,color:#fff
    style Schema fill:#ef4444,stroke:#b91c1c,stroke-width:2px,color:#fff
```

---

## Key Architectural Decisions

### 1. **State-Based Sync vs Operational Transform**
- **Decision:** Use state-based sync with "last write wins"
- **Rationale:** Simpler to implement, sufficient for shape position/properties
- **Trade-off:** Less sophisticated conflict resolution, but acceptable for MVP

### 2. **Optimistic Updates**
- **Decision:** Apply changes locally before server confirmation
- **Rationale:** Provides instant feedback, improves perceived performance
- **Implementation:** Revert on error, reconcile with server state

### 3. **Throttled Cursor Updates**
- **Decision:** Throttle cursor position updates to 50ms intervals
- **Rationale:** Reduces network traffic and server load
- **Trade-off:** Slightly less real-time, but smooth via CSS interpolation

### 4. **Single Shared Canvas**
- **Decision:** One global canvas for all users (no per-user canvases)
- **Rationale:** Simplifies MVP, focuses on core collaboration features
- **Future:** Can add multi-canvas support post-MVP

### 5. **Client-Side Viewport Management**
- **Decision:** Store viewport state (pan/zoom) in localStorage, not database
- **Rationale:** Viewport is per-user preference, not shared state
- **Benefit:** Reduces server load, instant viewport restore

### 6. **Presence Cleanup via Cron**
- **Decision:** Background job removes stale presence records every 10 seconds
- **Rationale:** Handles ungraceful disconnects (browser crash, network failure)
- **Fallback:** Client-side cleanup on beforeunload (best effort)

---

## Performance Optimizations

```mermaid
graph TB
    subgraph "Rendering Optimizations"
        ViewportCulling[Viewport Culling<br/>Only render visible shapes]
        RequestAnimFrame[requestAnimationFrame<br/>60 FPS render loop]
        ReactMemo[React.memo<br/>Prevent unnecessary re-renders]
    end
    
    subgraph "Network Optimizations"
        Throttling[Throttle cursor updates<br/>50ms intervals]
        OptimisticUI[Optimistic UI updates<br/>Instant local feedback]
        WebSocketReuse[WebSocket connection reuse<br/>Single connection for all data]
    end
    
    subgraph "Data Optimizations"
        Indexing[Database indexes<br/>Fast queries]
        LocalStorageCache[localStorage cache<br/>Viewport state]
    end
    
    ViewportCulling --> RequestAnimFrame
    RequestAnimFrame --> ReactMemo
    
    Throttling --> OptimisticUI
    OptimisticUI --> WebSocketReuse
    
    Indexing --> LocalStorageCache
```

---

## Error Handling & Resilience

```mermaid
graph TB
    subgraph "Error Types"
        NetworkError[Network Errors<br/>Connection lost]
        AuthError[Auth Errors<br/>Invalid token]
        MutationError[Mutation Errors<br/>Database failure]
    end
    
    subgraph "Handling Strategies"
        RetryLogic[Retry Logic<br/>Exponential backoff]
        RevertOptimistic[Revert Optimistic Updates<br/>Show previous state]
        ShowToast[Show Error Toast<br/>User notification]
        ReconnectWebSocket[Reconnect WebSocket<br/>Automatic retry]
    end
    
    subgraph "User Experience"
        ConnectionIndicator[Connection Status Indicator]
        ErrorMessage[Clear Error Messages]
        GracefulDegradation[Graceful Degradation<br/>Continue local work]
    end
    
    NetworkError --> ReconnectWebSocket
    NetworkError --> ConnectionIndicator
    
    AuthError --> ShowToast
    AuthError --> ErrorMessage
    
    MutationError --> RevertOptimistic
    MutationError --> RetryLogic
    MutationError --> ShowToast
    
    ReconnectWebSocket --> GracefulDegradation
```

---

## Security Architecture

```mermaid
graph TB
    subgraph "Client Security"
        HTTPS[HTTPS<br/>Encrypted transport]
        CSP[Content Security Policy<br/>XSS protection]
    end
    
    subgraph "Authentication Security"
        ClerkJWT[Clerk JWT Tokens<br/>Secure auth]
        SecureStorage[Secure token storage<br/>HTTP-only cookies]
    end
    
    subgraph "Backend Security"
        AuthValidation[Auth validation<br/>Every request]
        InputValidation[Input validation<br/>Type checking]
        RateLimiting[Rate limiting<br/>Prevent abuse]
    end
    
    subgraph "Data Security"
        UserIsolation[User isolation<br/>Clerk user IDs]
        AuditTrail[Audit trail<br/>createdBy, lastModifiedBy]
    end
    
    HTTPS --> ClerkJWT
    CSP --> SecureStorage
    
    ClerkJWT --> AuthValidation
    AuthValidation --> InputValidation
    InputValidation --> RateLimiting
    
    AuthValidation --> UserIsolation
    UserIsolation --> AuditTrail
```

---

## Deployment Architecture

```mermaid
graph TB
    subgraph "Development"
        LocalDev[Local Development<br/>bun run dev]
        ConvexDev[Convex Dev Server<br/>bunx convex dev]
    end
    
    subgraph "Version Control"
        GitHub[GitHub Repository<br/>Source code]
    end
    
    subgraph "CI/CD"
        VercelCI[Vercel CI/CD<br/>Automatic builds]
    end
    
    subgraph "Production"
        VercelProd[Vercel Production<br/>Next.js frontend]
        ConvexProd[Convex Production<br/>Backend & database]
        ClerkProd[Clerk Production<br/>Auth service]
    end
    
    subgraph "Monitoring"
        VercelAnalytics[Vercel Analytics]
        ConvexLogs[Convex Logs]
        ErrorTracking[Error Tracking<br/>Sentry optional]
    end
    
    LocalDev --> GitHub
    ConvexDev --> GitHub
    
    GitHub --> VercelCI
    VercelCI --> VercelProd
    
    VercelProd --> VercelAnalytics
    ConvexProd --> ConvexLogs
    
    VercelProd -.->|API calls| ConvexProd
    VercelProd -.->|Auth| ClerkProd
    
    style VercelProd fill:#3b82f6,stroke:#1e40af,stroke-width:2px,color:#fff
    style ConvexProd fill:#8b5cf6,stroke:#6d28d9,stroke-width:2px,color:#fff
    style ClerkProd fill:#ef4444,stroke:#b91c1c,stroke-width:2px,color:#fff
```

---

## Summary

This architecture provides:

1. **Real-time collaboration** via Convex WebSocket subscriptions
2. **Instant feedback** via optimistic updates
3. **Smooth performance** via viewport culling and throttling
4. **Secure authentication** via Clerk JWT tokens
5. **Scalable infrastructure** via Vercel + Convex Cloud
6. **Simple state management** via custom React hooks
7. **Type safety** via TypeScript end-to-end
8. **Developer experience** via Bun and modern tooling

The architecture is designed to be:
- **Simple:** Minimal dependencies, clear separation of concerns
- **Scalable:** Can handle 5+ concurrent users, 500+ shapes
- **Maintainable:** Modular components, clear data flow
- **Extensible:** Easy to add features post-MVP (AI agent, more shapes, etc.)
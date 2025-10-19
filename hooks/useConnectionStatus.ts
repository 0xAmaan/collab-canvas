/**
 * Hook for monitoring Convex connection status
 * Returns connection state and corresponding UI color
 *
 * Combines browser online state with Convex WebSocket state for accurate status.
 * Browser detects network disconnection immediately, while WebSocket may take time to timeout.
 */

import { useConvexConnectionState } from "convex/react";
import { useEffect, useState } from "react";

type ConnectionStatus = "connected" | "connecting" | "disconnected";

export const useConnectionStatus = () => {
  const connectionState = useConvexConnectionState();
  const [browserOnline, setBrowserOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );

  // Monitor browser's online/offline events
  useEffect(() => {
    const handleOnline = () => setBrowserOnline(true);
    const handleOffline = () => setBrowserOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Combine browser online state with Convex WebSocket state
  // Browser offline takes precedence for immediate network loss detection
  const status: ConnectionStatus = !browserOnline
    ? "disconnected"
    : connectionState.isWebSocketConnected
      ? "connected"
      : connectionState.hasInflightRequests
        ? "connecting"
        : "disconnected";

  const colorClasses = {
    connected: "bg-green-500",
    connecting: "bg-yellow-500",
    disconnected: "bg-red-500",
  };

  const color = colorClasses[status] || colorClasses.disconnected;

  return { status, color };
};

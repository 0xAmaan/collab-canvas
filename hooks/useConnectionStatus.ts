/**
 * Hook for monitoring Convex connection status
 * Returns connection state and corresponding UI color
 */

import { useConvexConnectionState } from "convex/react";

type ConnectionStatus = "connected" | "connecting" | "disconnected";

export const useConnectionStatus = () => {
  const connectionState = useConvexConnectionState();

  // Determine simple status from connection state object
  const status: ConnectionStatus = connectionState.isWebSocketConnected
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

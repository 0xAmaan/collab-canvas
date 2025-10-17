/**
 * Hook for monitoring Convex connection status
 * Returns connection state and corresponding UI color
 */

import { useConvexConnectionState } from "convex/react";

export const useConnectionStatus = () => {
  const status = useConvexConnectionState();
  // status can be: "connected" | "connecting" | "disconnected"

  const colorClasses = {
    connected: "bg-green-500",
    connecting: "bg-yellow-500",
    disconnected: "bg-red-500",
  };

  const color = colorClasses[status] || colorClasses.disconnected;

  return { status, color };
};

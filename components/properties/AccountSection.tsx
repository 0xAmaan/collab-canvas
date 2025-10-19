"use client";

/**
 * Account Section Component
 * Top section with user account, connection status, presence, and zoom controls
 */

import { PresencePanel } from "@/components/presence/PresencePanel";
import { PropertySection } from "@/components/ui/PropertySection";
import { ZoomControls } from "@/components/toolbar/ZoomControls";
import type { Presence } from "@/types/presence";
import { UserButton } from "@clerk/nextjs";
import type { Canvas as FabricCanvas } from "fabric";
import { useRef } from "react";

interface AccountSectionProps {
  canvas: FabricCanvas | null;
  allUsers: Presence[];
  currentUserId: string;
  status: string;
  statusColor: string;
  isMounted: boolean;
}

export const AccountSection = ({
  canvas,
  allUsers,
  currentUserId,
  status,
  statusColor,
  isMounted,
}: AccountSectionProps) => {
  const userButtonRef = useRef<HTMLDivElement>(null);

  // Find current user's name
  const currentUser = allUsers.find((user) => user.userId === currentUserId);
  const userName = currentUser?.userName || "User";

  return (
    <div>
      {/* User Account */}
      <div className="mb-6">
        <div
          className="flex items-center gap-3 py-2 cursor-pointer hover:bg-white/5 rounded-lg transition-colors"
          onClick={(e) => {
            if (
              e.target === e.currentTarget ||
              !(e.target as HTMLElement).closest("[data-clerk-user-button]")
            ) {
              const button = userButtonRef.current?.querySelector("button");
              button?.click();
            }
          }}
        >
          <div
            ref={userButtonRef}
            data-clerk-user-button
            className="flex items-center"
          >
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "ring-2 ring-green-500",
                },
              }}
            />
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-white/70 font-medium">
              {userName}
            </span>
            <span className="text-xs text-white/40">(you)</span>
          </div>
        </div>
      </div>

      {/* Connection Status & Active Users */}
      <div className="mb-6">
        <div className="border-t border-white/8 -mx-4 mb-4" />
        <div className="space-y-4">
          {/* Connection Status */}
          {isMounted && (
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${statusColor}`}
                title={`Connection: ${status}`}
              />
              <span className="text-xs text-white/50 capitalize">{status}</span>
            </div>
          )}

          {/* Active Users */}
          {allUsers.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-white/50">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <span>Active Users</span>
              </div>
              <PresencePanel
                activeUsers={allUsers}
                currentUserId={currentUserId}
                maxVisible={5}
              />
            </div>
          )}
        </div>
      </div>

      {/* Zoom Controls */}
      <PropertySection title="Zoom" divider>
        <ZoomControls canvas={canvas} />
      </PropertySection>
    </div>
  );
};

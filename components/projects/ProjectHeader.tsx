"use client";

/**
 * Project Header Component
 * Displays project name, back button, and share controls
 */

import { useState } from "react";
import { ArrowLeft, Globe, Lock, Share2, Check } from "lucide-react";
import Link from "next/link";

interface ProjectHeaderProps {
  projectName: string;
  isPublic: boolean;
  isOwner: boolean;
  onTogglePublic: () => void;
}

export const ProjectHeader = ({
  projectName,
  isPublic,
  isOwner,
  onTogglePublic,
}: ProjectHeaderProps) => {
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="absolute top-4 left-4 z-20 flex items-center gap-3">
      {/* Back to Projects Button */}
      <Link
        href="/projects"
        className="flex items-center gap-2 px-3 py-2 bg-panel hover:bg-toolbar text-white rounded-lg transition-colors border border-white/10 shadow-xl"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-medium">Projects</span>
      </Link>

      {/* Project Name */}
      <div className="px-4 py-2 bg-panel text-white rounded-lg border border-white/10 shadow-xl">
        <span className="text-sm font-semibold">{projectName}</span>
      </div>

      {/* Share Button (only for owner) */}
      {isOwner && (
        <div className="relative">
          <button
            onClick={() => setShowShareMenu(!showShareMenu)}
            className="flex items-center gap-2 px-3 py-2 bg-panel hover:bg-toolbar text-white rounded-lg transition-colors border border-white/10 shadow-xl"
          >
            <Share2 className="w-4 h-4" />
            <span className="text-sm font-medium">Share</span>
          </button>

          {/* Share Menu */}
          {showShareMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowShareMenu(false)}
              />
              <div className="absolute left-0 mt-2 w-64 bg-panel border border-white/10 rounded-lg shadow-xl z-20 overflow-hidden">
                <div className="p-3 border-b border-white/10">
                  <p className="text-xs text-gray-400 mb-2">Visibility</p>
                  <button
                    onClick={() => {
                      onTogglePublic();
                      setShowShareMenu(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 bg-toolbar hover:bg-gray-700 text-white rounded-lg transition-colors text-sm"
                  >
                    <div className="flex items-center gap-2">
                      {isPublic ? (
                        <>
                          <Globe className="w-4 h-4 text-green-400" />
                          <span>Public</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4 text-gray-400" />
                          <span>Private</span>
                        </>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">
                      Click to toggle
                    </span>
                  </button>
                  <p className="text-xs text-gray-500 mt-2">
                    {isPublic
                      ? "Anyone with the link can view and edit"
                      : "Only you can access this project"}
                  </p>
                </div>

                {isPublic && (
                  <div className="p-3">
                    <p className="text-xs text-gray-400 mb-2">Share Link</p>
                    <button
                      onClick={handleCopyLink}
                      className="w-full flex items-center justify-between px-3 py-2 bg-toolbar hover:bg-gray-700 text-white rounded-lg transition-colors text-sm"
                    >
                      <span className="truncate">
                        {typeof window !== "undefined"
                          ? window.location.href
                          : ""}
                      </span>
                      {copied ? (
                        <Check className="w-4 h-4 text-green-400 flex-shrink-0 ml-2" />
                      ) : (
                        <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                          Copy
                        </span>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Public Indicator (for non-owners) */}
      {!isOwner && isPublic && (
        <div className="flex items-center gap-2 px-3 py-2 bg-panel text-green-400 rounded-lg border border-white/10 shadow-xl">
          <Globe className="w-4 h-4" />
          <span className="text-sm font-medium">Public Project</span>
        </div>
      )}
    </div>
  );
};

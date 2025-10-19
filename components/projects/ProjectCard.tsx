"use client";

/**
 * Project Card Component
 * Displays a single project with thumbnail, name, and actions
 */

import { useState } from "react";
import { MoreVertical, Copy, Edit, Trash, Globe, Lock } from "lucide-react";
import Link from "next/link";
import type { Id } from "@/convex/_generated/dataModel";

interface Project {
  _id: Id<"projects">;
  name: string;
  ownerId: string;
  isPublic: boolean;
  createdAt: number;
  lastModified: number;
  thumbnail?: string;
}

interface ProjectCardProps {
  project: Project;
  onRename: (project: Project) => void;
  onDuplicate: (projectId: Id<"projects">) => void;
  onDelete: (project: Project) => void;
  onTogglePublic: (projectId: Id<"projects">, isPublic: boolean) => void;
}

export const ProjectCard = ({
  project,
  onRename,
  onDuplicate,
  onDelete,
  onTogglePublic,
}: ProjectCardProps) => {
  const [showMenu, setShowMenu] = useState(false);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="group relative bg-panel border border-white/10 rounded-lg overflow-hidden hover:border-primary/50 transition-all duration-200">
      {/* Thumbnail */}
      <Link href={`/projects/${project._id}`}>
        <div className="aspect-video bg-toolbar flex items-center justify-center overflow-hidden">
          {project.thumbnail ? (
            <img
              src={project.thumbnail}
              alt={project.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-gray-600 text-4xl font-bold">
              {project.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </Link>

      {/* Project Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <Link href={`/projects/${project._id}`} className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-white truncate group-hover:text-primary transition-colors">
              {project.name}
            </h3>
          </Link>

          {/* Menu Button */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 text-gray-400 hover:text-white transition-colors rounded hover:bg-toolbar"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 mt-1 w-48 bg-panel border border-white/10 rounded-lg shadow-xl z-20 overflow-hidden">
                  <button
                    onClick={() => {
                      onRename(project);
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-toolbar hover:text-white transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Rename
                  </button>

                  <button
                    onClick={() => {
                      onDuplicate(project._id);
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-toolbar hover:text-white transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    Duplicate
                  </button>

                  <button
                    onClick={() => {
                      onTogglePublic(project._id, !project.isPublic);
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-toolbar hover:text-white transition-colors"
                  >
                    {project.isPublic ? (
                      <>
                        <Lock className="w-4 h-4" />
                        Make Private
                      </>
                    ) : (
                      <>
                        <Globe className="w-4 h-4" />
                        Make Public
                      </>
                    )}
                  </button>

                  <div className="border-t border-white/10" />

                  <button
                    onClick={() => {
                      onDelete(project);
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-toolbar hover:text-red-300 transition-colors"
                  >
                    <Trash className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span>Modified {formatDate(project.lastModified)}</span>
          {project.isPublic && (
            <>
              <span>•</span>
              <div className="flex items-center gap-1 text-green-400">
                <Globe className="w-3.5 h-3.5" />
                <span>Public</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

"use client";

/**
 * Projects List Client Component
 * Displays grid of user's projects with CRUD operations
 */

import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { ProjectCard } from "@/components/projects/ProjectCard";
import {
  NewProjectDialog,
  RenameProjectDialog,
  DeleteConfirmDialog,
} from "@/components/projects/ProjectDialogs";
import { useProjects } from "@/hooks/useProject";
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

export const ProjectsClient = () => {
  const router = useRouter();
  const {
    projects,
    createProject,
    updateProject,
    deleteProject,
    duplicateProject,
    isLoading,
  } = useProjects();

  const [searchQuery, setSearchQuery] = useState("");
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [renameProject, setRenameProject] = useState<Project | null>(null);
  const [deleteProjectData, setDeleteProjectData] = useState<Project | null>(
    null,
  );

  // Filter projects by search query
  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleCreateProject = async (name: string) => {
    try {
      const projectId = await createProject(name);
      // Navigate to the new project
      router.push(`/projects/${projectId}`);
    } catch (error) {
      console.error("Failed to create project:", error);
    }
  };

  const handleRenameProject = async (name: string) => {
    if (!renameProject) return;

    try {
      await updateProject(renameProject._id, { name });
    } catch (error) {
      console.error("Failed to rename project:", error);
    }
  };

  const handleDuplicateProject = async (projectId: Id<"projects">) => {
    try {
      const newProjectId = await duplicateProject(projectId);
      // Optionally navigate to the duplicated project
      router.push(`/projects/${newProjectId}`);
    } catch (error) {
      console.error("Failed to duplicate project:", error);
    }
  };

  const handleDeleteProject = async () => {
    if (!deleteProjectData) return;

    try {
      await deleteProject(deleteProjectData._id);
    } catch (error) {
      console.error("Failed to delete project:", error);
    }
  };

  const handleTogglePublic = async (
    projectId: Id<"projects">,
    isPublic: boolean,
  ) => {
    try {
      await updateProject(projectId, { isPublic });
    } catch (error) {
      console.error("Failed to toggle project visibility:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-sidebar flex items-center justify-center">
        <div className="text-white text-lg">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sidebar p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Projects</h1>
            <p className="text-gray-400">
              {projects.length} {projects.length === 1 ? "project" : "projects"}
            </p>
          </div>

          <button
            onClick={() => setShowNewDialog(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Project
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects..."
            className="w-full pl-10 pr-4 py-3 bg-panel border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Projects Grid */}
      <div className="max-w-7xl mx-auto">
        {filteredProjects.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg mb-4">
              {searchQuery ? "No projects found" : "No projects yet"}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowNewDialog(true)}
                className="text-primary hover:text-blue-400 transition-colors"
              >
                Create your first project
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project._id}
                project={project}
                onRename={setRenameProject}
                onDuplicate={handleDuplicateProject}
                onDelete={setDeleteProjectData}
                onTogglePublic={handleTogglePublic}
              />
            ))}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <NewProjectDialog
        isOpen={showNewDialog}
        onClose={() => setShowNewDialog(false)}
        onConfirm={handleCreateProject}
      />

      <RenameProjectDialog
        isOpen={!!renameProject}
        currentName={renameProject?.name || ""}
        onClose={() => setRenameProject(null)}
        onConfirm={handleRenameProject}
      />

      <DeleteConfirmDialog
        isOpen={!!deleteProjectData}
        projectName={deleteProjectData?.name || ""}
        onClose={() => setDeleteProjectData(null)}
        onConfirm={handleDeleteProject}
      />
    </div>
  );
};

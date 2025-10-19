/**
 * Custom hook for managing project operations
 * Provides CRUD operations and project state management
 */

import { useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export const useProject = (projectId: Id<"projects"> | undefined) => {
  // Query project data
  const project = useQuery(
    api.projects.getProject,
    projectId ? { projectId } : "skip",
  );

  // Mutations
  const updateProjectMutation = useMutation(api.projects.updateProject);
  const deleteProjectMutation = useMutation(api.projects.deleteProject);
  const duplicateProjectMutation = useMutation(api.projects.duplicateProject);
  const updateThumbnailMutation = useMutation(
    api.projects.updateProjectThumbnail,
  );

  /**
   * Update project name and/or visibility
   */
  const updateProject = useCallback(
    async (updates: { name?: string; isPublic?: boolean }) => {
      if (!projectId) {
        throw new Error("Project ID is required");
      }

      try {
        await updateProjectMutation({
          projectId,
          ...updates,
        });
      } catch (error) {
        console.error("Failed to update project:", error);
        throw error;
      }
    },
    [projectId, updateProjectMutation],
  );

  /**
   * Delete project and all its shapes
   */
  const deleteProject = useCallback(async () => {
    if (!projectId) {
      throw new Error("Project ID is required");
    }

    try {
      await deleteProjectMutation({ projectId });
    } catch (error) {
      console.error("Failed to delete project:", error);
      throw error;
    }
  }, [projectId, deleteProjectMutation]);

  /**
   * Duplicate project with all shapes
   * Returns the new project ID
   */
  const duplicateProject = useCallback(async () => {
    if (!projectId) {
      throw new Error("Project ID is required");
    }

    try {
      const newProjectId = await duplicateProjectMutation({ projectId });
      return newProjectId;
    } catch (error) {
      console.error("Failed to duplicate project:", error);
      throw error;
    }
  }, [projectId, duplicateProjectMutation]);

  /**
   * Update project thumbnail
   */
  const updateThumbnail = useCallback(
    async (thumbnail: string) => {
      if (!projectId) {
        throw new Error("Project ID is required");
      }

      try {
        await updateThumbnailMutation({ projectId, thumbnail });
      } catch (error) {
        console.error("Failed to update thumbnail:", error);
        throw error;
      }
    },
    [projectId, updateThumbnailMutation],
  );

  return {
    project,
    updateProject,
    deleteProject,
    duplicateProject,
    updateThumbnail,
    isLoading: project === undefined,
    hasError: project === null,
  };
};

/**
 * Hook for managing project list
 */
export const useProjects = () => {
  // Query all user's projects
  const projects = useQuery(api.projects.getMyProjects);

  // Mutations
  const createProjectMutation = useMutation(api.projects.createProject);
  const updateProjectMutation = useMutation(api.projects.updateProject);
  const deleteProjectMutation = useMutation(api.projects.deleteProject);
  const duplicateProjectMutation = useMutation(api.projects.duplicateProject);

  /**
   * Create a new project
   * Returns the new project ID
   */
  const createProject = useCallback(
    async (name: string) => {
      try {
        const projectId = await createProjectMutation({ name });
        return projectId;
      } catch (error) {
        console.error("Failed to create project:", error);
        throw error;
      }
    },
    [createProjectMutation],
  );

  /**
   * Update a project (name or visibility)
   */
  const updateProject = useCallback(
    async (
      projectId: Id<"projects">,
      updates: { name?: string; isPublic?: boolean },
    ) => {
      try {
        await updateProjectMutation({ projectId, ...updates });
      } catch (error) {
        console.error("Failed to update project:", error);
        throw error;
      }
    },
    [updateProjectMutation],
  );

  /**
   * Delete a project
   */
  const deleteProject = useCallback(
    async (projectId: Id<"projects">) => {
      try {
        await deleteProjectMutation({ projectId });
      } catch (error) {
        console.error("Failed to delete project:", error);
        throw error;
      }
    },
    [deleteProjectMutation],
  );

  /**
   * Duplicate a project
   * Returns the new project ID
   */
  const duplicateProject = useCallback(
    async (projectId: Id<"projects">) => {
      try {
        const newProjectId = await duplicateProjectMutation({ projectId });
        return newProjectId;
      } catch (error) {
        console.error("Failed to duplicate project:", error);
        throw error;
      }
    },
    [duplicateProjectMutation],
  );

  return {
    projects: projects ?? [],
    createProject,
    updateProject,
    deleteProject,
    duplicateProject,
    isLoading: projects === undefined,
  };
};

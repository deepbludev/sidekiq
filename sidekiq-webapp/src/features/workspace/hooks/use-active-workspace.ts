"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@sidekiq/shared/trpc/react";

const ACTIVE_WORKSPACE_KEY = "sidekiq-active-workspace-id";

interface UseActiveWorkspaceResult {
  /** Currently active workspace ID, or null if no workspace selected */
  activeWorkspaceId: string | null;
  /** Set the active workspace */
  setActiveWorkspaceId: (workspaceId: string | null) => void;
  /** The active workspace data, or null */
  activeWorkspace: {
    id: string;
    name: string;
    avatar: unknown;
    role: string;
  } | null;
  /** All workspaces the user is a member of */
  workspaces: {
    id: string;
    name: string;
    avatar: unknown;
    role: string;
  }[];
  /** Whether workspaces are loading */
  isLoading: boolean;
}

/**
 * Hook for managing the active workspace state.
 *
 * Features:
 * - Persists active workspace to localStorage
 * - Validates stored workspace ID against user's workspaces
 * - Falls back to null if stored workspace is invalid
 * - Invalidates workspace-scoped queries on workspace switch
 *
 * Per CONTEXT.md: Active workspace selection persists across sessions.
 *
 * @returns Object containing active workspace state and management functions
 *
 * @example
 * ```tsx
 * const { activeWorkspace, setActiveWorkspaceId, workspaces } = useActiveWorkspace();
 *
 * // Switch to a different workspace
 * setActiveWorkspaceId(workspace.id);
 *
 * // Switch to personal (no workspace)
 * setActiveWorkspaceId(null);
 * ```
 */
export function useActiveWorkspace(): UseActiveWorkspaceResult {
  const [activeWorkspaceId, setActiveWorkspaceIdState] = useState<
    string | null
  >(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // tRPC utils for query invalidation on workspace switch
  const utils = api.useUtils();

  // Fetch user's workspaces
  const { data: workspaces = [], isLoading } = api.workspace.list.useQuery();

  // Initialize from localStorage (SSR-safe)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const stored = localStorage.getItem(ACTIVE_WORKSPACE_KEY);
    setActiveWorkspaceIdState(stored);
    setIsInitialized(true);
  }, []);

  // Validate stored workspace ID when workspaces load
  useEffect(() => {
    if (!isInitialized || isLoading) return;

    // If we have a stored ID, validate it exists in user's workspaces
    if (activeWorkspaceId) {
      const workspaceExists = workspaces.some(
        (w) => w.id === activeWorkspaceId,
      );
      if (!workspaceExists) {
        // Stored workspace no longer valid (deleted, removed), clear it
        localStorage.removeItem(ACTIVE_WORKSPACE_KEY);
        setActiveWorkspaceIdState(null);
      }
    }
  }, [activeWorkspaceId, workspaces, isLoading, isInitialized]);

  // Set active workspace with localStorage persistence and query invalidation
  const setActiveWorkspaceId = useCallback(
    (workspaceId: string | null) => {
      if (workspaceId) {
        localStorage.setItem(ACTIVE_WORKSPACE_KEY, workspaceId);
      } else {
        localStorage.removeItem(ACTIVE_WORKSPACE_KEY);
      }
      setActiveWorkspaceIdState(workspaceId);

      // Invalidate workspace-scoped queries so they refetch with new x-workspace-id header
      void utils.thread.list.invalidate();
      void utils.sidekiq.list.invalidate();
      // Note: workspace.list is intentionally NOT invalidated (it's user-global, not workspace-scoped)
    },
    [utils],
  );

  // Find active workspace data
  const activeWorkspace = activeWorkspaceId
    ? (workspaces.find((w) => w.id === activeWorkspaceId) ?? null)
    : null;

  return {
    activeWorkspaceId,
    setActiveWorkspaceId,
    activeWorkspace,
    workspaces,
    isLoading: isLoading || !isInitialized,
  };
}

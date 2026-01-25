"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@sidekiq/trpc/react";

const ACTIVE_TEAM_KEY = "sidekiq-active-team-id";

interface UseActiveTeamResult {
  /** Currently active team ID, or null if no team selected */
  activeTeamId: string | null;
  /** Set the active team */
  setActiveTeamId: (teamId: string | null) => void;
  /** The active team data, or null */
  activeTeam: {
    id: string;
    name: string;
    avatar: unknown;
    role: string;
  } | null;
  /** All teams the user is a member of */
  teams: {
    id: string;
    name: string;
    avatar: unknown;
    role: string;
  }[];
  /** Whether teams are loading */
  isLoading: boolean;
}

/**
 * Hook for managing the active team state.
 *
 * Features:
 * - Persists active team to localStorage
 * - Validates stored team ID against user's teams
 * - Falls back to null if stored team is invalid
 *
 * Per CONTEXT.md: Active team selection persists across sessions.
 *
 * @returns Object containing active team state and management functions
 *
 * @example
 * ```tsx
 * const { activeTeam, setActiveTeamId, teams } = useActiveTeam();
 *
 * // Switch to a different team
 * setActiveTeamId(team.id);
 *
 * // Switch to personal (no team)
 * setActiveTeamId(null);
 * ```
 */
export function useActiveTeam(): UseActiveTeamResult {
  const [activeTeamId, setActiveTeamIdState] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Fetch user's teams
  const { data: teams = [], isLoading } = api.team.list.useQuery();

  // Initialize from localStorage (SSR-safe)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const stored = localStorage.getItem(ACTIVE_TEAM_KEY);
    setActiveTeamIdState(stored);
    setIsInitialized(true);
  }, []);

  // Validate stored team ID when teams load
  useEffect(() => {
    if (!isInitialized || isLoading) return;

    // If we have a stored ID, validate it exists in user's teams
    if (activeTeamId) {
      const teamExists = teams.some((t) => t.id === activeTeamId);
      if (!teamExists) {
        // Stored team no longer valid (deleted, removed), clear it
        localStorage.removeItem(ACTIVE_TEAM_KEY);
        setActiveTeamIdState(null);
      }
    }
  }, [activeTeamId, teams, isLoading, isInitialized]);

  // Set active team with localStorage persistence
  const setActiveTeamId = useCallback((teamId: string | null) => {
    if (teamId) {
      localStorage.setItem(ACTIVE_TEAM_KEY, teamId);
    } else {
      localStorage.removeItem(ACTIVE_TEAM_KEY);
    }
    setActiveTeamIdState(teamId);
  }, []);

  // Find active team data
  const activeTeam = activeTeamId
    ? (teams.find((t) => t.id === activeTeamId) ?? null)
    : null;

  return {
    activeTeamId,
    setActiveTeamId,
    activeTeam,
    teams,
    isLoading: isLoading || !isInitialized,
  };
}

"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Fuse, { type FuseResult } from "fuse.js";
import type { ReactNode } from "react";

/**
 * Member data structure for search.
 * Represents a team member with their user info and role.
 */
export interface TeamMember {
  userId: string;
  role: "owner" | "admin" | "member";
  joinedAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
}

/**
 * Result from the useMemberSearch hook.
 */
export interface UseMemberSearchResult {
  /** Current search query string */
  query: string;
  /** Function to update the search query */
  setQuery: (query: string) => void;
  /** Filtered members based on search query (or all members if query empty) */
  results: TeamMember[];
  /** True while debouncing (query changed but search not yet executed) */
  isSearching: boolean;
  /** Function to highlight matching text */
  highlightMatch: (text: string) => ReactNode;
}

/**
 * Hook for fuzzy searching team members by name or email.
 *
 * Features:
 * - Fuse.js fuzzy matching with typo tolerance (threshold 0.4 per CONTEXT.md)
 * - 200ms debounce for performance during typing
 * - Match highlighting for search results
 * - Returns all members when query is empty
 *
 * @example
 * ```tsx
 * const members = api.team.listMembers.useQuery({ id: teamId }).data ?? [];
 * const { query, setQuery, results, highlightMatch } = useMemberSearch(members);
 *
 * return (
 *   <div>
 *     <input value={query} onChange={(e) => setQuery(e.target.value)} />
 *     {results.map(member => (
 *       <div key={member.userId}>
 *         {highlightMatch(member.user.name)}
 *       </div>
 *     ))}
 *   </div>
 * );
 * ```
 *
 * @param members - Array of team members to search
 * @returns Search state and utilities
 */
export function useMemberSearch(members: TeamMember[]): UseMemberSearchResult {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce search query (200ms)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 200);
    return () => clearTimeout(timer);
  }, [query]);

  // Create Fuse instance (memoized)
  const fuse = useMemo(
    () =>
      new Fuse(members, {
        keys: ["user.name", "user.email"],
        threshold: 0.4, // Per CONTEXT.md - matches thread search
        ignoreLocation: true,
        includeMatches: true,
      }),
    [members],
  );

  // Get search results
  const searchResults = useMemo((): FuseResult<TeamMember>[] | null => {
    if (!debouncedQuery.trim()) return null;
    return fuse.search(debouncedQuery);
  }, [fuse, debouncedQuery]);

  const results = useMemo(() => {
    if (searchResults === null) return members;
    return searchResults.map((result) => result.item);
  }, [searchResults, members]);

  // Highlight matching text
  const highlightMatch = useCallback(
    (text: string): ReactNode => {
      if (!debouncedQuery.trim() || !text) return text;

      // Find matching result
      const matchResult = searchResults?.find(
        (r) => r.item.user.name === text || r.item.user.email === text,
      );

      if (!matchResult?.matches) return text;

      // Find the match for this specific text
      const match = matchResult.matches.find((m) => m.value === text);

      if (!match?.indices) return text;

      const parts: ReactNode[] = [];
      let lastIndex = 0;

      match.indices.forEach(([start, end], i) => {
        if (start > lastIndex) {
          parts.push(text.slice(lastIndex, start));
        }
        parts.push(
          <mark key={i} className="rounded bg-yellow-500/30 px-0.5">
            {text.slice(start, end + 1)}
          </mark>,
        );
        lastIndex = end + 1;
      });

      if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex));
      }

      return <>{parts}</>;
    },
    [debouncedQuery, searchResults],
  );

  return {
    query,
    setQuery,
    results,
    isSearching: query !== debouncedQuery,
    highlightMatch,
  };
}

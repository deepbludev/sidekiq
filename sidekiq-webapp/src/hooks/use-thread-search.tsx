"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Fuse, { type FuseResult } from "fuse.js";
import type { ReactNode } from "react";

/**
 * Thread data required for search.
 * Matches the Thread interface from date-grouping.ts.
 */
export interface Thread {
  id: string;
  title: string | null;
  isPinned: boolean;
  isArchived: boolean;
  lastActivityAt: Date;
  messageCount: number;
}

/**
 * Result from the useThreadSearch hook.
 */
export interface UseThreadSearchResult {
  /** Current search query string */
  query: string;
  /** Function to update the search query */
  setQuery: (query: string) => void;
  /** Filtered threads based on search query (or all threads if query empty) */
  results: Thread[];
  /** True while debouncing (query changed but search not yet executed) */
  isSearching: boolean;
  /** Function to highlight matching text in a thread title */
  highlightMatch: (text: string) => ReactNode;
}

/**
 * Hook for fuzzy searching threads by title.
 *
 * Features:
 * - Fuse.js fuzzy matching with typo tolerance (threshold 0.4)
 * - 200ms debounce for performance during typing
 * - Match highlighting for search results
 * - Returns all threads when query is empty
 *
 * @example
 * ```tsx
 * const threads = api.thread.list.useQuery().data ?? [];
 * const { query, setQuery, results, isSearching, highlightMatch } = useThreadSearch(threads);
 *
 * return (
 *   <div>
 *     <input value={query} onChange={(e) => setQuery(e.target.value)} />
 *     {results.map(thread => (
 *       <div key={thread.id}>
 *         {highlightMatch(thread.title ?? "New conversation")}
 *       </div>
 *     ))}
 *   </div>
 * );
 * ```
 *
 * @param threads - Array of threads to search
 * @returns Search state and utilities
 */
export function useThreadSearch(threads: Thread[]): UseThreadSearchResult {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce search query (200ms per CONTEXT.md)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 200);
    return () => clearTimeout(timer);
  }, [query]);

  // Create Fuse instance (memoized)
  const fuse = useMemo(
    () =>
      new Fuse(threads, {
        keys: ["title"],
        threshold: 0.4, // Per Phase 4 pattern - allows typos
        ignoreLocation: true,
        includeMatches: true, // For highlighting
      }),
    [threads],
  );

  // Get search results
  const searchResults = useMemo((): FuseResult<Thread>[] | null => {
    if (!debouncedQuery.trim()) return null; // null = no search active
    return fuse.search(debouncedQuery);
  }, [fuse, debouncedQuery]);

  const results = useMemo(() => {
    if (searchResults === null) return threads; // Return all threads when not searching
    return searchResults.map((result) => result.item);
  }, [searchResults, threads]);

  // Highlight matching text in title
  const highlightMatch = useCallback(
    (text: string): ReactNode => {
      if (!debouncedQuery.trim() || !text) return text;

      // Find the matching result to get match indices
      const matchResult = searchResults?.find((r) => r.item.title === text);
      if (!matchResult?.matches?.[0]?.indices) return text;

      const indices = matchResult.matches[0].indices;
      const parts: ReactNode[] = [];
      let lastIndex = 0;

      indices.forEach(([start, end], i) => {
        // Add non-matching text before this match
        if (start > lastIndex) {
          parts.push(text.slice(lastIndex, start));
        }
        // Add highlighted match
        parts.push(
          <mark key={i} className="rounded bg-yellow-500/30 px-0.5">
            {text.slice(start, end + 1)}
          </mark>,
        );
        lastIndex = end + 1;
      });

      // Add remaining text after last match
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

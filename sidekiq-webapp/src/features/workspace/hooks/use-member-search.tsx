"use client";

import { useState, useMemo, useCallback } from "react";

export interface WorkspaceMember {
  userId: string;
  role: "owner" | "admin" | "member";
  user: {
    name: string;
    email: string;
    image: string | null;
  };
}

/**
 * Hook for searching and highlighting workspace members.
 * Supports fuzzy matching on name and email fields.
 *
 * @param members - Array of workspace members to search through
 * @returns Object with query state, filtered results, and highlight function
 *
 * @example
 * ```tsx
 * const { query, setQuery, results, highlightMatch } = useMemberSearch(members);
 *
 * <Input value={query} onChange={(e) => setQuery(e.target.value)} />
 * {results.map(member => (
 *   <span>{highlightMatch(member.user.name)}</span>
 * ))}
 * ```
 */
export function useMemberSearch(members: WorkspaceMember[]) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    if (!query.trim()) return members;

    const lower = query.toLowerCase();
    return members.filter(
      (member) =>
        member.user.name.toLowerCase().includes(lower) ||
        member.user.email.toLowerCase().includes(lower),
    );
  }, [members, query]);

  /**
   * Wraps matching text portions in <mark> elements for visual highlighting.
   * Returns plain text if no query or no match found.
   *
   * @param text - The text to search and potentially highlight
   * @returns React node with highlighted matches
   */
  const highlightMatch = useCallback(
    (text: string): React.ReactNode => {
      if (!query.trim()) return text;

      const lower = text.toLowerCase();
      const idx = lower.indexOf(query.toLowerCase());
      if (idx === -1) return text;

      return (
        <>
          {text.slice(0, idx)}
          <mark className="bg-primary/20 rounded px-0.5">
            {text.slice(idx, idx + query.length)}
          </mark>
          {text.slice(idx + query.length)}
        </>
      );
    },
    [query],
  );

  return {
    query,
    setQuery,
    results,
    highlightMatch,
  };
}

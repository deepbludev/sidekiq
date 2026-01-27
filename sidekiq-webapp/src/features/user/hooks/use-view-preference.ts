"use client";

import { useState, useEffect, useCallback } from "react";

type ViewMode = "grid" | "list";

const STORAGE_KEY = "sidekiq-view-preference";
const DEFAULT_VIEW: ViewMode = "grid";

/**
 * Hook for persisted view preference (grid/list).
 * Stores preference in localStorage for persistence across sessions.
 *
 * @returns Object with viewMode state and setViewMode function
 *
 * @example
 * ```tsx
 * const { viewMode, setViewMode } = useViewPreference();
 *
 * <ToggleGroup value={viewMode} onValueChange={setViewMode}>
 *   <ToggleGroupItem value="grid">Grid</ToggleGroupItem>
 *   <ToggleGroupItem value="list">List</ToggleGroupItem>
 * </ToggleGroup>
 * ```
 */
export function useViewPreference() {
  // Initialize with default to avoid hydration mismatch
  const [viewMode, setViewModeState] = useState<ViewMode>(DEFAULT_VIEW);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage after mount (SSR-safe)
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "grid" || stored === "list") {
      setViewModeState(stored);
    }
    setIsHydrated(true);
  }, []);

  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode);
    localStorage.setItem(STORAGE_KEY, mode);
  }, []);

  return {
    viewMode,
    setViewMode,
    isHydrated,
  };
}

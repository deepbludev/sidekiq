"use client";

import { useState, useCallback } from "react";

/** localStorage key for sidebar collapsed state */
const STORAGE_KEY = "sidebar-collapsed";

/**
 * Interface for sidebar state management.
 */
interface SidebarState {
  /** Whether the sidebar is currently collapsed */
  isCollapsed: boolean;
  /** Toggle the sidebar between collapsed and expanded states */
  toggle: () => void;
  /** Directly set the collapsed state */
  setIsCollapsed: (collapsed: boolean) => void;
}

/**
 * Hook for managing sidebar collapse state with localStorage persistence.
 *
 * Handles:
 * - SSR-safe localStorage read via lazy state initializer
 * - Automatic persistence on state change
 * - Toggle and direct set methods
 *
 * @example
 * ```tsx
 * function Sidebar() {
 *   const { isCollapsed, toggle } = useSidebarState();
 *
 *   return (
 *     <aside className={isCollapsed ? "w-16" : "w-72"}>
 *       <button onClick={toggle}>Toggle</button>
 *     </aside>
 *   );
 * }
 * ```
 *
 * @returns {SidebarState} Sidebar state and control methods
 */
export function useSidebarState(): SidebarState {
  const [isCollapsed, setIsCollapsedState] = useState<boolean>(() => {
    // SSR-safe: only access localStorage on client
    if (typeof window === "undefined") {
      return false;
    }
    return localStorage.getItem(STORAGE_KEY) === "true";
  });

  const setIsCollapsed = useCallback((collapsed: boolean) => {
    setIsCollapsedState(collapsed);
    localStorage.setItem(STORAGE_KEY, String(collapsed));
  }, []);

  const toggle = useCallback(() => {
    setIsCollapsed(!isCollapsed);
  }, [isCollapsed, setIsCollapsed]);

  return {
    isCollapsed,
    toggle,
    setIsCollapsed,
  };
}

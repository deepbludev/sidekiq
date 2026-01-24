"use client";

import { useEffect } from "react";

/**
 * Handlers for global keyboard shortcuts.
 */
interface ShortcutHandlers {
  /** Called when Cmd/Ctrl+N is pressed (new chat) */
  onNewChat?: () => void;
  /** Called when Cmd/Ctrl+B is pressed (toggle sidebar) */
  onToggleSidebar?: () => void;
  /** Called when Cmd/Ctrl+K is pressed (focus search) */
  onFocusSearch?: () => void;
}

/**
 * Hook for handling global keyboard shortcuts.
 *
 * Registers the following shortcuts:
 * - Cmd/Ctrl+N: New chat
 * - Cmd/Ctrl+B: Toggle sidebar
 * - Cmd/Ctrl+K: Focus search
 *
 * Handles both Mac (metaKey) and Windows/Linux (ctrlKey) modifier keys.
 * Properly cleans up event listeners on unmount.
 *
 * @example
 * ```tsx
 * function App() {
 *   const router = useRouter();
 *   const { toggle } = useSidebarState();
 *   const searchRef = useRef<HTMLInputElement>(null);
 *
 *   useKeyboardShortcuts({
 *     onNewChat: () => router.push("/chat"),
 *     onToggleSidebar: toggle,
 *     onFocusSearch: () => searchRef.current?.focus(),
 *   });
 *
 *   return <App />;
 * }
 * ```
 *
 * @param handlers - Object containing callback functions for each shortcut
 */
export function useKeyboardShortcuts({
  onNewChat,
  onToggleSidebar,
  onFocusSearch,
}: ShortcutHandlers): void {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for modifier key (Cmd on Mac, Ctrl on Windows/Linux)
      const isMod = e.metaKey || e.ctrlKey;
      if (!isMod) return;

      const key = e.key.toLowerCase();

      if (key === "n" && onNewChat) {
        e.preventDefault();
        onNewChat();
      } else if (key === "b" && onToggleSidebar) {
        e.preventDefault();
        onToggleSidebar();
      } else if (key === "k" && onFocusSearch) {
        e.preventDefault();
        onFocusSearch();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onNewChat, onToggleSidebar, onFocusSearch]);
}

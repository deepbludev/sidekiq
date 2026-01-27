"use client";

import { useEffect, useRef } from "react";

/**
 * Handlers for global keyboard shortcuts.
 */
interface ShortcutHandlers {
  /** Called when Cmd/Ctrl+K → C chord is pressed (new chat) */
  onNewChat?: () => void;
  /** Called when Cmd/Ctrl+B is pressed (toggle sidebar) */
  onToggleSidebar?: () => void;
  /** Called when Cmd/Ctrl+K is pressed with no chord follow-up (focus search) */
  onFocusSearch?: () => void;
  /** Called when Cmd/Ctrl+Shift+S is pressed (open Sidekiq picker) */
  onOpenSidekiqPicker?: () => void;
}

/** Timeout in ms to wait for the second key in a chord shortcut. */
const CHORD_TIMEOUT_MS = 1000;

/**
 * Hook for handling global keyboard shortcuts.
 *
 * Registers the following shortcuts:
 * - Cmd/Ctrl+K → C: New chat (chord shortcut)
 * - Cmd/Ctrl+K (no follow-up): Focus search
 * - Cmd/Ctrl+B: Toggle sidebar
 * - Cmd/Ctrl+Shift+S: Open Sidekiq picker
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
 *     onOpenSidekiqPicker: () => setPickerOpen(true),
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
  onOpenSidekiqPicker,
}: ShortcutHandlers): void {
  const chordActiveRef = useRef(false);
  const chordTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const clearChord = () => {
      chordActiveRef.current = false;
      if (chordTimerRef.current) {
        clearTimeout(chordTimerRef.current);
        chordTimerRef.current = null;
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      // Handle second key of Cmd+K chord
      if (chordActiveRef.current) {
        e.preventDefault();
        clearChord();

        if (key === "c" && onNewChat) {
          onNewChat();
        } else if (onFocusSearch) {
          // Unrecognized chord follow-up: fall back to search focus
          onFocusSearch();
        }
        return;
      }

      // Check for modifier key (Cmd on Mac, Ctrl on Windows/Linux)
      const isMod = e.metaKey || e.ctrlKey;
      if (!isMod) return;

      if (key === "k") {
        e.preventDefault();
        // Enter chord mode — wait for second key
        chordActiveRef.current = true;
        chordTimerRef.current = setTimeout(() => {
          // Timeout: no second key pressed, fall back to search focus
          chordActiveRef.current = false;
          chordTimerRef.current = null;
          onFocusSearch?.();
        }, CHORD_TIMEOUT_MS);
      } else if (key === "b" && onToggleSidebar) {
        e.preventDefault();
        onToggleSidebar();
      } else if (key === "s" && e.shiftKey && onOpenSidekiqPicker) {
        // Cmd+Shift+S for Sidekiq picker
        e.preventDefault();
        onOpenSidekiqPicker();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearChord();
    };
  }, [onNewChat, onToggleSidebar, onFocusSearch, onOpenSidekiqPicker]);
}

"use client";

import { type RefObject } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@sidekiq/components/ui/input";

interface SidebarSearchProps {
  /** Current search query value */
  query: string;
  /** Callback when search query changes */
  onQueryChange: (query: string) => void;
  /** Optional ref for the input element (for keyboard shortcuts) */
  inputRef?: RefObject<HTMLInputElement | null>;
}

/**
 * Search input for filtering threads by title.
 * Always visible at top of sidebar below New Chat.
 *
 * Features:
 * - Search icon on left
 * - Clear button (X) on right when query is not empty
 * - Subtle styling with muted background
 * - Accepts inputRef for Cmd+K keyboard shortcut focus
 *
 * @example
 * ```tsx
 * const [query, setQuery] = useState("");
 * const inputRef = useRef<HTMLInputElement>(null);
 *
 * <SidebarSearch
 *   query={query}
 *   onQueryChange={setQuery}
 *   inputRef={inputRef}
 * />
 * ```
 */
export function SidebarSearch({
  query,
  onQueryChange,
  inputRef,
}: SidebarSearchProps) {
  return (
    <div className="relative px-3 py-2">
      <Search className="text-muted-foreground absolute top-1/2 left-5 h-4 w-4 -translate-y-1/2" />
      <Input
        ref={inputRef}
        type="text"
        placeholder="Search conversations..."
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        className="border-sidebar-border placeholder:text-muted-foreground focus-visible:ring-sidebar-ring h-9 border bg-transparent pr-8 pl-8 focus-visible:ring-1"
      />
      {query && (
        <button
          onClick={() => onQueryChange("")}
          className="text-muted-foreground hover:text-foreground absolute top-1/2 right-5 -translate-y-1/2"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

"use client";

import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { cn } from "@sidekiq/shared/lib/utils";

interface RenameThreadInputProps {
  /** Initial title value */
  initialTitle: string | null;
  /** Callback when rename is confirmed (Enter or blur with changes) */
  onRename: (title: string) => void;
  /** Callback when rename is cancelled (Escape or blur without changes) */
  onCancel: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Inline input for renaming thread title.
 *
 * Auto-focuses and selects all text on mount.
 * Supports keyboard shortcuts: Enter to confirm, Escape to cancel.
 * Also handles blur event for confirmation/cancellation.
 *
 * @example
 * ```tsx
 * <RenameThreadInput
 *   initialTitle="My conversation"
 *   onRename={(newTitle) => renameThread({ threadId, title: newTitle })}
 *   onCancel={() => setIsRenaming(false)}
 * />
 * ```
 */
export function RenameThreadInput({
  initialTitle,
  onRename,
  onCancel,
  className,
}: RenameThreadInputProps) {
  const [value, setValue] = useState(initialTitle ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const trimmed = value.trim();
      if (trimmed && trimmed !== initialTitle) {
        onRename(trimmed);
      } else {
        onCancel();
      }
    } else if (e.key === "Escape") {
      onCancel();
    }
  };

  const handleBlur = () => {
    const trimmed = value.trim();
    if (trimmed && trimmed !== initialTitle) {
      onRename(trimmed);
    } else {
      onCancel();
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      className={cn(
        "w-full rounded px-1 py-0.5 text-sm",
        "bg-background border-input border",
        "focus:ring-ring focus:ring-2 focus:outline-none",
        className,
      )}
      maxLength={255}
    />
  );
}

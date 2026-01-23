"use client";

import { Streamdown } from "streamdown";
import { createCodePlugin } from "@streamdown/code";
import { useMemo } from "react";

import { cn } from "@sidekiq/lib/utils";

interface MessageContentProps {
  /** The markdown content to render */
  content: string;
  /** Whether the content is currently streaming (enables animation) */
  isStreaming?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Renders markdown content with streaming support and syntax highlighting.
 * Uses Streamdown for graceful handling of incomplete markdown during streaming.
 * Code blocks use Shiki with dual themes for light/dark mode support.
 */
export function MessageContent({
  content,
  isStreaming = false,
  className,
}: MessageContentProps) {
  // Memoize code plugin to avoid recreating on every render
  const codePlugin = useMemo(
    () =>
      createCodePlugin({
        themes: ["github-light", "github-dark"],
      }),
    [],
  );

  return (
    <Streamdown
      plugins={{ code: codePlugin }}
      isAnimating={isStreaming}
      className={cn(
        // Base prose styling
        "prose prose-sm max-w-none",
        // Dark mode prose
        "dark:prose-invert",
        // Customize prose colors to match our theme
        "prose-headings:text-foreground",
        "prose-p:text-foreground/90",
        "prose-strong:text-foreground",
        "prose-code:text-foreground",
        "prose-pre:bg-muted/50 prose-pre:border prose-pre:border-border",
        // Links
        "prose-a:text-primary prose-a:no-underline hover:prose-a:underline",
        // Lists
        "prose-li:text-foreground/90",
        // Code blocks
        "[&_pre]:my-3 [&_pre]:rounded-lg",
        // Code inline
        "prose-code:before:content-none prose-code:after:content-none",
        "prose-code:bg-muted/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded",
        className,
      )}
    >
      {content}
    </Streamdown>
  );
}

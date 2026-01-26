"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Eye, EyeOff } from "lucide-react";

import { Button } from "@sidekiq/components/ui/button";
import { Textarea } from "@sidekiq/components/ui/textarea";
import { cn } from "@sidekiq/lib/utils";

// Dynamic import for markdown preview (avoid SSR issues)
const MDPreview = dynamic(
  () => import("@uiw/react-md-editor").then((mod) => mod.default.Markdown),
  {
    ssr: false,
    loading: () => (
      <div className="bg-muted h-[300px] animate-pulse rounded-md" />
    ),
  },
);

interface InstructionsEditorProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  placeholder?: string;
  error?: string;
}

/**
 * Markdown editor for Sidekiq instructions.
 * Provides toggle between edit and preview modes.
 * Uses @uiw/react-md-editor Markdown component for preview.
 *
 * @param value - Current markdown content
 * @param onChange - Callback when content changes
 * @param maxLength - Maximum character limit (default 8000)
 * @param placeholder - Placeholder text
 * @param error - Error message to display
 */
export function InstructionsEditor({
  value,
  onChange,
  maxLength = 8000,
  placeholder = "Enter instructions for your Sidekiq...\n\nYou can use **markdown** formatting:\n- Lists\n- **Bold** and *italic* text\n- `code` snippets\n- And more...",
  error,
}: InstructionsEditorProps) {
  const [showPreview, setShowPreview] = useState(false);

  const charCountClass = (() => {
    if (value.length >= maxLength) return "text-destructive";
    if (value.length >= maxLength * 0.9) return "text-amber-500";
    return "text-muted-foreground";
  })();

  return (
    <div className="space-y-2">
      {/* Header with toggle */}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowPreview(!showPreview)}
          className="h-8 text-xs"
        >
          {showPreview ? (
            <>
              <EyeOff className="mr-1.5 size-3.5" />
              Hide Preview
            </>
          ) : (
            <>
              <Eye className="mr-1.5 size-3.5" />
              Show Preview
            </>
          )}
        </Button>
        <span className={cn("text-xs tabular-nums", charCountClass)}>
          {value.length.toLocaleString()}/{maxLength.toLocaleString()}
        </span>
      </div>

      {/* Editor or Preview */}
      <div
        className="border-border bg-card rounded-lg border"
        data-color-mode="dark"
      >
        {showPreview ? (
          <div className="prose prose-sm prose-invert min-h-[300px] max-w-none p-4">
            <MDPreview source={value || "*No instructions yet*"} />
          </div>
        ) : (
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            maxLength={maxLength}
            className="min-h-[300px] resize-y rounded-md border-0 font-mono text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        )}
      </div>

      {/* Error message */}
      {error && <p className="text-destructive text-sm">{error}</p>}

      {/* Helper text */}
      <p className="text-muted-foreground text-xs">
        Use markdown for formatting. These instructions define your
        Sidekiq&apos;s personality and behavior.
      </p>
    </div>
  );
}

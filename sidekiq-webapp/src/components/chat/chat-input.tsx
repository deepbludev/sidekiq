"use client";

import type { FormEvent, KeyboardEvent, ReactNode } from "react";
import { useRef, useEffect } from "react";
import { Send, Square } from "lucide-react";

import { Button } from "@sidekiq/components/ui/button";
import { Textarea } from "@sidekiq/components/ui/textarea";
import { SidekiqAvatar } from "@sidekiq/components/sidekiq/sidekiq-avatar";
import { cn } from "@sidekiq/lib/utils";
import type { SidekiqAvatar as SidekiqAvatarType } from "@sidekiq/lib/validations/sidekiq";

interface ChatInputProps {
  /** Current input value */
  input: string;
  /** Function to update input value */
  setInput: (value: string) => void;
  /** Function to handle form submission */
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  /** Whether the AI is currently streaming a response */
  isStreaming: boolean;
  /** Function to stop the current stream */
  onStop: () => void;
  /** Placeholder text */
  placeholder?: string;
  /** Model picker component to render */
  modelPicker?: ReactNode;
  /** Active Sidekiq (shows badge above input) */
  sidekiq?: {
    name: string;
    avatar: SidekiqAvatarType;
  } | null;
}

/**
 * Editor-like chat input component with Linear-inspired styling.
 *
 * Features:
 * - Auto-resizing textarea within a bordered card container
 * - Toolbar area with model picker and Sidekiq badge
 * - Enter to send, Shift+Enter for newline
 * - Send button disabled when empty or streaming
 * - Stop button appears during streaming
 */
export function ChatInput({
  input,
  setInput,
  onSubmit,
  isStreaming,
  onStop,
  placeholder = "Type a message...",
  modelPicker,
  sidekiq,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Restore focus to textarea after input is cleared (message sent)
  useEffect(() => {
    if (input === "" && !isStreaming && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [input, isStreaming]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter to send, Shift+Enter for newline
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isStreaming) {
        const form = e.currentTarget.form;
        if (form) {
          form.requestSubmit();
        }
      }
    }
  };

  const canSend = input.trim().length > 0 && !isStreaming;

  return (
    <form onSubmit={onSubmit}>
      <div className="border-border bg-card rounded-md border">
        {/* Toolbar area: Sidekiq badge + model picker */}
        {(sidekiq ?? modelPicker) && (
          <div className="border-border flex items-center justify-between border-b px-3 py-1.5">
            {sidekiq ? (
              <div className="flex items-center gap-1.5">
                <SidekiqAvatar
                  name={sidekiq.name}
                  avatar={sidekiq.avatar}
                  size="sm"
                  className="size-5"
                />
                <span className="text-muted-foreground text-xs">
                  Chatting with{" "}
                  <span className="text-foreground font-medium">
                    {sidekiq.name}
                  </span>
                </span>
              </div>
            ) : (
              <div />
            )}
            {modelPicker}
          </div>
        )}

        {/* Textarea */}
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isStreaming}
          className={cn(
            "max-h-[200px] min-h-[52px] resize-none",
            "border-0 bg-transparent shadow-none focus-visible:ring-0",
            "placeholder:text-muted-foreground/60",
          )}
          rows={1}
        />

        {/* Action buttons */}
        <div className="flex items-center justify-end px-3 py-1.5">
          {isStreaming ? (
            <Button
              type="button"
              variant="destructive"
              size="icon-sm"
              onClick={onStop}
              aria-label="Stop generating"
            >
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="submit"
              size="icon-sm"
              disabled={!canSend}
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}

"use client";

import type { FormEvent, KeyboardEvent, ReactNode } from "react";
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
 * Chat input component with glassmorphism styling.
 *
 * Features:
 * - Auto-resizing textarea
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
    <form onSubmit={onSubmit} className="relative">
      {sidekiq && (
        <div className="mb-2 flex items-center gap-1.5">
          <SidekiqAvatar
            name={sidekiq.name}
            avatar={sidekiq.avatar}
            size="sm"
            className="size-5"
          />
          <span className="text-muted-foreground text-xs">
            Chatting with{" "}
            <span className="text-foreground font-medium">{sidekiq.name}</span>
          </span>
        </div>
      )}
      <Textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isStreaming}
        className={cn(
          "max-h-[200px] min-h-[52px] resize-none pr-24",
          // Glassmorphism input styling
          "glass-input",
          "focus-visible:ring-primary/20",
          "placeholder:text-muted-foreground/60",
        )}
        rows={1}
      />

      <div className="absolute right-2 bottom-2 flex items-center gap-2">
        {modelPicker}
        {isStreaming ? (
          <Button
            type="button"
            variant="destructive"
            size="icon-sm"
            onClick={onStop}
            aria-label="Stop generating"
            className="shadow-sm"
          >
            <Square className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="submit"
            size="icon-sm"
            disabled={!canSend}
            aria-label="Send message"
            className="shadow-sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        )}
      </div>
    </form>
  );
}

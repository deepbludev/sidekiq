"use client";

import type { FormEvent, KeyboardEvent } from "react";
import { Send, Square } from "lucide-react";

import { Button } from "@sidekiq/components/ui/button";
import { Textarea } from "@sidekiq/components/ui/textarea";
import { cn } from "@sidekiq/lib/utils";

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
}

/**
 * Chat input component with textarea and send/stop buttons.
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
      <Textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        disabled={isStreaming}
        className={cn(
          "max-h-[200px] min-h-[52px] resize-none pr-24",
          "border-zinc-700 bg-zinc-900 focus-visible:border-zinc-600",
          "placeholder:text-zinc-500",
        )}
        rows={1}
      />

      <div className="absolute right-2 bottom-2 flex gap-1">
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
    </form>
  );
}

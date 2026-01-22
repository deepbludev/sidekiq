"use client";

import type { UIMessage } from "ai";

import { Avatar, AvatarFallback, AvatarImage } from "@sidekiq/components/ui/avatar";
import { cn } from "@sidekiq/lib/utils";

interface MessageItemProps {
  /** The message to render */
  message: UIMessage;
}

/**
 * Extracts text content from a UIMessage's parts.
 *
 * @param message - The UIMessage to extract text from
 * @returns Concatenated text content from all text parts
 */
function extractTextContent(message: UIMessage): string {
  return message.parts
    .filter((part): part is { type: "text"; text: string } => part.type === "text")
    .map((part) => part.text)
    .join("");
}

/**
 * Renders a single chat message with avatar and styling based on role.
 *
 * User messages are right-aligned with a user avatar.
 * Assistant messages are left-aligned with an AI avatar.
 */
export function MessageItem({ message }: MessageItemProps) {
  const isUser = message.role === "user";
  const content = extractTextContent(message);

  return (
    <div
      className={cn(
        "flex gap-3",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <Avatar className="h-8 w-8 shrink-0">
        {isUser ? (
          <>
            <AvatarImage src="/user-avatar.png" alt="You" />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              U
            </AvatarFallback>
          </>
        ) : (
          <>
            <AvatarImage src="/ai-avatar.png" alt="AI" />
            <AvatarFallback className="bg-violet-600 text-white text-xs">
              AI
            </AvatarFallback>
          </>
        )}
      </Avatar>

      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2.5",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-zinc-800/50 text-zinc-100 border border-zinc-700/50"
        )}
      >
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{content}</p>
      </div>
    </div>
  );
}

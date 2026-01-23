"use client";

import type { UIMessage } from "ai";
import { useState } from "react";

import { cn } from "@sidekiq/lib/utils";
import { MessageActions } from "./message-actions";
import { MessageContent } from "./message-content";

interface MessageItemProps {
  /** The message to render */
  message: UIMessage;
  /** Whether this message is currently streaming */
  isStreaming?: boolean;
  /** Callback when user clicks edit */
  onEdit?: () => void;
  /** Callback when user clicks regenerate */
  onRegenerate?: () => void;
}

/**
 * Extracts text content from a UIMessage's parts.
 *
 * @param message - The UIMessage to extract text from
 * @returns Concatenated text content from all text parts
 */
export function extractTextContent(message: UIMessage): string {
  return message.parts
    .filter(
      (part): part is { type: "text"; text: string } => part.type === "text",
    )
    .map((part) => part.text)
    .join("");
}

/**
 * Formats a timestamp for display.
 *
 * @param date - The date to format
 * @returns Formatted time string (e.g., "2:30 PM")
 */
export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

/**
 * Extracts the createdAt timestamp from a message.
 * Checks both the direct createdAt property (from useChat) and metadata.createdAt.
 *
 * @param message - The UIMessage to extract timestamp from
 * @returns The createdAt date or null if not available
 */
export function getCreatedAt(message: UIMessage): Date | null {
  // Cast to access potential createdAt property (useChat adds this at runtime)
  const messageWithTimestamp = message as UIMessage & {
    createdAt?: Date | string | number;
  };

  // First check direct createdAt property (provided by useChat)
  if (messageWithTimestamp.createdAt) {
    if (messageWithTimestamp.createdAt instanceof Date) {
      return messageWithTimestamp.createdAt;
    }
    if (
      typeof messageWithTimestamp.createdAt === "string" ||
      typeof messageWithTimestamp.createdAt === "number"
    ) {
      return new Date(messageWithTimestamp.createdAt);
    }
  }

  // Fallback to metadata.createdAt
  const metadata = message.metadata;
  if (
    metadata &&
    typeof metadata === "object" &&
    "createdAt" in metadata &&
    metadata.createdAt
  ) {
    const createdAt = metadata.createdAt;
    if (createdAt instanceof Date) {
      return createdAt;
    }
    if (typeof createdAt === "string" || typeof createdAt === "number") {
      return new Date(createdAt);
    }
  }
  return null;
}

/**
 * Renders a single chat message with minimal lines style.
 *
 * Per CONTEXT.md:
 * - No bubbles/cards, just text with subtle background tint
 * - Timestamps shown on hover only
 * - Narrow centered content area (~700px max)
 * - Actions appear inline at end of message on hover
 */
export function MessageItem({
  message,
  isStreaming = false,
  onEdit,
  onRegenerate,
}: MessageItemProps) {
  const [showTimestamp, setShowTimestamp] = useState(false);
  const isUser = message.role === "user";
  const content = extractTextContent(message);

  return (
    <div
      className={cn(
        "group relative -mx-4 px-4 py-4",
        // Subtle background tint to distinguish user vs AI
        isUser ? "bg-transparent" : "bg-muted/30 dark:bg-muted/10",
      )}
      onMouseEnter={() => setShowTimestamp(true)}
      onMouseLeave={() => setShowTimestamp(false)}
    >
      <div className="mx-auto max-w-[700px]">
        <div className="flex items-start justify-between gap-4">
          {/* Message content */}
          <div className="min-w-0 flex-1">
            {isUser ? (
              // User messages: plain text
              <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">
                {content}
              </p>
            ) : (
              // Assistant messages: rendered markdown
              <MessageContent content={content} isStreaming={isStreaming} />
            )}
          </div>

          {/* Actions (visible on hover) */}
          <MessageActions
            role={message.role as "user" | "assistant"}
            content={content}
            onEdit={isUser ? onEdit : undefined}
            onRegenerate={!isUser ? onRegenerate : undefined}
          />
        </div>

        {/* Timestamp (visible on hover) */}
        {(() => {
          const createdAt = getCreatedAt(message);
          if (showTimestamp && createdAt) {
            return (
              <time className="text-muted-foreground mt-1.5 block text-xs">
                {formatTime(createdAt)}
              </time>
            );
          }
          return null;
        })()}
      </div>
    </div>
  );
}

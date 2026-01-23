"use client";

import type { UIMessage } from "ai";

import { MessageItem } from "./message-item";
import { EmptyState } from "./empty-state";

interface MessageListProps {
  /** Array of messages to render */
  messages: UIMessage[];
  /** ID of the message currently streaming (if any) */
  streamingMessageId?: string;
  /** Callback when user selects a prompt from empty state */
  onPromptSelect?: (prompt: string) => void;
  /** Callback when user clicks edit on a message */
  onEditMessage?: (messageId: string) => void;
  /** Callback when user clicks regenerate on a message */
  onRegenerateMessage?: (messageId: string) => void;
}

/**
 * Renders a list of chat messages with empty state.
 */
export function MessageList({
  messages,
  streamingMessageId,
  onPromptSelect,
  onEditMessage,
  onRegenerateMessage,
}: MessageListProps) {
  if (messages.length === 0) {
    return onPromptSelect ? (
      <EmptyState onPromptSelect={onPromptSelect} />
    ) : (
      // Fallback if no onPromptSelect provided
      <div className="flex h-full items-center justify-center py-12">
        <div className="text-center">
          <h3 className="text-foreground text-lg font-medium">
            Start a conversation
          </h3>
          <p className="text-muted-foreground mt-1 text-sm">
            Type a message below to begin chatting.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="divide-border/50 divide-y">
      {messages.map((message) => (
        <MessageItem
          key={message.id}
          message={message}
          isStreaming={message.id === streamingMessageId}
          onEdit={onEditMessage ? () => onEditMessage(message.id) : undefined}
          onRegenerate={
            onRegenerateMessage
              ? () => onRegenerateMessage(message.id)
              : undefined
          }
        />
      ))}
    </div>
  );
}

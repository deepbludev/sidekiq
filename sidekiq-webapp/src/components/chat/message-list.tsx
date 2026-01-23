"use client";

import type { UIMessage } from "ai";
import type { ReactNode } from "react";

import { MessageItem } from "./message-item";
import { EmptyState } from "./empty-state";

export interface ModelSwitch {
  afterMessageIndex: number;
  previousModel: string;
  currentModel: string;
}

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
  /** Model switches to render as inline hints */
  modelSwitches?: ModelSwitch[];
  /** Render function for model switch hints */
  renderModelSwitchHint?: (
    previousModel: string,
    currentModel: string,
  ) => ReactNode;
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
  modelSwitches = [],
  renderModelSwitchHint,
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

  // Build a map of hints by their position (after message index)
  const hintsByPosition = new Map<number, ModelSwitch>();
  for (const switchData of modelSwitches) {
    hintsByPosition.set(switchData.afterMessageIndex, switchData);
  }

  return (
    <div className="divide-border/50 divide-y">
      {messages.map((message, index) => {
        const hint = hintsByPosition.get(index);
        return (
          <div key={message.id}>
            <MessageItem
              message={message}
              isStreaming={message.id === streamingMessageId}
              onEdit={
                onEditMessage ? () => onEditMessage(message.id) : undefined
              }
              onRegenerate={
                onRegenerateMessage
                  ? () => onRegenerateMessage(message.id)
                  : undefined
              }
            />
            {hint &&
              renderModelSwitchHint?.(hint.previousModel, hint.currentModel)}
          </div>
        );
      })}
    </div>
  );
}

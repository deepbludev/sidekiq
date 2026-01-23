"use client";

import type { UIMessage } from "ai";

import { MessageItem } from "./message-item";

interface MessageListProps {
  /** Array of messages to render */
  messages: UIMessage[];
}

/**
 * Renders a list of chat messages with empty state.
 */
export function MessageList({ messages }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center py-12">
        <div className="text-center">
          <h3 className="text-lg font-medium text-zinc-200">
            Start a conversation
          </h3>
          <p className="mt-1 text-sm text-zinc-500">
            Type a message below to begin chatting with the AI.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <MessageItem key={message.id} message={message} />
      ))}
    </div>
  );
}

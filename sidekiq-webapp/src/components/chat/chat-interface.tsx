"use client";

import { useRef, useState, type FormEvent } from "react";
import type { UIMessage } from "ai";
import { DefaultChatTransport } from "ai";
import { useChat } from "@ai-sdk/react";

import { MessageList } from "./message-list";
import { ChatInput } from "./chat-input";
import { TypingIndicator } from "./typing-indicator";
import { ChatScrollAnchor } from "./chat-scroll-anchor";

interface ChatInterfaceProps {
  /** Thread ID for message persistence */
  threadId: string;
  /** Initial messages to load from database (Phase 3) */
  initialMessages?: UIMessage[];
}

/**
 * Main chat interface component
 *
 * Integrates useChat hook with message list, input, typing indicator,
 * and auto-scroll functionality.
 *
 * Uses AI SDK v6 with DefaultChatTransport for HTTP communication.
 */
export function ChatInterface({
  threadId,
  initialMessages = [],
}: ChatInterfaceProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");

  // Create transport with threadId in body
  const transport = new DefaultChatTransport({
    api: "/api/chat",
    body: { threadId },
  });

  const { messages, sendMessage, status, stop, error } = useChat({
    transport,
    messages: initialMessages,
    onError: (err) => {
      // Toast notification will be enhanced in Phase 10
      console.error("Chat error:", err);
    },
  });

  const isStreaming = status === "streaming" || status === "submitted";

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput || isStreaming) return;

    setInput("");
    await sendMessage({ text: trimmedInput });
  };

  return (
    <div className="flex h-full flex-col">
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4">
        <div className="mx-auto max-w-3xl py-4">
          <MessageList messages={messages} />
          {isStreaming && messages[messages.length - 1]?.role === "user" && (
            <TypingIndicator />
          )}
          <ChatScrollAnchor
            isStreaming={isStreaming}
            messagesLength={messages.length}
            scrollContainer={scrollContainerRef}
          />
        </div>
      </div>

      <div className="border-t border-zinc-800 bg-zinc-950 px-4 py-4">
        <div className="mx-auto max-w-3xl">
          {error && (
            <div className="bg-destructive/10 text-destructive mb-2 rounded-md px-3 py-2 text-sm">
              {error.message || "An error occurred"}
            </div>
          )}
          <ChatInput
            input={input}
            setInput={setInput}
            onSubmit={handleSubmit}
            isStreaming={isStreaming}
            onStop={stop}
          />
        </div>
      </div>
    </div>
  );
}

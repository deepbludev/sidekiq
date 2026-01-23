"use client";

import { useRef, useState, type FormEvent } from "react";
import type { UIMessage } from "ai";
import { DefaultChatTransport } from "ai";
import { useChat } from "@ai-sdk/react";
import { toast } from "sonner";

import { MessageList } from "./message-list";
import { ChatInput } from "./chat-input";
import { TypingIndicator } from "./typing-indicator";
import { ChatScrollAnchor } from "./chat-scroll-anchor";
import { ScrollToBottom } from "./scroll-to-bottom";
import { cn } from "@sidekiq/lib/utils";

interface ChatInterfaceProps {
  /**
   * Thread ID for message persistence.
   * null = "new chat" state (thread created on first message send)
   */
  threadId: string | null;
  /** Initial messages to load from database */
  initialMessages?: UIMessage[];
}

/**
 * Main chat interface component with glassmorphism styling.
 *
 * Integrates useChat hook with message list, input, typing indicator,
 * and auto-scroll functionality. Includes error handling with toast notifications.
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
      // Error toast at bottom-center (near input)
      toast.error("Failed to send message", {
        description:
          err.message || "Please check your connection and try again",
        duration: 5000,
      });
    },
  });

  const isStreaming = status === "streaming" || status === "submitted";

  // Get the ID of the currently streaming message
  const streamingMessageId = isStreaming
    ? messages[messages.length - 1]?.id
    : undefined;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput || isStreaming) return;

    setInput("");
    await sendMessage({ text: trimmedInput });
  };

  const handlePromptSelect = (prompt: string) => {
    setInput(prompt);
    // Focus the textarea using a more robust approach
    // setTimeout ensures state update completes before focus
    setTimeout(() => {
      const textarea = scrollContainerRef.current
        ?.closest(".flex.h-full")
        ?.querySelector("textarea");
      textarea?.focus();
    }, 0);
  };

  // Placeholder callbacks for edit/regenerate (full implementation in later phase)
  const handleEditMessage = (messageId: string) => {
    // TODO: Implement edit functionality
    toast.info("Edit coming soon", {
      description: "Message editing will be available in a future update",
    });
    console.log("Edit message:", messageId);
  };

  const handleRegenerateMessage = (messageId: string) => {
    // TODO: Implement regenerate functionality
    toast.info("Regenerate coming soon", {
      description: "Response regeneration will be available in a future update",
    });
    console.log("Regenerate message:", messageId);
  };

  return (
    <div className="relative flex h-full flex-col">
      {/* Message area */}
      <div
        ref={scrollContainerRef}
        className={cn(
          "flex-1 overflow-y-auto",
          // Subtle gradient background
          "from-background to-muted/20 bg-gradient-to-b",
        )}
      >
        <div className="mx-auto max-w-3xl px-4 py-4">
          <MessageList
            messages={messages}
            streamingMessageId={
              isStreaming && messages[messages.length - 1]?.role === "assistant"
                ? streamingMessageId
                : undefined
            }
            onPromptSelect={handlePromptSelect}
            onEditMessage={handleEditMessage}
            onRegenerateMessage={handleRegenerateMessage}
          />

          {/* Typing indicator */}
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

      {/* Scroll to bottom button */}
      <ScrollToBottom scrollContainer={scrollContainerRef} />

      {/* Input area with glass effect */}
      <div className={cn("border-t px-4 py-4", "glass", "border-border/50")}>
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

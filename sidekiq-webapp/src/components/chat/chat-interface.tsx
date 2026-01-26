"use client";

import {
  useRef,
  useState,
  useCallback,
  useEffect,
  useMemo,
  type FormEvent,
} from "react";
import type { UIMessage } from "ai";
import { DefaultChatTransport } from "ai";
import { useChat } from "@ai-sdk/react";
import { toast } from "sonner";

import { MessageList } from "./message-list";
import { ChatInput } from "./chat-input";
import { ChatHeader } from "./chat-header";
import { TypingIndicator } from "./typing-indicator";
import { ChatScrollAnchor } from "./chat-scroll-anchor";
import { ScrollToBottom } from "./scroll-to-bottom";
import { ModelSwitchHint } from "./model-switch-hint";
import { ModelPicker } from "@sidekiq/components/model-picker";
import { useModelSelection } from "@sidekiq/hooks/use-model-selection";
import { api } from "@sidekiq/trpc/react";
import type { SidekiqAvatar } from "@sidekiq/lib/validations/sidekiq";

interface ChatInterfaceProps {
  /**
   * Thread ID for message persistence.
   * null = "new chat" state (thread created on first message send)
   */
  threadId: string | null;
  /** Initial messages to load from database */
  initialMessages?: UIMessage[];
  /** Initial thread title from SSR (null if not yet generated) */
  initialTitle?: string | null;
  /** Initial model from thread (for existing threads) */
  initialModel?: string | null;
  /** Optional Sidekiq context for new chats started with a Sidekiq */
  sidekiq?: {
    id: string;
    name: string;
    description: string | null;
    avatar: SidekiqAvatar;
    conversationStarters: string[];
    defaultModel: string | null;
  } | null;
}

/**
 * Main chat interface component with Linear-inspired aesthetic.
 *
 * Integrates useChat hook with message list, input, typing indicator,
 * and auto-scroll functionality. Includes error handling with toast notifications.
 *
 * Uses AI SDK v6 with DefaultChatTransport for HTTP communication.
 * Handles new thread creation by capturing X-Thread-Id header and redirecting.
 */
export function ChatInterface({
  threadId,
  initialMessages = [],
  initialTitle,
  initialModel,
  sidekiq,
}: ChatInterfaceProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  const [currentTitle, setCurrentTitle] = useState<string | null>(
    initialTitle ?? null,
  );

  // Track the actual thread ID (may change after redirect for new threads)
  const [activeThreadId, setActiveThreadId] = useState<string | null>(threadId);

  // Track if we've already redirected to prevent duplicate navigation
  const hasRedirectedRef = useRef(false);

  // Track model switches for inline hints
  const [modelSwitches, setModelSwitches] = useState<
    Array<{
      afterMessageIndex: number;
      previousModel: string;
      currentModel: string;
    }>
  >([]);

  // Track the model used for the most recent message
  const lastMessageModelRef = useRef<string | null>(null);

  // Poll for title when we have a thread but no title yet
  const { data: titleData } = api.thread.getTitle.useQuery(
    { threadId: activeThreadId! },
    {
      enabled: !!activeThreadId && !currentTitle,
      refetchInterval: (query) => {
        // Poll every 2 seconds until we get a title, max 5 attempts (10 seconds)
        if (query.state.data?.title) return false;
        if (query.state.dataUpdateCount >= 5) return false;
        return 2000;
      },
    },
  );

  // Update current title when polling returns a title
  useEffect(() => {
    if (titleData?.title && !currentTitle) {
      setCurrentTitle(titleData.title);
    }
  }, [titleData?.title, currentTitle]);

  // Update document.title when currentTitle changes
  useEffect(() => {
    const displayTitle = currentTitle ?? "New Chat";
    document.title = `${displayTitle} - Sidekiq`;
  }, [currentTitle]);

  // Model selection with user preferences
  const {
    selectedModel,
    setSelectedModel,
    favoriteModelIds,
    defaultModelId,
    toggleFavorite,
  } = useModelSelection({
    threadModel: initialModel,
    sidekiqDefaultModel: sidekiq?.defaultModel,
    onModelChange: (previousModel, newModel) => {
      // Only add hint if there are existing messages and user has sent at least one
      if (messages.length > 0 && lastMessageModelRef.current) {
        setModelSwitches((prev) => [
          ...prev,
          {
            afterMessageIndex: messages.length - 1,
            previousModel,
            currentModel: newModel,
          },
        ]);
      }
    },
  });

  /**
   * Custom fetch function that captures the X-Thread-Id header
   * and redirects to the new thread URL when a thread is created.
   */
  const customFetch = useCallback(
    async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const response = await fetch(input, init);

      // Check for new thread ID header when in "new chat" state
      if (!threadId && !hasRedirectedRef.current) {
        const newThreadId = response.headers.get("X-Thread-Id");
        if (newThreadId) {
          hasRedirectedRef.current = true;
          // Track the new thread ID for title polling
          setActiveThreadId(newThreadId);
          // Use history API to update URL without navigation/remount
          // This preserves the streaming connection (router.replace would unmount and abort)
          window.history.replaceState(null, "", `/chat/${newThreadId}`);
        }
      }

      return response;
    },
    [threadId],
  );

  // Create transport with custom fetch to capture thread ID
  // Use activeThreadId (stateful) instead of threadId (prop) so subsequent messages
  // include the threadId after thread creation. For new Sidekiq chats, sidekiqId is
  // included only on first message; subsequent messages use the created threadId.
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: activeThreadId
          ? { threadId: activeThreadId }
          : sidekiq
            ? { sidekiqId: sidekiq.id }
            : {},
        fetch: customFetch,
      }),
    [activeThreadId, sidekiq, customFetch],
  );

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
    lastMessageModelRef.current = selectedModel;

    // Pass model in the options.body - this merges with transport.body
    await sendMessage(
      { text: trimmedInput },
      { body: { model: selectedModel } },
    );
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
      {/* Header with Sidekiq indicator */}
      <ChatHeader title={currentTitle} sidekiq={sidekiq} />

      {/* Message area */}
      <div
        ref={scrollContainerRef}
        className="bg-background flex-1 overflow-y-auto"
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
            modelSwitches={modelSwitches}
            renderModelSwitchHint={(previousModel, currentModel) => (
              <ModelSwitchHint
                previousModel={previousModel}
                currentModel={currentModel}
              />
            )}
            conversationStarters={sidekiq?.conversationStarters}
            sidekiqName={sidekiq?.name}
            sidekiqAvatar={
              sidekiq
                ? { name: sidekiq.name, avatar: sidekiq.avatar }
                : undefined
            }
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

      {/* Input area */}
      <div className="border-border bg-background border-t px-4 py-4">
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
            sidekiq={sidekiq}
            modelPicker={
              <ModelPicker
                value={selectedModel}
                onValueChange={setSelectedModel}
                favoriteModelIds={favoriteModelIds}
                defaultModelId={defaultModelId}
                onToggleFavorite={toggleFavorite}
                disabled={isStreaming}
              />
            }
          />
        </div>
      </div>
    </div>
  );
}

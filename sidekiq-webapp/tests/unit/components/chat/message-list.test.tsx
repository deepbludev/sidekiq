import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { UIMessage } from "ai";

// Mock child components to isolate MessageList testing
vi.mock("@sidekiq/components/chat/message-item", () => ({
  MessageItem: ({
    message,
    isStreaming,
  }: {
    message: UIMessage;
    isStreaming: boolean;
  }) => (
    <div data-testid={`message-${message.id}`} data-streaming={isStreaming}>
      {message.role}: {(message.parts[0] as { text: string })?.text || ""}
    </div>
  ),
}));

vi.mock("@sidekiq/components/chat/empty-state", () => ({
  EmptyState: ({
    onPromptSelect,
  }: {
    onPromptSelect: (prompt: string) => void;
  }) => (
    <div data-testid="empty-state">
      <button onClick={() => onPromptSelect("Test prompt")}>
        Select prompt
      </button>
    </div>
  ),
}));

import { MessageList } from "@sidekiq/components/chat/message-list";
import userEvent from "@testing-library/user-event";

/**
 * Helper to create a mock UIMessage
 */
function createMessage(
  id: string,
  role: "user" | "assistant",
  text: string,
): UIMessage {
  return {
    id,
    role,
    parts: [{ type: "text", text }],
  } as UIMessage;
}

describe("MessageList", () => {
  describe("empty state", () => {
    it("should render EmptyState when messages are empty and onPromptSelect is provided", () => {
      const onPromptSelect = vi.fn();
      render(<MessageList messages={[]} onPromptSelect={onPromptSelect} />);

      expect(screen.getByTestId("empty-state")).toBeInTheDocument();
    });

    it("should render fallback text when messages are empty and no onPromptSelect", () => {
      render(<MessageList messages={[]} />);

      expect(screen.getByText("Start a conversation")).toBeInTheDocument();
      expect(
        screen.getByText(/type a message below to begin/i),
      ).toBeInTheDocument();
    });

    it("should call onPromptSelect when a prompt is selected from EmptyState", async () => {
      const user = userEvent.setup();
      const onPromptSelect = vi.fn();
      render(<MessageList messages={[]} onPromptSelect={onPromptSelect} />);

      const promptButton = screen.getByRole("button", {
        name: /select prompt/i,
      });
      await user.click(promptButton);

      expect(onPromptSelect).toHaveBeenCalledWith("Test prompt");
    });
  });

  describe("with messages", () => {
    it("should render MessageItem for each message", () => {
      const messages = [
        createMessage("1", "user", "Hello"),
        createMessage("2", "assistant", "Hi there!"),
      ];

      render(<MessageList messages={messages} />);

      expect(screen.getByTestId("message-1")).toBeInTheDocument();
      expect(screen.getByTestId("message-2")).toBeInTheDocument();
    });

    it("should render correct number of messages", () => {
      const messages = [
        createMessage("1", "user", "First"),
        createMessage("2", "assistant", "Second"),
        createMessage("3", "user", "Third"),
      ];

      render(<MessageList messages={messages} />);

      const messageElements = screen.getAllByTestId(/^message-/);
      expect(messageElements).toHaveLength(3);
    });

    it("should pass isStreaming correctly to the streaming message", () => {
      const messages = [
        createMessage("1", "user", "Hello"),
        createMessage("2", "assistant", "Responding..."),
      ];

      render(<MessageList messages={messages} streamingMessageId="2" />);

      const streamingMessage = screen.getByTestId("message-2");
      expect(streamingMessage).toHaveAttribute("data-streaming", "true");

      const userMessage = screen.getByTestId("message-1");
      expect(userMessage).toHaveAttribute("data-streaming", "false");
    });

    it("should not set any message as streaming when streamingMessageId is undefined", () => {
      const messages = [
        createMessage("1", "user", "Hello"),
        createMessage("2", "assistant", "Response"),
      ];

      render(<MessageList messages={messages} />);

      const messages1 = screen.getByTestId("message-1");
      const messages2 = screen.getByTestId("message-2");

      expect(messages1).toHaveAttribute("data-streaming", "false");
      expect(messages2).toHaveAttribute("data-streaming", "false");
    });
  });

  describe("message display order", () => {
    it("should render messages in the order they appear in the array", () => {
      const messages = [
        createMessage("1", "user", "First message"),
        createMessage("2", "assistant", "Second message"),
        createMessage("3", "user", "Third message"),
      ];

      render(<MessageList messages={messages} />);

      const messageElements = screen.getAllByTestId(/^message-/);
      expect(messageElements[0]).toHaveTextContent("First message");
      expect(messageElements[1]).toHaveTextContent("Second message");
      expect(messageElements[2]).toHaveTextContent("Third message");
    });
  });
});

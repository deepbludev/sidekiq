import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock streamdown to avoid complex rendering setup
vi.mock("streamdown", () => ({
  Streamdown: ({
    children,
    isAnimating,
    className,
  }: {
    children: string;
    isAnimating: boolean;
    className: string;
  }) => (
    <div
      data-testid="streamdown"
      data-animating={isAnimating}
      className={className}
    >
      {children}
    </div>
  ),
}));

vi.mock("@streamdown/code", () => ({
  createCodePlugin: vi.fn(() => ({})),
}));

import { MessageContent } from "@sidekiq/components/chat/message-content";

describe("MessageContent", () => {
  it("should render content through Streamdown", () => {
    render(<MessageContent content="Hello world" />);

    const streamdown = screen.getByTestId("streamdown");
    expect(streamdown).toHaveTextContent("Hello world");
  });

  it("should set isAnimating to true when isStreaming is true", () => {
    render(<MessageContent content="Streaming content" isStreaming={true} />);

    const streamdown = screen.getByTestId("streamdown");
    expect(streamdown).toHaveAttribute("data-animating", "true");
  });

  it("should set isAnimating to false when isStreaming is false", () => {
    render(<MessageContent content="Static content" isStreaming={false} />);

    const streamdown = screen.getByTestId("streamdown");
    expect(streamdown).toHaveAttribute("data-animating", "false");
  });

  it("should set isAnimating to false by default", () => {
    render(<MessageContent content="Default content" />);

    const streamdown = screen.getByTestId("streamdown");
    expect(streamdown).toHaveAttribute("data-animating", "false");
  });

  it("should apply prose styling classes", () => {
    render(<MessageContent content="Styled content" />);

    const streamdown = screen.getByTestId("streamdown");
    expect(streamdown.className).toContain("prose");
  });

  it("should apply custom className when provided", () => {
    render(<MessageContent content="Content" className="custom-class" />);

    const streamdown = screen.getByTestId("streamdown");
    expect(streamdown.className).toContain("custom-class");
  });

  it("should pass markdown content to Streamdown", () => {
    const markdownContent = "# Heading\n\nParagraph with **bold** text";
    render(<MessageContent content={markdownContent} />);

    const streamdown = screen.getByTestId("streamdown");
    // Check that the content includes key parts (Streamdown receives raw content)
    expect(streamdown.textContent).toContain("Heading");
    expect(streamdown.textContent).toContain("bold");
  });
});

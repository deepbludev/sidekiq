import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { EmptyState } from "@sidekiq/components/chat/empty-state";

describe("EmptyState", () => {
  it("should render the welcome heading", () => {
    const onPromptSelect = vi.fn();
    render(<EmptyState onPromptSelect={onPromptSelect} />);

    expect(
      screen.getByRole("heading", { name: /start your first conversation/i }),
    ).toBeInTheDocument();
  });

  it("should render the helper text", () => {
    const onPromptSelect = vi.fn();
    render(<EmptyState onPromptSelect={onPromptSelect} />);

    expect(
      screen.getByText(/choose a prompt below or type your own message/i),
    ).toBeInTheDocument();
  });

  it("should render all 4 categories", () => {
    const onPromptSelect = vi.fn();
    render(<EmptyState onPromptSelect={onPromptSelect} />);

    expect(screen.getByText("Creative")).toBeInTheDocument();
    expect(screen.getByText("Coding")).toBeInTheDocument();
    expect(screen.getByText("Research")).toBeInTheDocument();
    expect(screen.getByText("Writing")).toBeInTheDocument();
  });

  it("should render 3 prompts per category (12 total)", () => {
    const onPromptSelect = vi.fn();
    render(<EmptyState onPromptSelect={onPromptSelect} />);

    // Get all prompt buttons - each category has 3 prompts
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(12);
  });

  it("should render specific prompts from each category", () => {
    const onPromptSelect = vi.fn();
    render(<EmptyState onPromptSelect={onPromptSelect} />);

    // Creative prompts
    expect(
      screen.getByRole("button", {
        name: /write a short story about a time traveler/i,
      }),
    ).toBeInTheDocument();

    // Coding prompts
    expect(
      screen.getByRole("button", {
        name: /explain async\/await in javascript/i,
      }),
    ).toBeInTheDocument();

    // Research prompts
    expect(
      screen.getByRole("button", { name: /compare rest vs graphql apis/i }),
    ).toBeInTheDocument();

    // Writing prompts
    expect(
      screen.getByRole("button", {
        name: /help me write a professional email/i,
      }),
    ).toBeInTheDocument();
  });

  it("should call onPromptSelect with the prompt text when clicked", async () => {
    const user = userEvent.setup();
    const onPromptSelect = vi.fn();
    render(<EmptyState onPromptSelect={onPromptSelect} />);

    const promptButton = screen.getByRole("button", {
      name: /write a short story about a time traveler/i,
    });
    await user.click(promptButton);

    expect(onPromptSelect).toHaveBeenCalledTimes(1);
    expect(onPromptSelect).toHaveBeenCalledWith(
      "Write a short story about a time traveler",
    );
  });

  it("should call onPromptSelect with different prompts", async () => {
    const user = userEvent.setup();
    const onPromptSelect = vi.fn();
    render(<EmptyState onPromptSelect={onPromptSelect} />);

    const codingPrompt = screen.getByRole("button", {
      name: /explain async\/await in javascript/i,
    });
    await user.click(codingPrompt);

    expect(onPromptSelect).toHaveBeenCalledWith(
      "Explain async/await in JavaScript",
    );
  });
});

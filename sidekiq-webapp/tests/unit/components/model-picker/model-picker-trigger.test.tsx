import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ModelPickerTrigger } from "@sidekiq/ai/components/model-picker-trigger";
import type { ModelConfig } from "@sidekiq/ai/api/models-metadata";

const mockModel: ModelConfig = {
  id: "anthropic/claude-sonnet-4-20250514",
  name: "Claude Sonnet 4",
  provider: "anthropic",
  pricingTier: "$$",
  speedTier: "balanced",
  description: "Excellent balance of speed and intelligence",
  features: ["coding", "thinking"],
  knowledgeCutoff: "Apr 2025",
};

/**
 * Helper to render ModelPickerTrigger with default props
 */
function renderTrigger(
  overrides: Partial<React.ComponentProps<typeof ModelPickerTrigger>> = {},
) {
  const defaultProps = {
    selectedModel: mockModel,
    ...overrides,
  };

  return {
    ...render(<ModelPickerTrigger {...defaultProps} />),
    props: defaultProps,
  };
}

describe("ModelPickerTrigger", () => {
  describe("rendering", () => {
    it("should render with selected model name", () => {
      renderTrigger({ selectedModel: mockModel });

      expect(screen.getByText("Claude Sonnet 4")).toBeInTheDocument();
    });

    it("should render 'Select model' when no model selected", () => {
      renderTrigger({ selectedModel: undefined });

      expect(screen.getByText("Select model")).toBeInTheDocument();
    });

    it("should render as a button element", () => {
      renderTrigger();

      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
    });

    it("should render chevron down icon", () => {
      const { container } = renderTrigger();

      // Check for the chevron icon (lucide renders SVG)
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });
  });

  describe("disabled state", () => {
    it("should be disabled when disabled prop is true", () => {
      renderTrigger({ disabled: true });

      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
    });

    it("should be enabled when disabled prop is false", () => {
      renderTrigger({ disabled: false });

      const button = screen.getByRole("button");
      expect(button).toBeEnabled();
    });

    it("should be enabled by default", () => {
      renderTrigger();

      const button = screen.getByRole("button");
      expect(button).toBeEnabled();
    });
  });

  describe("props forwarding (04-04 gap closure fix)", () => {
    it("should forward onClick handler", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();

      renderTrigger({ onClick });

      const button = screen.getByRole("button");
      await user.click(button);

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("should forward onMouseEnter handler", async () => {
      const user = userEvent.setup();
      const onMouseEnter = vi.fn();

      renderTrigger({ onMouseEnter });

      const button = screen.getByRole("button");
      await user.hover(button);

      expect(onMouseEnter).toHaveBeenCalled();
    });

    it("should forward onFocus handler", async () => {
      const user = userEvent.setup();
      const onFocus = vi.fn();

      renderTrigger({ onFocus });

      const button = screen.getByRole("button");
      await user.click(button);

      expect(onFocus).toHaveBeenCalled();
    });

    it("should forward aria attributes", () => {
      renderTrigger({
        "aria-label": "Custom label",
        "aria-expanded": true,
        "aria-haspopup": "listbox",
      });

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-label", "Custom label");
      expect(button).toHaveAttribute("aria-expanded", "true");
      expect(button).toHaveAttribute("aria-haspopup", "listbox");
    });

    it("should forward data attributes", () => {
      render(
        <ModelPickerTrigger
          selectedModel={mockModel}
          data-testid="model-picker-trigger"
          data-state="open"
        />,
      );

      const button = screen.getByTestId("model-picker-trigger");
      expect(button).toHaveAttribute("data-state", "open");
    });

    it("should merge className with existing classes", () => {
      renderTrigger({ className: "custom-class" });

      const button = screen.getByRole("button");
      expect(button).toHaveClass("custom-class");
      // Should also have default classes
      expect(button).toHaveClass("h-8");
    });
  });

  describe("ref forwarding", () => {
    it("should forward ref to button element", () => {
      const ref = vi.fn();
      render(<ModelPickerTrigger selectedModel={mockModel} ref={ref} />);

      expect(ref).toHaveBeenCalled();
      const firstCall = ref.mock.calls[0] as unknown[];
      expect(firstCall).toBeDefined();
      expect(firstCall[0]).toBeInstanceOf(HTMLButtonElement);
    });
  });

  describe("different models", () => {
    it("should display OpenAI model correctly", () => {
      const openaiModel: ModelConfig = {
        id: "openai/gpt-4o",
        name: "GPT-4o",
        provider: "openai",
        pricingTier: "$$",
        speedTier: "balanced",
        description: "Balanced performance",
        features: ["coding", "vision"],
        knowledgeCutoff: "Oct 2023",
      };

      renderTrigger({ selectedModel: openaiModel });

      expect(screen.getByText("GPT-4o")).toBeInTheDocument();
    });

    it("should display Google model correctly", () => {
      const googleModel: ModelConfig = {
        id: "google/gemini-2.0-flash",
        name: "Gemini 2.0 Flash",
        provider: "google",
        pricingTier: "$",
        speedTier: "fast",
        description: "Ultra-fast responses",
        features: ["fast", "vision"],
        knowledgeCutoff: "Aug 2024",
      };

      renderTrigger({ selectedModel: googleModel });

      expect(screen.getByText("Gemini 2.0 Flash")).toBeInTheDocument();
    });
  });
});

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SidekiqIndicator } from "@sidekiq/sidekiqs/components/sidekiq-indicator";

/**
 * Mock Sidekiq data for tests
 */
const mockSidekiq = {
  id: "sidekiq-1",
  name: "Code Helper",
  avatar: { type: "initials" as const, color: "#6366f1" },
  description: "A helpful coding assistant",
};

describe("SidekiqIndicator", () => {
  describe("rendering", () => {
    it("should render sidekiq name", () => {
      render(<SidekiqIndicator sidekiq={mockSidekiq} />);

      expect(screen.getByText("Code Helper")).toBeInTheDocument();
    });

    it("should render sidekiq avatar with correct props", () => {
      render(<SidekiqIndicator sidekiq={mockSidekiq} size="lg" />);

      // Avatar should render with the sidekiq name as the initials source
      // The avatar component displays initials derived from the name
      const avatar = screen
        .getByText("Code Helper")
        .closest("div")?.parentElement;
      expect(avatar).toBeInTheDocument();
    });

    it("should render description when showDescription is true", () => {
      render(<SidekiqIndicator sidekiq={mockSidekiq} showDescription={true} />);

      expect(
        screen.getByText("A helpful coding assistant"),
      ).toBeInTheDocument();
    });

    it("should not render description when showDescription is false (default)", () => {
      render(<SidekiqIndicator sidekiq={mockSidekiq} />);

      expect(
        screen.queryByText("A helpful coding assistant"),
      ).not.toBeInTheDocument();
    });

    it("should not render description when sidekiq has no description", () => {
      const sidekiqWithoutDescription = {
        ...mockSidekiq,
        description: null,
      };
      render(
        <SidekiqIndicator
          sidekiq={sidekiqWithoutDescription}
          showDescription={true}
        />,
      );

      // Name should still render
      expect(screen.getByText("Code Helper")).toBeInTheDocument();
      // But no description element
      expect(
        screen.queryByText("A helpful coding assistant"),
      ).not.toBeInTheDocument();
    });
  });

  describe("wrapper behavior", () => {
    it("should render as div when no onClick provided", () => {
      render(<SidekiqIndicator sidekiq={mockSidekiq} />);

      // Should not have a button role when no onClick
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("should render as button when onClick provided", () => {
      const onClick = vi.fn();
      render(<SidekiqIndicator sidekiq={mockSidekiq} onClick={onClick} />);

      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("should call onClick handler when clicked (button mode)", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(<SidekiqIndicator sidekiq={mockSidekiq} onClick={onClick} />);

      const button = screen.getByRole("button");
      await user.click(button);

      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  describe("styling", () => {
    it("should apply custom className", () => {
      render(
        <SidekiqIndicator sidekiq={mockSidekiq} className="custom-class" />,
      );

      // The wrapper div should have the custom class
      const wrapper = screen
        .getByText("Code Helper")
        .closest("div")?.parentElement;
      expect(wrapper).toHaveClass("custom-class");
    });

    it("should apply hover styles when onClick is provided", () => {
      const onClick = vi.fn();
      render(<SidekiqIndicator sidekiq={mockSidekiq} onClick={onClick} />);

      const button = screen.getByRole("button");
      // When onClick is provided, the component should have hover classes
      expect(button).toHaveClass("hover:bg-accent/50");
    });

    it("should not apply hover styles when onClick is not provided", () => {
      render(<SidekiqIndicator sidekiq={mockSidekiq} />);

      const wrapper = screen
        .getByText("Code Helper")
        .closest("div")?.parentElement;
      expect(wrapper).not.toHaveClass("hover:bg-accent/50");
    });
  });

  describe("size prop", () => {
    it("should accept different size values", () => {
      const { rerender } = render(
        <SidekiqIndicator sidekiq={mockSidekiq} size="sm" />,
      );

      expect(screen.getByText("Code Helper")).toBeInTheDocument();

      rerender(<SidekiqIndicator sidekiq={mockSidekiq} size="md" />);
      expect(screen.getByText("Code Helper")).toBeInTheDocument();

      rerender(<SidekiqIndicator sidekiq={mockSidekiq} size="lg" />);
      expect(screen.getByText("Code Helper")).toBeInTheDocument();
    });
  });
});

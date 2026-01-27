import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { TooltipProvider } from "@sidekiq/ui/tooltip";
import { MessageActions } from "@sidekiq/chats/components/message-actions";

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Import mocked toast
import { toast } from "sonner";

/**
 * Helper to render MessageActions with required TooltipProvider wrapper
 */
function renderWithTooltip(
  props: Partial<React.ComponentProps<typeof MessageActions>> = {},
) {
  const defaultProps = {
    role: "assistant" as const,
    content: "Test content",
    ...props,
  };

  return render(
    <TooltipProvider delayDuration={0}>
      <div className="group">
        <MessageActions {...defaultProps} />
      </div>
    </TooltipProvider>,
  );
}

describe("MessageActions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe("copy button", () => {
    it("should always render the copy button", () => {
      renderWithTooltip({ role: "assistant" });
      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThanOrEqual(1);
    });

    it("should show success toast after copying", async () => {
      const user = userEvent.setup();
      renderWithTooltip();

      const copyButton = screen.getAllByRole("button")[0]!;
      await user.click(copyButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Copied to clipboard");
      });
    });
  });

  describe("role-based rendering", () => {
    it("should render edit button for user role when onEdit provided", () => {
      const onEdit = vi.fn();
      renderWithTooltip({ role: "user", onEdit });

      // With copy + edit buttons
      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBe(2);
    });

    it("should not render edit button for assistant role", () => {
      const onEdit = vi.fn();
      renderWithTooltip({ role: "assistant", onEdit });

      // Only copy button (edit is not shown for assistant)
      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBe(1);
    });

    it("should not render edit button when onEdit is not provided", () => {
      renderWithTooltip({ role: "user" });

      // Only copy button (no onEdit provided)
      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBe(1);
    });

    it("should render regenerate button for assistant role when onRegenerate provided", () => {
      const onRegenerate = vi.fn();
      renderWithTooltip({ role: "assistant", onRegenerate });

      // Copy + regenerate buttons
      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBe(2);
    });

    it("should not render regenerate button for user role", () => {
      const onRegenerate = vi.fn();
      renderWithTooltip({ role: "user", onRegenerate });

      // Only copy button (regenerate is not shown for user)
      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBe(1);
    });

    it("should not render regenerate button when onRegenerate is not provided", () => {
      renderWithTooltip({ role: "assistant" });

      // Only copy button
      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBe(1);
    });
  });

  describe("edit button callback", () => {
    it("should call onEdit when edit button is clicked", async () => {
      const user = userEvent.setup();
      const onEdit = vi.fn();
      renderWithTooltip({ role: "user", onEdit });

      const buttons = screen.getAllByRole("button");
      // Edit button is second (after copy)
      await user.click(buttons[1]!);

      await waitFor(() => {
        expect(onEdit).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("regenerate button callback", () => {
    it("should call onRegenerate when regenerate button is clicked", async () => {
      const user = userEvent.setup();
      const onRegenerate = vi.fn();
      renderWithTooltip({ role: "assistant", onRegenerate });

      const buttons = screen.getAllByRole("button");
      // Regenerate button is second (after copy)
      await user.click(buttons[1]!);

      await waitFor(() => {
        expect(onRegenerate).toHaveBeenCalledTimes(1);
      });
    });
  });
});

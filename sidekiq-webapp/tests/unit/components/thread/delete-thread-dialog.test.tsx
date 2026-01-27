import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DeleteThreadDialog } from "@sidekiq/chats/components/delete-thread-dialog";

/**
 * Helper to render DeleteThreadDialog with default props
 */
function renderDialog(
  overrides: Partial<React.ComponentProps<typeof DeleteThreadDialog>> = {},
) {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    onConfirm: vi.fn(),
    threadTitle: "Test conversation",
    isDeleting: false,
    ...overrides,
  };

  return {
    ...render(<DeleteThreadDialog {...defaultProps} />),
    props: defaultProps,
  };
}

describe("DeleteThreadDialog", () => {
  describe("rendering", () => {
    it("should not render when closed", () => {
      renderDialog({ open: false });

      expect(
        screen.queryByText("Delete conversation?"),
      ).not.toBeInTheDocument();
    });

    it("should render dialog title when open", () => {
      renderDialog({ open: true });

      expect(screen.getByText("Delete conversation?")).toBeInTheDocument();
    });

    it("should show thread title in confirmation message", () => {
      renderDialog({ threadTitle: "My chat" });

      expect(screen.getByText(/My chat/)).toBeInTheDocument();
    });

    it("should show fallback text when title is null", () => {
      renderDialog({ threadTitle: null });

      expect(screen.getByText(/this conversation/)).toBeInTheDocument();
    });

    it("should show archive suggestion", () => {
      renderDialog();

      expect(
        screen.getByText(/consider archiving instead/i),
      ).toBeInTheDocument();
    });
  });

  describe("buttons", () => {
    it("should render Cancel and Delete buttons", () => {
      renderDialog();

      expect(
        screen.getByRole("button", { name: /cancel/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /delete/i }),
      ).toBeInTheDocument();
    });

    it("should disable buttons when isDeleting is true", () => {
      renderDialog({ isDeleting: true });

      expect(screen.getByRole("button", { name: /cancel/i })).toBeDisabled();
      expect(screen.getByRole("button", { name: /deleting/i })).toBeDisabled();
    });

    it("should show 'Deleting...' text when isDeleting", () => {
      renderDialog({ isDeleting: true });

      expect(screen.getByText("Deleting...")).toBeInTheDocument();
    });
  });

  describe("interactions", () => {
    it("should call onConfirm when Delete button is clicked", async () => {
      const user = userEvent.setup();
      const { props } = renderDialog();

      const deleteButton = screen.getByRole("button", { name: /^delete$/i });
      await user.click(deleteButton);

      expect(props.onConfirm).toHaveBeenCalledTimes(1);
    });

    it("should call onOpenChange(false) when Cancel is clicked", async () => {
      const user = userEvent.setup();
      const { props } = renderDialog();

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      await user.click(cancelButton);

      expect(props.onOpenChange).toHaveBeenCalledWith(false);
    });

    it("should call onOpenChange(false) when pressing Escape", async () => {
      const user = userEvent.setup();
      const { props } = renderDialog();

      await user.keyboard("{Escape}");

      expect(props.onOpenChange).toHaveBeenCalledWith(false);
    });
  });
});

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DeleteSidekiqDialog } from "@sidekiq/components/sidekiq/delete-sidekiq-dialog";

/**
 * Helper to render DeleteSidekiqDialog with default props
 */
function renderDialog(
  overrides: Partial<React.ComponentProps<typeof DeleteSidekiqDialog>> = {},
) {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    onConfirm: vi.fn(),
    sidekiqName: "Test Bot",
    threadCount: 0,
    isDeleting: false,
    ...overrides,
  };

  return {
    ...render(<DeleteSidekiqDialog {...defaultProps} />),
    props: defaultProps,
  };
}

describe("DeleteSidekiqDialog", () => {
  describe("rendering", () => {
    it("should not render when closed", () => {
      renderDialog({ open: false });

      expect(screen.queryByText(/Delete/)).not.toBeInTheDocument();
    });

    it("should render dialog title with sidekiq name when open", () => {
      renderDialog({ sidekiqName: "My Bot" });

      expect(screen.getByText(/Delete "My Bot"\?/)).toBeInTheDocument();
    });

    it("should show type-to-confirm input with label showing sidekiq name", () => {
      renderDialog({ sidekiqName: "Code Helper" });

      // Find the label by its for attribute (confirm-name)
      const label = document.querySelector('label[for="confirm-name"]');
      expect(label).toBeInTheDocument();
      // The sidekiq name appears in the label's inner span with font-mono
      expect(
        screen.getByText("Code Helper", { selector: "span.font-mono" }),
      ).toBeInTheDocument();
      expect(screen.getByRole("textbox")).toBeInTheDocument();
    });

    it("should show placeholder with sidekiq name", () => {
      renderDialog({ sidekiqName: "Test Bot" });

      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("placeholder", "Test Bot");
    });

    it("should show delete button disabled initially", () => {
      renderDialog();

      const deleteButton = screen.getByRole("button", {
        name: /Delete Sidekiq/i,
      });
      expect(deleteButton).toBeDisabled();
    });
  });

  describe("thread count display", () => {
    it("should show thread count checkbox when threadCount > 0", () => {
      renderDialog({ threadCount: 5 });

      expect(screen.getByRole("checkbox")).toBeInTheDocument();
      expect(
        screen.getByText(/Also delete 5 conversations using this Sidekiq/),
      ).toBeInTheDocument();
    });

    it("should hide thread count checkbox when threadCount = 0", () => {
      renderDialog({ threadCount: 0 });

      expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    });

    it('should show singular "conversation" for threadCount = 1', () => {
      renderDialog({ threadCount: 1 });

      expect(
        screen.getByText(/Also delete 1 conversation using this Sidekiq/),
      ).toBeInTheDocument();
      expect(screen.queryByText(/1 conversations/)).not.toBeInTheDocument();
    });

    it('should show plural "conversations" for threadCount > 1', () => {
      renderDialog({ threadCount: 2 });

      expect(
        screen.getByText(/Also delete 2 conversations using this Sidekiq/),
      ).toBeInTheDocument();
    });
  });

  describe("type-to-confirm", () => {
    it("should keep delete button disabled when typed text does not match", async () => {
      const user = userEvent.setup();
      renderDialog({ sidekiqName: "MyBot" });

      const input = screen.getByRole("textbox");
      await user.type(input, "Wrong");

      const deleteButton = screen.getByRole("button", {
        name: /Delete Sidekiq/i,
      });
      expect(deleteButton).toBeDisabled();
    });

    it("should enable delete button when typed text matches exactly", async () => {
      const user = userEvent.setup();
      renderDialog({ sidekiqName: "MyBot" });

      const input = screen.getByRole("textbox");
      await user.type(input, "MyBot");

      const deleteButton = screen.getByRole("button", {
        name: /Delete Sidekiq/i,
      });
      expect(deleteButton).toBeEnabled();
    });

    it("should be case-sensitive (MyBot != mybot)", async () => {
      const user = userEvent.setup();
      renderDialog({ sidekiqName: "MyBot" });

      const input = screen.getByRole("textbox");
      await user.type(input, "mybot");

      const deleteButton = screen.getByRole("button", {
        name: /Delete Sidekiq/i,
      });
      expect(deleteButton).toBeDisabled();
    });

    it("should handle partial match (not enabled)", async () => {
      const user = userEvent.setup();
      renderDialog({ sidekiqName: "MyBot" });

      const input = screen.getByRole("textbox");
      await user.type(input, "My");

      const deleteButton = screen.getByRole("button", {
        name: /Delete Sidekiq/i,
      });
      expect(deleteButton).toBeDisabled();
    });
  });

  describe("interactions", () => {
    it("should update input value when typing", async () => {
      const user = userEvent.setup();
      renderDialog();

      const input = screen.getByRole("textbox");
      await user.type(input, "Test");

      expect(input).toHaveValue("Test");
    });

    it("should call onOpenChange(false) when Cancel is clicked", async () => {
      const user = userEvent.setup();
      const { props } = renderDialog();

      const cancelButton = screen.getByRole("button", { name: /Cancel/i });
      await user.click(cancelButton);

      expect(props.onOpenChange).toHaveBeenCalledWith(false);
    });

    it("should call onConfirm with deleteThreads=false when delete clicked (no checkbox)", async () => {
      const user = userEvent.setup();
      const { props } = renderDialog({ sidekiqName: "MyBot", threadCount: 0 });

      const input = screen.getByRole("textbox");
      await user.type(input, "MyBot");

      const deleteButton = screen.getByRole("button", {
        name: /Delete Sidekiq/i,
      });
      await user.click(deleteButton);

      expect(props.onConfirm).toHaveBeenCalledWith(false);
    });

    it("should call onConfirm with deleteThreads=false when checkbox not checked", async () => {
      const user = userEvent.setup();
      const { props } = renderDialog({ sidekiqName: "MyBot", threadCount: 5 });

      const input = screen.getByRole("textbox");
      await user.type(input, "MyBot");

      const deleteButton = screen.getByRole("button", {
        name: /Delete Sidekiq/i,
      });
      await user.click(deleteButton);

      expect(props.onConfirm).toHaveBeenCalledWith(false);
    });

    it("should call onConfirm with deleteThreads=true when checkbox is checked", async () => {
      const user = userEvent.setup();
      const { props } = renderDialog({ sidekiqName: "MyBot", threadCount: 5 });

      const checkbox = screen.getByRole("checkbox");
      await user.click(checkbox);

      const input = screen.getByRole("textbox");
      await user.type(input, "MyBot");

      const deleteButton = screen.getByRole("button", {
        name: /Delete Sidekiq/i,
      });
      await user.click(deleteButton);

      expect(props.onConfirm).toHaveBeenCalledWith(true);
    });

    it("should toggle checkbox state when clicked", async () => {
      const user = userEvent.setup();
      renderDialog({ threadCount: 5 });

      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).not.toBeChecked();

      await user.click(checkbox);
      expect(checkbox).toBeChecked();

      await user.click(checkbox);
      expect(checkbox).not.toBeChecked();
    });

    it("should call onOpenChange(false) when pressing Escape", async () => {
      const user = userEvent.setup();
      const { props } = renderDialog();

      await user.keyboard("{Escape}");

      expect(props.onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe("loading state", () => {
    it('should show "Deleting..." when isDeleting=true', () => {
      renderDialog({ isDeleting: true });

      expect(screen.getByText("Deleting...")).toBeInTheDocument();
    });

    it("should disable Cancel button when isDeleting", () => {
      renderDialog({ isDeleting: true });

      const cancelButton = screen.getByRole("button", { name: /Cancel/i });
      expect(cancelButton).toBeDisabled();
    });

    it("should disable input when isDeleting", () => {
      renderDialog({ isDeleting: true });

      const input = screen.getByRole("textbox");
      expect(input).toBeDisabled();
    });

    it("should disable checkbox when isDeleting", () => {
      renderDialog({ isDeleting: true, threadCount: 5 });

      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toBeDisabled();
    });

    it("should disable delete button when isDeleting (even if confirmed)", async () => {
      const user = userEvent.setup();
      const onConfirm = vi.fn();
      const { rerender } = render(
        <DeleteSidekiqDialog
          open={true}
          onOpenChange={vi.fn()}
          onConfirm={onConfirm}
          sidekiqName="MyBot"
          threadCount={0}
          isDeleting={false}
        />,
      );

      // Type the confirmation
      const input = screen.getByRole("textbox");
      await user.type(input, "MyBot");

      // Verify enabled before loading
      let deleteButton = screen.getByRole("button", {
        name: /Delete Sidekiq/i,
      });
      expect(deleteButton).toBeEnabled();

      // Set to loading
      rerender(
        <DeleteSidekiqDialog
          open={true}
          onOpenChange={vi.fn()}
          onConfirm={onConfirm}
          sidekiqName="MyBot"
          threadCount={0}
          isDeleting={true}
        />,
      );

      deleteButton = screen.getByRole("button", { name: /Deleting.../i });
      expect(deleteButton).toBeDisabled();
    });
  });

  describe("reset state", () => {
    it("should call handleOpenChange to clear input when Cancel is clicked", async () => {
      const user = userEvent.setup();
      let isOpen = true;
      const onOpenChange = vi.fn((open: boolean) => {
        isOpen = open;
      });
      const { rerender } = render(
        <DeleteSidekiqDialog
          open={isOpen}
          onOpenChange={onOpenChange}
          onConfirm={vi.fn()}
          sidekiqName="MyBot"
          threadCount={0}
          isDeleting={false}
        />,
      );

      // Type something
      const input = screen.getByRole("textbox");
      await user.type(input, "MyBot");
      expect(input).toHaveValue("MyBot");

      // Close dialog via Cancel button (triggers handleOpenChange)
      const cancelButton = screen.getByRole("button", { name: /Cancel/i });
      await user.click(cancelButton);

      // Verify onOpenChange was called with false
      expect(onOpenChange).toHaveBeenCalledWith(false);

      // Reopen dialog
      rerender(
        <DeleteSidekiqDialog
          open={true}
          onOpenChange={onOpenChange}
          onConfirm={vi.fn()}
          sidekiqName="MyBot"
          threadCount={0}
          isDeleting={false}
        />,
      );

      // Input should be cleared because handleOpenChange resets state when closing
      const newInput = screen.getByRole("textbox");
      expect(newInput).toHaveValue("");
    });

    it("should reset checkbox when dialog is closed via Cancel", async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      const { rerender } = render(
        <DeleteSidekiqDialog
          open={true}
          onOpenChange={onOpenChange}
          onConfirm={vi.fn()}
          sidekiqName="MyBot"
          threadCount={5}
          isDeleting={false}
        />,
      );

      // Check the checkbox
      const checkbox = screen.getByRole("checkbox");
      await user.click(checkbox);
      expect(checkbox).toBeChecked();

      // Close dialog via Cancel button (triggers handleOpenChange which resets state)
      const cancelButton = screen.getByRole("button", { name: /Cancel/i });
      await user.click(cancelButton);

      // Verify onOpenChange was called with false
      expect(onOpenChange).toHaveBeenCalledWith(false);

      // Reopen dialog
      rerender(
        <DeleteSidekiqDialog
          open={true}
          onOpenChange={onOpenChange}
          onConfirm={vi.fn()}
          sidekiqName="MyBot"
          threadCount={5}
          isDeleting={false}
        />,
      );

      // Checkbox should be unchecked because handleOpenChange resets state when closing
      const newCheckbox = screen.getByRole("checkbox");
      expect(newCheckbox).not.toBeChecked();
    });
  });
});

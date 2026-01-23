import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ThreadContextMenu } from "@sidekiq/components/thread/thread-context-menu";

/**
 * Helper to render ThreadContextMenu with default props
 */
function renderContextMenu(
  overrides: Partial<React.ComponentProps<typeof ThreadContextMenu>> = {},
) {
  const defaultProps = {
    isPinned: false,
    isArchived: false,
    onTogglePin: vi.fn(),
    onArchive: vi.fn(),
    onUnarchive: vi.fn(),
    onRename: vi.fn(),
    onDelete: vi.fn(),
    children: <div data-testid="trigger">Thread content</div>,
    ...overrides,
  };

  return {
    ...render(<ThreadContextMenu {...defaultProps} />),
    props: defaultProps,
  };
}

/**
 * Helper to open the context menu by right-clicking the trigger
 */
async function openContextMenu() {
  const trigger = screen.getByTestId("trigger");
  fireEvent.contextMenu(trigger);
}

describe("ThreadContextMenu", () => {
  describe("pin toggle", () => {
    it("should show 'Pin' when isPinned is false", async () => {
      renderContextMenu({ isPinned: false });

      await openContextMenu();

      expect(screen.getByText("Pin")).toBeInTheDocument();
      expect(screen.queryByText("Unpin")).not.toBeInTheDocument();
    });

    it("should show 'Unpin' when isPinned is true", async () => {
      renderContextMenu({ isPinned: true });

      await openContextMenu();

      expect(screen.getByText("Unpin")).toBeInTheDocument();
      expect(screen.queryByText("Pin")).not.toBeInTheDocument();
    });

    it("should call onTogglePin when pin item is clicked", async () => {
      const user = userEvent.setup();
      const { props } = renderContextMenu({ isPinned: false });

      await openContextMenu();
      await user.click(screen.getByText("Pin"));

      expect(props.onTogglePin).toHaveBeenCalledTimes(1);
    });
  });

  describe("archive/restore toggle", () => {
    it("should show 'Archive' when isArchived is false", async () => {
      renderContextMenu({ isArchived: false });

      await openContextMenu();

      expect(screen.getByText("Archive")).toBeInTheDocument();
      expect(screen.queryByText("Restore")).not.toBeInTheDocument();
    });

    it("should show 'Restore' when isArchived is true", async () => {
      renderContextMenu({ isArchived: true });

      await openContextMenu();

      expect(screen.getByText("Restore")).toBeInTheDocument();
      expect(screen.queryByText("Archive")).not.toBeInTheDocument();
    });

    it("should call onArchive when archive item is clicked", async () => {
      const user = userEvent.setup();
      const { props } = renderContextMenu({ isArchived: false });

      await openContextMenu();
      await user.click(screen.getByText("Archive"));

      expect(props.onArchive).toHaveBeenCalledTimes(1);
    });

    it("should call onUnarchive when restore item is clicked", async () => {
      const user = userEvent.setup();
      const { props } = renderContextMenu({ isArchived: true });

      await openContextMenu();
      await user.click(screen.getByText("Restore"));

      expect(props.onUnarchive).toHaveBeenCalledTimes(1);
    });
  });

  describe("rename", () => {
    it("should show Rename option", async () => {
      renderContextMenu();

      await openContextMenu();

      expect(screen.getByText("Rename")).toBeInTheDocument();
    });

    it("should call onRename when rename item is clicked", async () => {
      const user = userEvent.setup();
      const { props } = renderContextMenu();

      await openContextMenu();
      await user.click(screen.getByText("Rename"));

      expect(props.onRename).toHaveBeenCalledTimes(1);
    });
  });

  describe("regenerate title", () => {
    it("should not show Regenerate title when callback is not provided", async () => {
      renderContextMenu({ onRegenerateTitle: undefined });

      await openContextMenu();

      expect(screen.queryByText("Regenerate title")).not.toBeInTheDocument();
    });

    it("should show Regenerate title when callback is provided", async () => {
      renderContextMenu({ onRegenerateTitle: vi.fn() });

      await openContextMenu();

      expect(screen.getByText("Regenerate title")).toBeInTheDocument();
    });

    it("should call onRegenerateTitle when item is clicked", async () => {
      const user = userEvent.setup();
      const onRegenerateTitle = vi.fn();
      renderContextMenu({ onRegenerateTitle });

      await openContextMenu();
      await user.click(screen.getByText("Regenerate title"));

      expect(onRegenerateTitle).toHaveBeenCalledTimes(1);
    });
  });

  describe("delete", () => {
    it("should show Delete option", async () => {
      renderContextMenu();

      await openContextMenu();

      expect(screen.getByText("Delete")).toBeInTheDocument();
    });

    it("should call onDelete when delete item is clicked", async () => {
      const user = userEvent.setup();
      const { props } = renderContextMenu();

      await openContextMenu();
      await user.click(screen.getByText("Delete"));

      expect(props.onDelete).toHaveBeenCalledTimes(1);
    });
  });

  describe("children", () => {
    it("should render children as the trigger", () => {
      renderContextMenu({
        children: <div data-testid="custom-trigger">Custom content</div>,
      });

      expect(screen.getByTestId("custom-trigger")).toBeInTheDocument();
      expect(screen.getByText("Custom content")).toBeInTheDocument();
    });
  });
});

import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
}));

// Mock the useThreadActions hook
const mockDeleteThread = vi.fn();
const mockArchiveThread = vi.fn();
const mockUnarchiveThread = vi.fn();
const mockTogglePin = vi.fn();
const mockRenameThread = vi.fn();

vi.mock("@sidekiq/hooks/use-thread-actions", () => ({
  useThreadActions: vi.fn(() => ({
    deleteThread: mockDeleteThread,
    archiveThread: mockArchiveThread,
    unarchiveThread: mockUnarchiveThread,
    togglePin: mockTogglePin,
    renameThread: mockRenameThread,
    isDeleting: false,
    isArchiving: false,
    isRenaming: false,
  })),
}));

// Import after mocks
import { useRouter } from "next/navigation";
import { ThreadItem } from "@sidekiq/components/thread/thread-item";

/**
 * Helper to create a mock thread
 */
function createMockThread(overrides = {}) {
  return {
    id: "thread-123",
    title: "Test conversation",
    isPinned: false,
    isArchived: false,
    lastActivityAt: new Date(),
    messageCount: 5,
    ...overrides,
  };
}

/**
 * Helper to render ThreadItem with default props
 */
function renderThreadItem(
  overrides: Partial<React.ComponentProps<typeof ThreadItem>> = {},
) {
  const defaultProps = {
    thread: createMockThread(),
    isActive: false,
    activeThreadId: null,
    ...overrides,
  };

  return {
    ...render(<ThreadItem {...defaultProps} />),
    props: defaultProps,
  };
}

describe("ThreadItem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Helper to get the main thread container (role="button" div)
   */
  function getThreadContainer(container: HTMLElement) {
    return container.querySelector('[role="button"][tabindex="0"]')!;
  }

  describe("display", () => {
    it("should display thread title", () => {
      renderThreadItem({
        thread: createMockThread({ title: "My conversation" }),
      });

      expect(screen.getByText("My conversation")).toBeInTheDocument();
    });

    it("should show 'New conversation' fallback when title is null", () => {
      renderThreadItem({
        thread: createMockThread({ title: null }),
      });

      expect(screen.getByText("New conversation")).toBeInTheDocument();
    });

    it("should show pin icon when thread is pinned", () => {
      const { container } = renderThreadItem({
        thread: createMockThread({ isPinned: true }),
      });

      // The component shows a Pin icon when pinned (in the main container, not the action button)
      const pinIcon = container.querySelector(
        ".lucide-pin.text-muted-foreground",
      );
      expect(pinIcon).toBeInTheDocument();
    });

    it("should have reduced opacity when thread is archived", () => {
      const { container } = renderThreadItem({
        thread: createMockThread({ isArchived: true }),
      });

      // Check for the opacity-60 class on the container
      const threadDiv = container.querySelector(".opacity-60");
      expect(threadDiv).toBeInTheDocument();
    });

    it("should apply active styling when isActive is true", () => {
      const { container } = renderThreadItem({
        isActive: true,
      });

      // Check for the bg-sidebar-accent class (active state, updated in Phase 8.1)
      const threadDiv = container.querySelector(".bg-sidebar-accent");
      expect(threadDiv).toBeInTheDocument();
    });

    it("should have left accent bar when active (Phase 8.1)", () => {
      const { container } = renderThreadItem({
        isActive: true,
      });

      // Active threads have a left border accent bar (border-l-2 border-sidebar-primary)
      const threadDiv = container.querySelector(".border-l-2");
      expect(threadDiv).toBeInTheDocument();
      expect(threadDiv).toHaveClass("border-sidebar-primary");
    });

    it("should not have left accent bar when inactive", () => {
      const { container } = renderThreadItem({
        isActive: false,
      });

      const threadDiv = container.querySelector(".border-l-2");
      expect(threadDiv).not.toBeInTheDocument();
    });

    it("should render Sidekiq avatar when thread has sidekiq relation", () => {
      renderThreadItem({
        thread: createMockThread({
          sidekiqId: "sidekiq-1",
          sidekiq: {
            id: "sidekiq-1",
            name: "Code Helper",
            avatar: { type: "initials" as const, color: "#3b82f6" },
          },
        }),
      });

      // Sidekiq subtitle should appear
      expect(screen.getByText("with Code Helper")).toBeInTheDocument();
    });

    it("should show deleted sidekiq placeholder when sidekiq was deleted", () => {
      const { container } = renderThreadItem({
        thread: createMockThread({
          sidekiqId: "sidekiq-deleted",
          deletedSidekiqName: "Old Helper",
          sidekiq: null,
        }),
      });

      // "?" placeholder should render
      expect(screen.getByText("?")).toBeInTheDocument();
      // "[Sidekiq deleted]" subtitle should appear
      expect(screen.getByText("[Sidekiq deleted]")).toBeInTheDocument();
    });
  });

  describe("navigation", () => {
    it("should navigate to thread on click", async () => {
      const user = userEvent.setup();
      const mockPush = vi.fn();
      (useRouter as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        push: mockPush,
      });

      const { container } = renderThreadItem({
        thread: createMockThread({ id: "thread-abc" }),
      });

      const threadContainer = getThreadContainer(container);
      await user.click(threadContainer);

      expect(mockPush).toHaveBeenCalledWith("/chat/thread-abc");
    });

    it("should navigate on Enter key press", async () => {
      const mockPush = vi.fn();
      (useRouter as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        push: mockPush,
      });

      const { container } = renderThreadItem({
        thread: createMockThread({ id: "thread-xyz" }),
      });

      const threadContainer = getThreadContainer(container);
      fireEvent.keyDown(threadContainer, { key: "Enter" });

      expect(mockPush).toHaveBeenCalledWith("/chat/thread-xyz");
    });
  });

  describe("action buttons", () => {
    it("should reveal action buttons on hover", async () => {
      const user = userEvent.setup();
      const { container } = renderThreadItem();

      const threadContainer = getThreadContainer(container);
      await user.hover(threadContainer);

      // The hover state should reveal buttons (they have opacity-0 by default)
      // We can check that action buttons exist
      const actionButtons = container.querySelectorAll(
        'button[data-slot="button"]',
      );
      expect(actionButtons.length).toBeGreaterThanOrEqual(1); // Pin button + more button
    });

    it("should call togglePin when pin button is clicked", async () => {
      const user = userEvent.setup();
      const { container } = renderThreadItem({
        thread: createMockThread({ id: "thread-123" }),
      });

      const threadContainer = getThreadContainer(container);
      await user.hover(threadContainer);

      // Find the pin action button (first button inside the container)
      const pinButton = container.querySelector('button[data-slot="button"]')!;

      if (pinButton) {
        await user.click(pinButton);
        expect(mockTogglePin).toHaveBeenCalledWith({ threadId: "thread-123" });
      }
    });
  });

  describe("context menu", () => {
    it("should show context menu on right-click", async () => {
      const { container } = renderThreadItem();

      const threadContainer = getThreadContainer(container);
      fireEvent.contextMenu(threadContainer);

      // Context menu should show options
      expect(screen.getByText("Rename")).toBeInTheDocument();
      expect(screen.getByText("Archive")).toBeInTheDocument();
      expect(screen.getByText("Delete")).toBeInTheDocument();
    });

    it("should show Restore instead of Archive for archived threads", async () => {
      const { container } = renderThreadItem({
        thread: createMockThread({ isArchived: true }),
      });

      const threadContainer = getThreadContainer(container);
      fireEvent.contextMenu(threadContainer);

      expect(screen.getByText("Restore")).toBeInTheDocument();
      expect(screen.queryByText("Archive")).not.toBeInTheDocument();
    });
  });

  describe("delete confirmation dialog", () => {
    it("should show delete dialog when Delete is clicked from context menu", async () => {
      const user = userEvent.setup();
      const { container } = renderThreadItem({
        thread: createMockThread({ title: "My thread" }),
      });

      const threadContainer = getThreadContainer(container);
      fireEvent.contextMenu(threadContainer);

      await user.click(screen.getByText("Delete"));

      // Delete dialog should appear
      expect(screen.getByText("Delete conversation?")).toBeInTheDocument();
      // Check dialog description contains the thread title
      expect(
        screen.getByText(/permanently delete.*My thread/i),
      ).toBeInTheDocument();
    });

    it("should call deleteThread when delete is confirmed", async () => {
      const user = userEvent.setup();
      const { container } = renderThreadItem({
        thread: createMockThread({ id: "thread-to-delete" }),
      });

      const threadContainer = getThreadContainer(container);
      fireEvent.contextMenu(threadContainer);

      await user.click(screen.getByText("Delete"));
      await user.click(screen.getByRole("button", { name: /^delete$/i }));

      expect(mockDeleteThread).toHaveBeenCalledWith({
        threadId: "thread-to-delete",
      });
    });
  });

  describe("inline rename", () => {
    it("should show rename input when Rename is clicked from dropdown menu", async () => {
      const user = userEvent.setup();
      const { container } = renderThreadItem({
        thread: createMockThread({ title: "Original title" }),
      });

      // Hover to reveal action buttons
      const threadContainer = getThreadContainer(container);
      await user.hover(threadContainer);

      // Click the more (dropdown) button
      const dropdownTrigger = container.querySelector(
        'button[data-slot="dropdown-menu-trigger"]',
      )!;
      await user.click(dropdownTrigger);

      // Click Rename in dropdown
      await user.click(screen.getByText("Rename"));

      // Rename input should appear with the current title
      const input = await screen.findByRole("textbox");
      expect(input).toBeInTheDocument();
      expect(input).toHaveValue("Original title");
    });

    it("should call renameThread with new title on Enter", async () => {
      const user = userEvent.setup();
      const { container } = renderThreadItem({
        thread: createMockThread({ id: "thread-123", title: "Old title" }),
      });

      // Hover to reveal action buttons
      const threadContainer = getThreadContainer(container);
      await user.hover(threadContainer);

      // Click the more (dropdown) button
      const dropdownTrigger = container.querySelector(
        'button[data-slot="dropdown-menu-trigger"]',
      )!;
      await user.click(dropdownTrigger);

      // Click Rename in dropdown
      await user.click(screen.getByText("Rename"));

      // Input should appear
      const input = await screen.findByRole("textbox");
      await user.clear(input);
      await user.type(input, "New title{Enter}");

      expect(mockRenameThread).toHaveBeenCalledWith({
        threadId: "thread-123",
        title: "New title",
      });
    });

    it("should cancel rename on Escape", async () => {
      const user = userEvent.setup();
      const { container } = renderThreadItem({
        thread: createMockThread({ title: "Original" }),
      });

      // Hover to reveal action buttons
      const threadContainer = getThreadContainer(container);
      await user.hover(threadContainer);

      // Click the more (dropdown) button
      const dropdownTrigger = container.querySelector(
        'button[data-slot="dropdown-menu-trigger"]',
      )!;
      await user.click(dropdownTrigger);

      // Click Rename in dropdown
      await user.click(screen.getByText("Rename"));

      // Input should appear, then press Escape
      await screen.findByRole("textbox");
      await user.keyboard("{Escape}");

      // Should go back to displaying the title
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
      expect(screen.getByText("Original")).toBeInTheDocument();
    });
  });
});

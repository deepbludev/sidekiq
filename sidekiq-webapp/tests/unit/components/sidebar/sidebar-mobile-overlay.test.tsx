import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { SidebarMobileOverlay } from "@sidekiq/components/sidebar/sidebar-mobile-overlay";

/** Mock next/navigation hooks */
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => "/chat",
  useRouter: () => ({ push: mockPush }),
}));

/** Mock child panel components to avoid tRPC/hook dependencies */
vi.mock("@sidekiq/components/sidebar/sidebar-panel-chats", () => ({
  SidebarPanelChats: () => <div data-testid="panel-chats">Chats Panel</div>,
}));
vi.mock("@sidekiq/components/sidebar/sidebar-panel-sidekiqs", () => ({
  SidebarPanelSidekiqs: () => (
    <div data-testid="panel-sidekiqs">Sidekiqs Panel</div>
  ),
}));

describe("SidebarMobileOverlay", () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("chats feature", () => {
    it('should render "Chats" title', () => {
      render(<SidebarMobileOverlay feature="chats" onClose={mockOnClose} />);
      expect(screen.getByText("Chats")).toBeInTheDocument();
    });

    it("should render New Chat button", () => {
      render(<SidebarMobileOverlay feature="chats" onClose={mockOnClose} />);
      expect(screen.getByText("New Chat")).toBeInTheDocument();
    });

    it("should render chats panel content", () => {
      render(<SidebarMobileOverlay feature="chats" onClose={mockOnClose} />);
      expect(screen.getByTestId("panel-chats")).toBeInTheDocument();
    });

    it("should not render sidekiqs panel content", () => {
      render(<SidebarMobileOverlay feature="chats" onClose={mockOnClose} />);
      expect(screen.queryByTestId("panel-sidekiqs")).not.toBeInTheDocument();
    });

    it("should navigate to /chat and close when New Chat clicked", () => {
      render(<SidebarMobileOverlay feature="chats" onClose={mockOnClose} />);
      fireEvent.click(screen.getByText("New Chat"));

      expect(mockPush).toHaveBeenCalledWith("/chat");
      expect(mockOnClose).toHaveBeenCalledOnce();
    });
  });

  describe("sidekiqs feature", () => {
    it('should render "Sidekiqs" title', () => {
      render(<SidebarMobileOverlay feature="sidekiqs" onClose={mockOnClose} />);
      expect(screen.getByText("Sidekiqs")).toBeInTheDocument();
    });

    it("should NOT render New Chat button", () => {
      render(<SidebarMobileOverlay feature="sidekiqs" onClose={mockOnClose} />);
      expect(screen.queryByText("New Chat")).not.toBeInTheDocument();
    });

    it("should render sidekiqs panel content", () => {
      render(<SidebarMobileOverlay feature="sidekiqs" onClose={mockOnClose} />);
      expect(screen.getByTestId("panel-sidekiqs")).toBeInTheDocument();
    });

    it("should not render chats panel content", () => {
      render(<SidebarMobileOverlay feature="sidekiqs" onClose={mockOnClose} />);
      expect(screen.queryByTestId("panel-chats")).not.toBeInTheDocument();
    });
  });

  describe("close button", () => {
    it("should always render close button", () => {
      render(<SidebarMobileOverlay feature="chats" onClose={mockOnClose} />);
      expect(screen.getByText("Close overlay")).toBeInTheDocument();
    });

    it("should call onClose when close button clicked", () => {
      render(<SidebarMobileOverlay feature="chats" onClose={mockOnClose} />);
      fireEvent.click(screen.getByText("Close overlay"));

      expect(mockOnClose).toHaveBeenCalledOnce();
    });

    it("should render close button for sidekiqs feature too", () => {
      render(<SidebarMobileOverlay feature="sidekiqs" onClose={mockOnClose} />);
      expect(screen.getByText("Close overlay")).toBeInTheDocument();
    });

    it("should call onClose when close button clicked on sidekiqs", () => {
      render(<SidebarMobileOverlay feature="sidekiqs" onClose={mockOnClose} />);
      fireEvent.click(screen.getByText("Close overlay"));

      expect(mockOnClose).toHaveBeenCalledOnce();
    });
  });
});

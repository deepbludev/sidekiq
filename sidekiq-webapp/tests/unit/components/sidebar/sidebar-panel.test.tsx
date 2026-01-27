import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { SidebarPanel } from "@sidekiq/shared/layout/sidebar-panel";

/** Mock next/navigation hooks */
const mockPathname = vi.fn<() => string>(() => "/chat");
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
  useRouter: () => ({ push: vi.fn() }),
}));

/** Mock child panel components to avoid tRPC/hook dependencies */
vi.mock("@sidekiq/chats/components/sidebar-panel-chats", () => ({
  SidebarPanelChats: () => <div data-testid="panel-chats">Chats Panel</div>,
}));
vi.mock("@sidekiq/sidekiqs/components/sidebar-panel-sidekiqs", () => ({
  SidebarPanelSidekiqs: () => (
    <div data-testid="panel-sidekiqs">Sidekiqs Panel</div>
  ),
}));
vi.mock("@sidekiq/workspace/components/sidebar-panel-teams", () => ({
  SidebarPanelTeams: () => <div data-testid="panel-teams">Teams Panel</div>,
}));

/**
 * Helper to get the parent wrapper div of a panel by its testid.
 * The component wraps each panel in a div with conditional "hidden" class.
 */
function getPanelWrapper(testId: string): HTMLElement {
  const panel = screen.getByTestId(testId);
  // The parent div is the one with the conditional hidden class
  return panel.parentElement!;
}

describe("SidebarPanel", () => {
  describe("all panels stay mounted", () => {
    it("should render all three panels in the DOM regardless of route", () => {
      mockPathname.mockReturnValue("/chat");
      render(<SidebarPanel />);

      expect(screen.getByTestId("panel-chats")).toBeInTheDocument();
      expect(screen.getByTestId("panel-sidekiqs")).toBeInTheDocument();
      expect(screen.getByTestId("panel-teams")).toBeInTheDocument();
    });
  });

  describe("hidden/block switching", () => {
    it("should show chats panel and hide others on /chat", () => {
      mockPathname.mockReturnValue("/chat");
      render(<SidebarPanel />);

      expect(getPanelWrapper("panel-chats")).not.toHaveClass("hidden");
      expect(getPanelWrapper("panel-sidekiqs")).toHaveClass("hidden");
      expect(getPanelWrapper("panel-teams")).toHaveClass("hidden");
    });

    it("should show chats panel and hide others on /chat/:threadId", () => {
      mockPathname.mockReturnValue("/chat/abc123");
      render(<SidebarPanel />);

      expect(getPanelWrapper("panel-chats")).not.toHaveClass("hidden");
      expect(getPanelWrapper("panel-sidekiqs")).toHaveClass("hidden");
      expect(getPanelWrapper("panel-teams")).toHaveClass("hidden");
    });

    it("should show sidekiqs panel and hide others on /sidekiqs", () => {
      mockPathname.mockReturnValue("/sidekiqs");
      render(<SidebarPanel />);

      expect(getPanelWrapper("panel-chats")).toHaveClass("hidden");
      expect(getPanelWrapper("panel-sidekiqs")).not.toHaveClass("hidden");
      expect(getPanelWrapper("panel-teams")).toHaveClass("hidden");
    });

    it("should show sidekiqs panel and hide others on /sidekiqs/new", () => {
      mockPathname.mockReturnValue("/sidekiqs/new");
      render(<SidebarPanel />);

      expect(getPanelWrapper("panel-chats")).toHaveClass("hidden");
      expect(getPanelWrapper("panel-sidekiqs")).not.toHaveClass("hidden");
      expect(getPanelWrapper("panel-teams")).toHaveClass("hidden");
    });

    it("should show teams panel and hide others on /settings/teams", () => {
      mockPathname.mockReturnValue("/settings/teams");
      render(<SidebarPanel />);

      expect(getPanelWrapper("panel-chats")).toHaveClass("hidden");
      expect(getPanelWrapper("panel-sidekiqs")).toHaveClass("hidden");
      expect(getPanelWrapper("panel-teams")).not.toHaveClass("hidden");
    });

    it("should show chats panel (default) on /settings", () => {
      mockPathname.mockReturnValue("/settings");
      render(<SidebarPanel />);

      expect(getPanelWrapper("panel-chats")).not.toHaveClass("hidden");
      expect(getPanelWrapper("panel-sidekiqs")).toHaveClass("hidden");
      expect(getPanelWrapper("panel-teams")).toHaveClass("hidden");
    });

    it("should show chats panel (default) on unknown route", () => {
      mockPathname.mockReturnValue("/unknown");
      render(<SidebarPanel />);

      expect(getPanelWrapper("panel-chats")).not.toHaveClass("hidden");
      expect(getPanelWrapper("panel-sidekiqs")).toHaveClass("hidden");
      expect(getPanelWrapper("panel-teams")).toHaveClass("hidden");
    });
  });
});

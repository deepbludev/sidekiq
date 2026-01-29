import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { WorkspaceAvatar } from "@sidekiq/workspace/components/workspace-avatar";

/**
 * Helper to render WorkspaceAvatar with sensible defaults.
 */
function renderWorkspaceAvatar(
  overrides: Partial<React.ComponentProps<typeof WorkspaceAvatar>> = {},
) {
  const defaultProps = {
    name: "Code Team",
    avatar: { type: "initials" as const, color: "#6366f1" },
    ...overrides,
  };

  return render(<WorkspaceAvatar {...defaultProps} />);
}

describe("WorkspaceAvatar", () => {
  describe("rendering", () => {
    it("should render initials from workspace name", () => {
      renderWorkspaceAvatar({ name: "Code Team" });
      expect(screen.getByText("CT")).toBeInTheDocument();
    });

    it("should render emoji when avatar type is emoji", () => {
      renderWorkspaceAvatar({
        avatar: { type: "emoji", color: "#ef4444", emoji: "🚀" },
      });
      expect(screen.getByText("🚀")).toBeInTheDocument();
    });

    it("should render with custom background color", () => {
      renderWorkspaceAvatar({
        avatar: { type: "initials", color: "#ef4444" },
      });
      const fallback = screen.getByText("CT");
      expect(fallback).toHaveStyle({ backgroundColor: "#ef4444" });
    });

    it("should use rounded-lg class to distinguish from user avatars", () => {
      const { container } = renderWorkspaceAvatar();
      // The outer Avatar span should have rounded-lg
      const avatarRoot = container.querySelector('[data-slot="avatar"]');
      expect(avatarRoot).toHaveClass("rounded-lg");
    });
  });

  describe("sizes", () => {
    it("should render with default md size (size-8)", () => {
      const { container } = renderWorkspaceAvatar();
      const avatarRoot = container.querySelector('[data-slot="avatar"]');
      expect(avatarRoot).toHaveClass("size-8");
    });

    it("should render with sm size (size-6)", () => {
      const { container } = renderWorkspaceAvatar({ size: "sm" });
      const avatarRoot = container.querySelector('[data-slot="avatar"]');
      expect(avatarRoot).toHaveClass("size-6");
    });

    it("should render with lg size (size-10)", () => {
      const { container } = renderWorkspaceAvatar({ size: "lg" });
      const avatarRoot = container.querySelector('[data-slot="avatar"]');
      expect(avatarRoot).toHaveClass("size-10");
    });

    it("should render with xl size (size-12)", () => {
      const { container } = renderWorkspaceAvatar({ size: "xl" });
      const avatarRoot = container.querySelector('[data-slot="avatar"]');
      expect(avatarRoot).toHaveClass("size-12");
    });
  });

  describe("edge cases", () => {
    it("should handle single-word workspace name", () => {
      renderWorkspaceAvatar({ name: "Engineering" });
      expect(screen.getByText("EN")).toBeInTheDocument();
    });

    it("should handle single-character workspace name", () => {
      renderWorkspaceAvatar({ name: "A" });
      expect(screen.getByText("A")).toBeInTheDocument();
    });

    it("should apply custom className prop", () => {
      const { container } = renderWorkspaceAvatar({
        className: "custom-class",
      });
      const avatarRoot = container.querySelector('[data-slot="avatar"]');
      expect(avatarRoot).toHaveClass("custom-class");
    });
  });
});

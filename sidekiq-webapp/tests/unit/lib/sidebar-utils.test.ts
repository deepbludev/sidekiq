import { describe, expect, it } from "vitest";
import {
  getActiveFeature,
  type SidebarFeature,
} from "@sidekiq/lib/sidebar-utils";

describe("getActiveFeature", () => {
  describe("chat routes -> chats", () => {
    it('should return "chats" for /chat', () => {
      expect(getActiveFeature("/chat")).toBe("chats");
    });

    it('should return "chats" for /chat with thread ID', () => {
      expect(getActiveFeature("/chat/abc123")).toBe("chats");
    });

    it('should return "chats" for /chat with long thread ID', () => {
      expect(getActiveFeature("/chat/some-long-thread-id")).toBe("chats");
    });
  });

  describe("sidekiq routes -> sidekiqs", () => {
    it('should return "sidekiqs" for /sidekiqs', () => {
      expect(getActiveFeature("/sidekiqs")).toBe("sidekiqs");
    });

    it('should return "sidekiqs" for /sidekiqs/new', () => {
      expect(getActiveFeature("/sidekiqs/new")).toBe("sidekiqs");
    });

    it('should return "sidekiqs" for /sidekiqs/:id/edit', () => {
      expect(getActiveFeature("/sidekiqs/abc123/edit")).toBe("sidekiqs");
    });
  });

  describe("team routes -> teams", () => {
    it('should return "teams" for /settings/teams', () => {
      expect(getActiveFeature("/settings/teams")).toBe("teams");
    });

    it('should return "teams" for /settings/teams with query param', () => {
      // Note: pathname does not include query strings, but test robustness
      expect(getActiveFeature("/settings/teams?team=abc123")).toBe("teams");
    });
  });

  describe("default fallback -> chats", () => {
    it('should return "chats" for /settings (general settings)', () => {
      expect(getActiveFeature("/settings")).toBe("chats");
    });

    it('should return "chats" for /settings/profile', () => {
      expect(getActiveFeature("/settings/profile")).toBe("chats");
    });

    it('should return "chats" for root path', () => {
      expect(getActiveFeature("/")).toBe("chats");
    });

    it('should return "chats" for unknown paths', () => {
      expect(getActiveFeature("/unknown")).toBe("chats");
    });

    it('should return "chats" for empty string', () => {
      expect(getActiveFeature("")).toBe("chats");
    });
  });

  describe("priority order", () => {
    it("/settings/teams must return teams, NOT chats", () => {
      // Critical: /settings/teams check must come before general /settings fallback
      const result = getActiveFeature("/settings/teams");
      expect(result).toBe("teams");
      expect(result).not.toBe("chats");
    });

    it("/settings must return chats, not teams", () => {
      // /settings alone should NOT be matched by the teams check
      const result = getActiveFeature("/settings");
      expect(result).toBe("chats");
      expect(result).not.toBe("teams");
    });
  });

  describe("type safety", () => {
    it("should return a valid SidebarFeature type", () => {
      const validFeatures: SidebarFeature[] = ["chats", "sidekiqs", "teams"];
      const result = getActiveFeature("/chat");
      expect(validFeatures).toContain(result);
    });

    it("should always return one of the three valid features", () => {
      const paths = [
        "/chat",
        "/chat/abc",
        "/sidekiqs",
        "/sidekiqs/new",
        "/settings/teams",
        "/settings",
        "/",
        "/unknown",
      ];
      const validFeatures: SidebarFeature[] = ["chats", "sidekiqs", "teams"];
      for (const path of paths) {
        expect(validFeatures).toContain(getActiveFeature(path));
      }
    });
  });
});

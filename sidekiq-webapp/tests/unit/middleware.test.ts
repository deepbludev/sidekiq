import { describe, expect, it, vi, beforeEach } from "vitest";
import { type NextRequest, NextResponse } from "next/server";

// Mock better-auth/cookies
vi.mock("better-auth/cookies", () => ({
  getSessionCookie: vi.fn(),
}));

import { getSessionCookie } from "better-auth/cookies";
import { middleware } from "@sidekiq/middleware";

const mockedGetSessionCookie = vi.mocked(getSessionCookie);

function createMockRequest(pathname: string): NextRequest {
  return {
    nextUrl: {
      pathname,
    },
    url: `http://localhost:3000${pathname}`,
  } as unknown as NextRequest;
}

describe("middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("API and static routes", () => {
    it("should skip middleware for API routes", () => {
      const request = createMockRequest("/api/trpc/health.check");
      const response = middleware(request);

      expect(response.headers.get("x-middleware-next")).toBe("1");
      expect(mockedGetSessionCookie).not.toHaveBeenCalled();
    });

    it("should skip middleware for Next.js internal routes", () => {
      const request = createMockRequest("/_next/static/chunks/main.js");
      const response = middleware(request);

      expect(response.headers.get("x-middleware-next")).toBe("1");
      expect(mockedGetSessionCookie).not.toHaveBeenCalled();
    });

    it("should skip middleware for static files", () => {
      const request = createMockRequest("/favicon.ico");
      const response = middleware(request);

      expect(response.headers.get("x-middleware-next")).toBe("1");
      expect(mockedGetSessionCookie).not.toHaveBeenCalled();
    });
  });

  describe("public routes (unauthenticated)", () => {
    beforeEach(() => {
      mockedGetSessionCookie.mockReturnValue(null);
    });

    it("should allow access to homepage", () => {
      const request = createMockRequest("/");
      const response = middleware(request);

      expect(response.headers.get("x-middleware-next")).toBe("1");
    });

    it("should allow access to sign-in page", () => {
      const request = createMockRequest("/sign-in");
      const response = middleware(request);

      expect(response.headers.get("x-middleware-next")).toBe("1");
    });

    it("should allow access to sign-up page", () => {
      const request = createMockRequest("/sign-up");
      const response = middleware(request);

      expect(response.headers.get("x-middleware-next")).toBe("1");
    });

    it("should allow access to forgot-password page", () => {
      const request = createMockRequest("/forgot-password");
      const response = middleware(request);

      expect(response.headers.get("x-middleware-next")).toBe("1");
    });

    it("should allow access to reset-password page", () => {
      const request = createMockRequest("/reset-password");
      const response = middleware(request);

      expect(response.headers.get("x-middleware-next")).toBe("1");
    });
  });

  describe("protected routes (unauthenticated)", () => {
    beforeEach(() => {
      mockedGetSessionCookie.mockReturnValue(null);
    });

    it("should redirect to sign-in from chat when not authenticated", () => {
      const request = createMockRequest("/chat");
      const response = middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toContain("/sign-in");
      expect(response.headers.get("location")).toContain("callbackUrl=%2Fchat");
    });

    it("should redirect to sign-in from any protected route", () => {
      const request = createMockRequest("/settings/profile");
      const response = middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toContain("/sign-in");
      expect(response.headers.get("location")).toContain(
        "callbackUrl=%2Fsettings%2Fprofile",
      );
    });
  });

  describe("auth routes (authenticated)", () => {
    beforeEach(() => {
      mockedGetSessionCookie.mockReturnValue("valid-session-token");
    });

    it("should redirect from sign-in to chat when authenticated", () => {
      const request = createMockRequest("/sign-in");
      const response = middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toContain("/chat");
    });

    it("should redirect from sign-up to chat when authenticated", () => {
      const request = createMockRequest("/sign-up");
      const response = middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toContain("/chat");
    });

    it("should redirect from forgot-password to chat when authenticated", () => {
      const request = createMockRequest("/forgot-password");
      const response = middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toContain("/chat");
    });

    it("should redirect from reset-password to chat when authenticated", () => {
      const request = createMockRequest("/reset-password");
      const response = middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toContain("/chat");
    });
  });

  describe("protected routes (authenticated)", () => {
    beforeEach(() => {
      mockedGetSessionCookie.mockReturnValue("valid-session-token");
    });

    it("should allow access to chat when authenticated", () => {
      const request = createMockRequest("/chat");
      const response = middleware(request);

      expect(response.headers.get("x-middleware-next")).toBe("1");
    });

    it("should allow access to any protected route when authenticated", () => {
      const request = createMockRequest("/settings/profile");
      const response = middleware(request);

      expect(response.headers.get("x-middleware-next")).toBe("1");
    });
  });
});

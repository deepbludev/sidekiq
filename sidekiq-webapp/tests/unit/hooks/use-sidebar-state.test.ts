import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

/**
 * Unit tests for useSidebarState hook.
 *
 * Tests cover:
 * - Initial state from localStorage
 * - Toggle functionality
 * - Direct setIsCollapsed functionality
 * - localStorage persistence
 */

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

// Apply localStorage mock before imports
Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  writable: true,
});

// Import after mocking
import { useSidebarState } from "@sidekiq/hooks/use-sidebar-state";

describe("useSidebarState", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  describe("initial state", () => {
    it("should return isCollapsed: false when localStorage is empty", () => {
      localStorageMock.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useSidebarState());

      expect(result.current.isCollapsed).toBe(false);
    });

    it("should return isCollapsed: true when localStorage has 'true'", () => {
      localStorageMock.getItem.mockReturnValue("true");

      const { result } = renderHook(() => useSidebarState());

      expect(result.current.isCollapsed).toBe(true);
    });

    it("should return isCollapsed: false when localStorage has 'false'", () => {
      localStorageMock.getItem.mockReturnValue("false");

      const { result } = renderHook(() => useSidebarState());

      expect(result.current.isCollapsed).toBe(false);
    });

    it("should read from correct localStorage key", () => {
      localStorageMock.getItem.mockReturnValue(null);

      renderHook(() => useSidebarState());

      expect(localStorageMock.getItem).toHaveBeenCalledWith(
        "sidebar-collapsed",
      );
    });
  });

  describe("toggle()", () => {
    it("should toggle from false to true", () => {
      localStorageMock.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useSidebarState());

      expect(result.current.isCollapsed).toBe(false);

      act(() => {
        result.current.toggle();
      });

      expect(result.current.isCollapsed).toBe(true);
    });

    it("should toggle from true to false", () => {
      localStorageMock.getItem.mockReturnValue("true");

      const { result } = renderHook(() => useSidebarState());

      expect(result.current.isCollapsed).toBe(true);

      act(() => {
        result.current.toggle();
      });

      expect(result.current.isCollapsed).toBe(false);
    });

    it("should update localStorage on toggle", () => {
      localStorageMock.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useSidebarState());

      act(() => {
        result.current.toggle();
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "sidebar-collapsed",
        "true",
      );
    });

    it("should toggle multiple times correctly", () => {
      localStorageMock.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useSidebarState());

      // false -> true
      act(() => {
        result.current.toggle();
      });
      expect(result.current.isCollapsed).toBe(true);

      // true -> false
      act(() => {
        result.current.toggle();
      });
      expect(result.current.isCollapsed).toBe(false);

      // false -> true
      act(() => {
        result.current.toggle();
      });
      expect(result.current.isCollapsed).toBe(true);
    });
  });

  describe("setIsCollapsed()", () => {
    it("should set collapsed to true", () => {
      localStorageMock.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useSidebarState());

      expect(result.current.isCollapsed).toBe(false);

      act(() => {
        result.current.setIsCollapsed(true);
      });

      expect(result.current.isCollapsed).toBe(true);
    });

    it("should set collapsed to false", () => {
      localStorageMock.getItem.mockReturnValue("true");

      const { result } = renderHook(() => useSidebarState());

      expect(result.current.isCollapsed).toBe(true);

      act(() => {
        result.current.setIsCollapsed(false);
      });

      expect(result.current.isCollapsed).toBe(false);
    });

    it("should update localStorage with string value when set to true", () => {
      localStorageMock.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useSidebarState());

      act(() => {
        result.current.setIsCollapsed(true);
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "sidebar-collapsed",
        "true",
      );
    });

    it("should update localStorage with string value when set to false", () => {
      localStorageMock.getItem.mockReturnValue("true");

      const { result } = renderHook(() => useSidebarState());

      act(() => {
        result.current.setIsCollapsed(false);
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "sidebar-collapsed",
        "false",
      );
    });

    it("should not change state when setting to same value", () => {
      localStorageMock.getItem.mockReturnValue("true");

      const { result } = renderHook(() => useSidebarState());

      const initialState = result.current.isCollapsed;

      act(() => {
        result.current.setIsCollapsed(true);
      });

      expect(result.current.isCollapsed).toBe(initialState);
    });
  });

  describe("return value structure", () => {
    it("should return object with isCollapsed, toggle, and setIsCollapsed", () => {
      const { result } = renderHook(() => useSidebarState());

      expect(result.current).toHaveProperty("isCollapsed");
      expect(result.current).toHaveProperty("toggle");
      expect(result.current).toHaveProperty("setIsCollapsed");

      expect(typeof result.current.isCollapsed).toBe("boolean");
      expect(typeof result.current.toggle).toBe("function");
      expect(typeof result.current.setIsCollapsed).toBe("function");
    });
  });
});

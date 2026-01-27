import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// Mock functions
const mockMutate = vi.fn();
const mockCancel = vi.fn();
const mockGetData = vi.fn();
const mockSetData = vi.fn();
const mockInvalidate = vi.fn();

// Default mock data
const defaultPreferences: {
  defaultModel: string | undefined;
  favoriteModels: string[] | undefined;
} = {
  defaultModel: "anthropic/claude-sonnet-4-20250514",
  favoriteModels: ["openai/gpt-4o", "google/gemini-2.0-flash"],
};

// Create a mutable query result
let mockQueryResult: {
  data: typeof defaultPreferences | undefined;
  isLoading: boolean;
} = {
  data: defaultPreferences,
  isLoading: false,
};

vi.mock("@sidekiq/shared/trpc/react", () => ({
  api: {
    useUtils: () => ({
      user: {
        getPreferences: {
          cancel: mockCancel,
          getData: mockGetData,
          setData: mockSetData,
          invalidate: mockInvalidate,
        },
      },
    }),
    user: {
      getPreferences: {
        useQuery: () => mockQueryResult,
      },
      updateModelPreferences: {
        useMutation: () => ({
          mutate: mockMutate,
        }),
      },
    },
  },
}));

// Import after mocking
import { useModelSelection } from "@sidekiq/ai/hooks/use-model-selection";
import { DEFAULT_MODEL } from "@sidekiq/ai/api/models-metadata";

describe("useModelSelection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to default mock data
    mockQueryResult = {
      data: defaultPreferences,
      isLoading: false,
    };
    mockGetData.mockReturnValue(defaultPreferences);
  });

  afterEach(() => {
    // Reset mock query result after each test
    mockQueryResult = {
      data: defaultPreferences,
      isLoading: false,
    };
  });

  describe("initial state", () => {
    it("should use thread model when provided", () => {
      const { result } = renderHook(() =>
        useModelSelection({
          threadModel: "openai/gpt-4o",
        }),
      );

      expect(result.current.selectedModel).toBe("openai/gpt-4o");
    });

    it("should use user default when no thread model", () => {
      const { result } = renderHook(() => useModelSelection({}));

      // With preferences loaded, should use user default
      expect(result.current.selectedModel).toBeTruthy();
    });

    it("should use system default when no preferences", () => {
      // Override mock query result
      mockQueryResult = {
        data: undefined,
        isLoading: false,
      };

      const { result } = renderHook(() => useModelSelection({}));

      expect(result.current.selectedModel).toBe(DEFAULT_MODEL);
    });
  });

  describe("model priority", () => {
    it("should prioritize thread model over user default", () => {
      const { result } = renderHook(() =>
        useModelSelection({
          threadModel: "google/gemini-2.0-flash",
        }),
      );

      // Thread model takes priority
      expect(result.current.selectedModel).toBe("google/gemini-2.0-flash");
    });

    it("should ignore invalid thread model and use default", () => {
      const { result } = renderHook(() =>
        useModelSelection({
          threadModel: "invalid/model-id",
        }),
      );

      // Should fall back to user default or system default
      expect(result.current.selectedModel).not.toBe("invalid/model-id");
    });

    it("should handle null thread model", () => {
      const { result } = renderHook(() =>
        useModelSelection({
          threadModel: null,
        }),
      );

      // Should use user default or system default
      expect(result.current.selectedModel).toBeTruthy();
    });
  });

  describe("setSelectedModel", () => {
    it("should update selected model", () => {
      const { result } = renderHook(() => useModelSelection({}));

      act(() => {
        result.current.setSelectedModel("openai/gpt-4o");
      });

      expect(result.current.selectedModel).toBe("openai/gpt-4o");
    });

    it("should ignore invalid model IDs", () => {
      const { result } = renderHook(() =>
        useModelSelection({
          threadModel: "anthropic/claude-sonnet-4-20250514",
        }),
      );

      const originalModel = result.current.selectedModel;

      act(() => {
        result.current.setSelectedModel("invalid/model");
      });

      // Should not change
      expect(result.current.selectedModel).toBe(originalModel);
    });

    it("should call onModelChange callback when model changes", () => {
      const onModelChange = vi.fn();

      const { result } = renderHook(() =>
        useModelSelection({
          threadModel: "anthropic/claude-sonnet-4-20250514",
          onModelChange,
        }),
      );

      act(() => {
        result.current.setSelectedModel("openai/gpt-4o");
      });

      expect(onModelChange).toHaveBeenCalledWith(
        "anthropic/claude-sonnet-4-20250514",
        "openai/gpt-4o",
      );
    });

    it("should not call onModelChange when selecting same model", () => {
      const onModelChange = vi.fn();

      const { result } = renderHook(() =>
        useModelSelection({
          threadModel: "anthropic/claude-sonnet-4-20250514",
          onModelChange,
        }),
      );

      act(() => {
        result.current.setSelectedModel("anthropic/claude-sonnet-4-20250514");
      });

      expect(onModelChange).not.toHaveBeenCalled();
    });
  });

  describe("toggleFavorite", () => {
    it("should call mutation with toggleFavorite", () => {
      const { result } = renderHook(() => useModelSelection({}));

      act(() => {
        result.current.toggleFavorite("openai/gpt-4o");
      });

      expect(mockMutate).toHaveBeenCalledWith({
        toggleFavorite: "openai/gpt-4o",
      });
    });
  });

  describe("setAsDefault", () => {
    it("should call mutation with defaultModel", () => {
      const { result } = renderHook(() => useModelSelection({}));

      act(() => {
        result.current.setAsDefault("openai/gpt-4o");
      });

      expect(mockMutate).toHaveBeenCalledWith({
        defaultModel: "openai/gpt-4o",
      });
    });
  });

  describe("favoriteModelIds", () => {
    it("should return favorite model IDs from preferences", () => {
      const { result } = renderHook(() => useModelSelection({}));

      expect(result.current.favoriteModelIds).toEqual([
        "openai/gpt-4o",
        "google/gemini-2.0-flash",
      ]);
    });

    it("should return empty array when no favorites", () => {
      mockQueryResult = {
        data: { defaultModel: undefined, favoriteModels: undefined },
        isLoading: false,
      };

      const { result } = renderHook(() => useModelSelection({}));

      expect(result.current.favoriteModelIds).toEqual([]);
    });
  });

  describe("defaultModelId", () => {
    it("should return default model ID from preferences", () => {
      const { result } = renderHook(() => useModelSelection({}));

      expect(result.current.defaultModelId).toBe(
        "anthropic/claude-sonnet-4-20250514",
      );
    });

    it("should return undefined when no default set", () => {
      mockQueryResult = {
        data: { defaultModel: undefined, favoriteModels: [] },
        isLoading: false,
      };

      const { result } = renderHook(() => useModelSelection({}));

      expect(result.current.defaultModelId).toBeUndefined();
    });
  });

  describe("isLoading", () => {
    it("should reflect loading state from query", () => {
      mockQueryResult = {
        data: undefined,
        isLoading: true,
      };

      const { result } = renderHook(() => useModelSelection({}));

      expect(result.current.isLoading).toBe(true);
    });

    it("should be false when data is loaded", () => {
      mockQueryResult = {
        data: defaultPreferences,
        isLoading: false,
      };

      const { result } = renderHook(() => useModelSelection({}));

      expect(result.current.isLoading).toBe(false);
    });
  });
});

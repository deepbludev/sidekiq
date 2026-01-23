import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  AVAILABLE_MODELS,
  DEFAULT_MODEL,
  getModel,
  getModelConfig,
  isValidModel,
  getModelsByProvider,
  type Provider,
} from "@sidekiq/lib/ai/models";

// Mock the gateway module
vi.mock("@sidekiq/lib/ai/gateway", () => ({
  gateway: vi.fn((modelId: string) => ({ modelId })),
}));

describe("AVAILABLE_MODELS", () => {
  it("should contain 8 models", () => {
    expect(AVAILABLE_MODELS).toHaveLength(8);
  });

  it("should have unique IDs for all models", () => {
    const ids = AVAILABLE_MODELS.map((model) => model.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("should have required fields for each model", () => {
    for (const model of AVAILABLE_MODELS) {
      expect(model).toHaveProperty("id");
      expect(model).toHaveProperty("name");
      expect(model).toHaveProperty("provider");
      expect(model).toHaveProperty("pricingTier");
      expect(model).toHaveProperty("speedTier");
    }
  });
});

describe("DEFAULT_MODEL", () => {
  it("should exist in AVAILABLE_MODELS", () => {
    const exists = AVAILABLE_MODELS.some((model) => model.id === DEFAULT_MODEL);
    expect(exists).toBe(true);
  });

  it("should be a valid model ID format", () => {
    // DEFAULT_MODEL should match provider/model-name format
    expect(DEFAULT_MODEL).toMatch(/^[a-z]+\/[a-z0-9.-]+$/);
  });
});

describe("getModel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call gateway with the model ID", async () => {
    const { gateway } = await import("@sidekiq/lib/ai/gateway");
    const modelId = "anthropic/claude-sonnet-4-20250514";

    getModel(modelId);

    expect(gateway).toHaveBeenCalledWith(modelId);
  });

  it("should return the gateway result", async () => {
    const modelId = "openai/gpt-4o";
    const result = getModel(modelId);

    expect(result).toEqual({ modelId });
  });
});

describe("getModelConfig", () => {
  it("should return config for valid model ID", () => {
    const config = getModelConfig("anthropic/claude-sonnet-4-20250514");

    expect(config).toBeDefined();
    expect(config?.id).toBe("anthropic/claude-sonnet-4-20250514");
    expect(config?.name).toBe("Claude Sonnet 4");
    expect(config?.provider).toBe("anthropic");
    expect(config?.pricingTier).toBe("$$");
    expect(config?.speedTier).toBe("balanced");
  });

  it("should return undefined for invalid model ID", () => {
    const config = getModelConfig("invalid/model-id");
    expect(config).toBeUndefined();
  });

  it("should return undefined for empty string", () => {
    const config = getModelConfig("");
    expect(config).toBeUndefined();
  });
});

describe("isValidModel", () => {
  it("should return true for valid model IDs", () => {
    expect(isValidModel("anthropic/claude-sonnet-4-20250514")).toBe(true);
    expect(isValidModel("openai/gpt-4o")).toBe(true);
    expect(isValidModel("google/gemini-2.0-flash")).toBe(true);
  });

  it("should return false for invalid model IDs", () => {
    expect(isValidModel("invalid/model")).toBe(false);
    expect(isValidModel("")).toBe(false);
    expect(isValidModel("anthropic/claude-2")).toBe(false);
  });

  it("should be case-sensitive", () => {
    expect(isValidModel("ANTHROPIC/claude-sonnet-4-20250514")).toBe(false);
  });
});

describe("getModelsByProvider", () => {
  it("should return 3 OpenAI models", () => {
    const openaiModels = getModelsByProvider("openai");

    expect(openaiModels).toHaveLength(3);
    for (const model of openaiModels) {
      expect(model.provider).toBe("openai");
    }
  });

  it("should return 3 Anthropic models", () => {
    const anthropicModels = getModelsByProvider("anthropic");

    expect(anthropicModels).toHaveLength(3);
    for (const model of anthropicModels) {
      expect(model.provider).toBe("anthropic");
    }
  });

  it("should return 2 Google models", () => {
    const googleModels = getModelsByProvider("google");

    expect(googleModels).toHaveLength(2);
    for (const model of googleModels) {
      expect(model.provider).toBe("google");
    }
  });

  it("should return empty array for unknown provider", () => {
    // Using type assertion to test with invalid provider
    const models = getModelsByProvider("unknown" as Provider);
    expect(models).toHaveLength(0);
  });

  it("should include specific models for each provider", () => {
    const openai = getModelsByProvider("openai");
    expect(openai.map((m) => m.id)).toContain("openai/gpt-4o-mini");
    expect(openai.map((m) => m.id)).toContain("openai/gpt-4o");
    expect(openai.map((m) => m.id)).toContain("openai/o1");

    const anthropic = getModelsByProvider("anthropic");
    expect(anthropic.map((m) => m.id)).toContain(
      "anthropic/claude-3-5-haiku-latest",
    );
    expect(anthropic.map((m) => m.id)).toContain(
      "anthropic/claude-sonnet-4-20250514",
    );
    expect(anthropic.map((m) => m.id)).toContain(
      "anthropic/claude-opus-4-20250514",
    );

    const google = getModelsByProvider("google");
    expect(google.map((m) => m.id)).toContain("google/gemini-2.0-flash");
    expect(google.map((m) => m.id)).toContain(
      "google/gemini-2.5-pro-preview-05-06",
    );
  });
});

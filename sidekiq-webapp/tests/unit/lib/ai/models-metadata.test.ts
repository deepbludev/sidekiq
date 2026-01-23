import { describe, expect, it } from "vitest";
import {
  AVAILABLE_MODELS,
  DEFAULT_MODEL,
  getModelConfig,
  isValidModel,
  getModelsByProvider,
  getProviders,
  type Provider,
  type ModelFeature,
} from "@sidekiq/lib/ai/models-metadata";

describe("AVAILABLE_MODELS extended metadata", () => {
  it("should contain 8 models", () => {
    expect(AVAILABLE_MODELS).toHaveLength(8);
  });

  it("should have unique IDs for all models", () => {
    const ids = AVAILABLE_MODELS.map((model) => model.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("should have all required fields including new Phase 4 fields", () => {
    for (const model of AVAILABLE_MODELS) {
      // Core fields
      expect(model).toHaveProperty("id");
      expect(model).toHaveProperty("name");
      expect(model).toHaveProperty("provider");
      expect(model).toHaveProperty("pricingTier");
      expect(model).toHaveProperty("speedTier");
      // Phase 4 extended fields
      expect(model).toHaveProperty("description");
      expect(model).toHaveProperty("features");
      expect(model).toHaveProperty("knowledgeCutoff");
    }
  });

  it("should have non-empty descriptions for all models", () => {
    for (const model of AVAILABLE_MODELS) {
      expect(model.description).toBeTruthy();
      expect(model.description.length).toBeGreaterThan(10);
    }
  });

  it("should have valid features array for all models", () => {
    const validFeatures: ModelFeature[] = [
      "fast",
      "thinking",
      "coding",
      "vision",
      "long-context",
    ];

    for (const model of AVAILABLE_MODELS) {
      expect(Array.isArray(model.features)).toBe(true);
      for (const feature of model.features) {
        expect(validFeatures).toContain(feature);
      }
    }
  });

  it("should have valid knowledgeCutoff dates for all models", () => {
    const datePattern = /^[A-Z][a-z]{2} \d{4}$/; // e.g., "Apr 2024"

    for (const model of AVAILABLE_MODELS) {
      expect(model.knowledgeCutoff).toMatch(datePattern);
    }
  });

  it("should have valid provider values", () => {
    const validProviders: Provider[] = ["openai", "anthropic", "google"];

    for (const model of AVAILABLE_MODELS) {
      expect(validProviders).toContain(model.provider);
    }
  });

  it("should have valid pricing tier values", () => {
    const validTiers = ["$", "$$", "$$$"];

    for (const model of AVAILABLE_MODELS) {
      expect(validTiers).toContain(model.pricingTier);
    }
  });

  it("should have valid speed tier values", () => {
    const validTiers = ["fast", "balanced", "quality"];

    for (const model of AVAILABLE_MODELS) {
      expect(validTiers).toContain(model.speedTier);
    }
  });
});

describe("DEFAULT_MODEL", () => {
  it("should exist in AVAILABLE_MODELS", () => {
    const exists = AVAILABLE_MODELS.some((model) => model.id === DEFAULT_MODEL);
    expect(exists).toBe(true);
  });

  it("should be a valid model string", () => {
    expect(DEFAULT_MODEL).toMatch(/^[a-z]+\/[a-z0-9.-]+$/);
  });
});

describe("getModelConfig", () => {
  it("should return config for valid model ID", () => {
    const config = getModelConfig("anthropic/claude-sonnet-4-20250514");

    expect(config).toBeDefined();
    expect(config?.id).toBe("anthropic/claude-sonnet-4-20250514");
    expect(config?.name).toBe("Claude Sonnet 4");
    expect(config?.provider).toBe("anthropic");
    expect(config?.description).toBeTruthy();
    expect(config?.features).toContain("coding");
    expect(config?.knowledgeCutoff).toBe("Apr 2025");
  });

  it("should return config with extended metadata for all models", () => {
    for (const model of AVAILABLE_MODELS) {
      const config = getModelConfig(model.id);
      expect(config).toBeDefined();
      expect(config?.description).toBe(model.description);
      expect(config?.features).toEqual(model.features);
      expect(config?.knowledgeCutoff).toBe(model.knowledgeCutoff);
    }
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

  it("should validate all available models", () => {
    for (const model of AVAILABLE_MODELS) {
      expect(isValidModel(model.id)).toBe(true);
    }
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
    const models = getModelsByProvider("unknown" as Provider);
    expect(models).toHaveLength(0);
  });

  it("should include extended metadata for filtered models", () => {
    const openaiModels = getModelsByProvider("openai");

    for (const model of openaiModels) {
      expect(model.description).toBeTruthy();
      expect(Array.isArray(model.features)).toBe(true);
      expect(model.knowledgeCutoff).toBeTruthy();
    }
  });
});

describe("getProviders", () => {
  it("should return all unique providers", () => {
    const providers = getProviders();

    expect(providers).toHaveLength(3);
    expect(providers).toContain("openai");
    expect(providers).toContain("anthropic");
    expect(providers).toContain("google");
  });

  it("should return unique values only", () => {
    const providers = getProviders();
    const uniqueProviders = [...new Set(providers)];

    expect(providers).toHaveLength(uniqueProviders.length);
  });

  it("should return providers in consistent order", () => {
    // Call multiple times to verify consistency
    const providers1 = getProviders();
    const providers2 = getProviders();

    expect(providers1).toEqual(providers2);
  });
});

describe("Model features", () => {
  it("should have at least one fast model per provider", () => {
    const providers: Provider[] = ["openai", "anthropic", "google"];

    for (const provider of providers) {
      const models = getModelsByProvider(provider);
      const hasFast = models.some(
        (m) => m.features.includes("fast") || m.speedTier === "fast",
      );
      expect(hasFast).toBe(true);
    }
  });

  it("should have at least one coding-capable model", () => {
    const hasCoding = AVAILABLE_MODELS.some((m) =>
      m.features.includes("coding"),
    );
    expect(hasCoding).toBe(true);
  });

  it("should have at least one thinking-capable model", () => {
    const hasThinking = AVAILABLE_MODELS.some((m) =>
      m.features.includes("thinking"),
    );
    expect(hasThinking).toBe(true);
  });

  it("should have at least one vision-capable model", () => {
    const hasVision = AVAILABLE_MODELS.some((m) =>
      m.features.includes("vision"),
    );
    expect(hasVision).toBe(true);
  });

  it("should have at least one long-context model", () => {
    const hasLongContext = AVAILABLE_MODELS.some((m) =>
      m.features.includes("long-context"),
    );
    expect(hasLongContext).toBe(true);
  });
});

describe("Pricing and speed tiers", () => {
  it("should have models across all pricing tiers", () => {
    const hasBudget = AVAILABLE_MODELS.some((m) => m.pricingTier === "$");
    const hasMid = AVAILABLE_MODELS.some((m) => m.pricingTier === "$$");
    const hasPremium = AVAILABLE_MODELS.some((m) => m.pricingTier === "$$$");

    expect(hasBudget).toBe(true);
    expect(hasMid).toBe(true);
    expect(hasPremium).toBe(true);
  });

  it("should have models across all speed tiers", () => {
    const hasFast = AVAILABLE_MODELS.some((m) => m.speedTier === "fast");
    const hasBalanced = AVAILABLE_MODELS.some(
      (m) => m.speedTier === "balanced",
    );
    const hasQuality = AVAILABLE_MODELS.some((m) => m.speedTier === "quality");

    expect(hasFast).toBe(true);
    expect(hasBalanced).toBe(true);
    expect(hasQuality).toBe(true);
  });
});

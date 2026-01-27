/**
 * Model metadata and configuration.
 * This file is safe for client-side use.
 */

/**
 * Supported LLM provider types.
 */
export type Provider = "openai" | "anthropic" | "google";

/**
 * Pricing tier indicator for model cost comparison.
 * - `$` - Budget/fast models
 * - `$$` - Mid-tier models
 * - `$$$` - Premium/quality models
 */
export type PricingTier = "$" | "$$" | "$$$";

/**
 * Speed tier indicator for model response characteristics.
 * - `fast` - Optimized for quick responses
 * - `balanced` - Good balance of speed and quality
 * - `quality` - Optimized for best output quality
 */
export type SpeedTier = "fast" | "balanced" | "quality";

/**
 * Feature tags for model capabilities.
 */
export type ModelFeature =
  | "fast"
  | "thinking"
  | "coding"
  | "vision"
  | "long-context";

/**
 * Configuration for a single AI model.
 */
export interface ModelConfig {
  /** Model identifier in format: provider/model-name */
  id: string;
  /** Human-readable display name */
  name: string;
  /** Provider (openai, anthropic, google) */
  provider: Provider;
  /** Cost indicator ($/$$/$$$) */
  pricingTier: PricingTier;
  /** Speed/quality tradeoff indicator */
  speedTier: SpeedTier;
  /** Short description of the model's strengths */
  description: string;
  /** Feature capabilities */
  features: ModelFeature[];
  /** Knowledge cutoff date (e.g., "Apr 2024") */
  knowledgeCutoff: string;
}

/**
 * All available AI models in the application.
 * Models are grouped by provider and sorted by pricing tier.
 */
export const AVAILABLE_MODELS: ModelConfig[] = [
  // OpenAI
  {
    id: "openai/gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "openai",
    pricingTier: "$",
    speedTier: "fast",
    description: "Fast and cost-effective for everyday tasks",
    features: ["fast"],
    knowledgeCutoff: "Oct 2023",
  },
  {
    id: "openai/gpt-4o",
    name: "GPT-4o",
    provider: "openai",
    pricingTier: "$$",
    speedTier: "balanced",
    description: "Balanced performance for complex reasoning",
    features: ["coding", "vision"],
    knowledgeCutoff: "Oct 2023",
  },
  {
    id: "openai/o1",
    name: "o1",
    provider: "openai",
    pricingTier: "$$$",
    speedTier: "quality",
    description: "Advanced reasoning with chain-of-thought",
    features: ["thinking", "coding"],
    knowledgeCutoff: "Oct 2023",
  },
  // Anthropic
  {
    id: "anthropic/claude-3-5-haiku-latest",
    name: "Claude 3.5 Haiku",
    provider: "anthropic",
    pricingTier: "$",
    speedTier: "fast",
    description: "Lightning fast responses for quick tasks",
    features: ["fast"],
    knowledgeCutoff: "Apr 2024",
  },
  {
    id: "anthropic/claude-sonnet-4-20250514",
    name: "Claude Sonnet 4",
    provider: "anthropic",
    pricingTier: "$$",
    speedTier: "balanced",
    description: "Excellent balance of speed and intelligence",
    features: ["coding", "thinking"],
    knowledgeCutoff: "Apr 2025",
  },
  {
    id: "anthropic/claude-opus-4-20250514",
    name: "Claude Opus 4",
    provider: "anthropic",
    pricingTier: "$$$",
    speedTier: "quality",
    description: "Most capable model for complex analysis",
    features: ["thinking", "coding", "long-context"],
    knowledgeCutoff: "Apr 2025",
  },
  // Google
  {
    id: "google/gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    provider: "google",
    pricingTier: "$",
    speedTier: "fast",
    description: "Ultra-fast multimodal responses",
    features: ["fast", "vision"],
    knowledgeCutoff: "Aug 2024",
  },
  {
    id: "google/gemini-2.5-pro-preview-05-06",
    name: "Gemini 2.5 Pro",
    provider: "google",
    pricingTier: "$$$",
    speedTier: "quality",
    description: "Advanced reasoning with huge context window",
    features: ["thinking", "long-context", "vision"],
    knowledgeCutoff: "Jan 2025",
  },
] as const;

/**
 * Default model used when no model is specified.
 */
export const DEFAULT_MODEL = "google/gemini-2.0-flash";

/**
 * Get the configuration metadata for a model by ID.
 *
 * @param modelId - The model identifier
 * @returns The model configuration, or undefined if not found
 */
export function getModelConfig(modelId: string): ModelConfig | undefined {
  return AVAILABLE_MODELS.find((model) => model.id === modelId);
}

/**
 * Check if a model ID is valid (exists in the available models list).
 *
 * @param modelId - The model identifier to validate
 * @returns True if the model exists in AVAILABLE_MODELS
 */
export function isValidModel(modelId: string): boolean {
  return AVAILABLE_MODELS.some((model) => model.id === modelId);
}

/**
 * Get all models for a specific provider.
 *
 * @param provider - The provider name
 * @returns Array of models for that provider
 */
export function getModelsByProvider(provider: Provider): ModelConfig[] {
  return AVAILABLE_MODELS.filter((model) => model.provider === provider);
}

/**
 * Get unique providers from available models.
 * Useful for grouping models by provider in picker UI.
 *
 * @returns Array of unique provider names
 */
export function getProviders(): Provider[] {
  return [...new Set(AVAILABLE_MODELS.map((m) => m.provider))];
}

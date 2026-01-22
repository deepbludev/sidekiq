import { gateway } from "./gateway";

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
  },
  {
    id: "openai/gpt-4o",
    name: "GPT-4o",
    provider: "openai",
    pricingTier: "$$",
    speedTier: "balanced",
  },
  {
    id: "openai/o1",
    name: "o1",
    provider: "openai",
    pricingTier: "$$$",
    speedTier: "quality",
  },
  // Anthropic
  {
    id: "anthropic/claude-3-5-haiku-latest",
    name: "Claude 3.5 Haiku",
    provider: "anthropic",
    pricingTier: "$",
    speedTier: "fast",
  },
  {
    id: "anthropic/claude-sonnet-4-20250514",
    name: "Claude Sonnet 4",
    provider: "anthropic",
    pricingTier: "$$",
    speedTier: "balanced",
  },
  {
    id: "anthropic/claude-opus-4-20250514",
    name: "Claude Opus 4",
    provider: "anthropic",
    pricingTier: "$$$",
    speedTier: "quality",
  },
  // Google
  {
    id: "google/gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    provider: "google",
    pricingTier: "$",
    speedTier: "fast",
  },
  {
    id: "google/gemini-2.5-pro-preview-05-06",
    name: "Gemini 2.5 Pro",
    provider: "google",
    pricingTier: "$$$",
    speedTier: "quality",
  },
] as const;

/**
 * Default model used when no model is specified.
 */
export const DEFAULT_MODEL = "anthropic/claude-sonnet-4-20250514";

/**
 * Get an AI model instance from the gateway by model ID.
 *
 * @param modelId - The model identifier (e.g., "anthropic/claude-sonnet-4-20250514")
 * @returns A model instance ready for use with streamText/generateText
 *
 * @example
 * ```ts
 * const model = getModel("anthropic/claude-sonnet-4-20250514");
 * const result = await streamText({ model, messages });
 * ```
 */
export function getModel(modelId: string) {
  return gateway(modelId);
}

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

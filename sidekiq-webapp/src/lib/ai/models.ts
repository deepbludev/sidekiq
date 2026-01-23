/**
 * AI Models configuration.
 *
 * This file re-exports metadata from models-metadata.ts (client-safe)
 * and adds server-only functions that use the gateway.
 *
 * Server components: Import everything from here.
 * Client components: Import from models-metadata.ts directly.
 */

import { gateway } from "./gateway";

// Re-export all metadata for server-side usage
export {
  type Provider,
  type PricingTier,
  type SpeedTier,
  type ModelFeature,
  type ModelConfig,
  AVAILABLE_MODELS,
  DEFAULT_MODEL,
  getModelConfig,
  isValidModel,
  getModelsByProvider,
  getProviders,
} from "./models-metadata";

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

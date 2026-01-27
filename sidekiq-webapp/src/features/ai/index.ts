/**
 * AI feature slice barrel export.
 *
 * Public API for the AI feature. External modules should import
 * from `@sidekiq/ai` or `@sidekiq/ai/*` paths.
 *
 * @module ai
 */

// Components
export { ModelPicker, type ModelPickerProps } from "./components/model-picker";

// Hooks
export { useModelSelection } from "./hooks/use-model-selection";

// API - Client-safe metadata (no server-only imports)
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
} from "./api/models-metadata";

// API - Server-only (import directly from @sidekiq/ai/api/models or @sidekiq/ai/api/gateway)
// gateway.ts, models.ts, title.ts are server-only and should be imported via deep paths

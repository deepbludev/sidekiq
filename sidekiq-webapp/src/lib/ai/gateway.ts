import "server-only";

import { createGateway } from "@ai-sdk/gateway";
import { env } from "@sidekiq/env";

/**
 * AI Gateway instance for unified access to multiple LLM providers.
 * Uses Vercel AI Gateway for provider abstraction with a single API key.
 *
 * @example
 * ```ts
 * import { gateway } from "@/lib/ai/gateway";
 * import { streamText } from "ai";
 *
 * const result = await streamText({
 *   model: gateway("anthropic/claude-sonnet-4-20250514"),
 *   messages: [{ role: "user", content: "Hello" }],
 * });
 * ```
 */
export const gateway = createGateway({
  apiKey: env.AI_GATEWAY_API_KEY,
});

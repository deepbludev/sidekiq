import { generateText } from "ai";
import { getModel } from "@sidekiq/lib/ai/models";

/** Budget model for title generation - fast and cheap */
const TITLE_MODEL = "openai/gpt-4o-mini";

/** Fallback title when generation fails */
const FALLBACK_TITLE = "New conversation";

/**
 * Generate a concise title for a conversation thread.
 *
 * Uses a budget model regardless of the thread's active model.
 * Returns a fallback title if generation fails.
 *
 * @param userMessage - First user message content
 * @param assistantMessage - First AI response content
 * @returns Promise<string> - 3-6 word title
 *
 * @example
 * ```ts
 * const title = await generateThreadTitle(
 *   "How do I optimize React performance?",
 *   "There are several strategies to optimize React..."
 * );
 * // Returns: "React Performance Optimization"
 * ```
 */
export async function generateThreadTitle(
  userMessage: string,
  assistantMessage: string,
): Promise<string> {
  try {
    const { text } = await generateText({
      model: getModel(TITLE_MODEL),
      prompt: `Generate a concise title (3-6 words) for this conversation.
Extract the key topic only. No quotes, no punctuation at end.
Do not start with "Help with" or similar phrases.

User: ${userMessage.slice(0, 500)}
Assistant: ${assistantMessage.slice(0, 500)}

Title:`,
      maxOutputTokens: 20,
    });

    // Clean up: remove quotes, trim, limit length
    const cleanTitle = text
      .trim()
      .replace(/^["']|["']$/g, "")
      .replace(/[.!?]$/, "")
      .slice(0, 100);

    return cleanTitle || FALLBACK_TITLE;
  } catch (error) {
    console.error("[Title Generation] Failed:", error);
    return FALLBACK_TITLE;
  }
}

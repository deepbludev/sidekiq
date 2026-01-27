/**
 * Avatar utility functions for Sidekiq.
 * Provides deterministic color generation from names and initials extraction.
 */

/**
 * Preset color palette for avatar backgrounds.
 * 12 distinct colors with good contrast for white text.
 */
export const AVATAR_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#f59e0b", // amber
  "#84cc16", // lime
  "#22c55e", // green
  "#14b8a6", // teal
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#6366f1", // indigo (default)
  "#8b5cf6", // violet
  "#a855f7", // purple
  "#ec4899", // pink
] as const;

export type AvatarColor = (typeof AVATAR_COLORS)[number];

/**
 * Generate a deterministic color from a name string.
 * Uses djb2 hash algorithm for consistent results across sessions.
 *
 * @param name - The name to generate color from
 * @returns Hex color string from AVATAR_COLORS palette
 *
 * @example
 * generateColorFromName("My Assistant") // "#6366f1"
 * generateColorFromName("Code Helper")  // "#22c55e"
 */
export function generateColorFromName(name: string): AvatarColor {
  let hash = 0;
  const normalizedName = name.toLowerCase().trim();

  for (let i = 0; i < normalizedName.length; i++) {
    // djb2 hash algorithm
    hash = normalizedName.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash; // Convert to 32-bit integer
  }

  const index = Math.abs(hash) % AVATAR_COLORS.length;
  // Type assertion is safe because index is always within bounds
  return AVATAR_COLORS[index]!;
}

/**
 * Extract initials from a name string.
 * - Single word: first 2 characters (e.g., "Assistant" -> "AS")
 * - Multiple words: first letter of first 2 words (e.g., "Code Helper" -> "CH")
 * - Empty/whitespace: returns "?"
 *
 * @param name - The name to extract initials from
 * @returns 1-2 character uppercase string
 *
 * @example
 * getInitials("My Assistant")  // "MA"
 * getInitials("CodeHelper")    // "CO"
 * getInitials("A")             // "A"
 */
export function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return "?";
  }

  const firstWord = words[0];
  if (words.length === 1 || !firstWord) {
    // Single word: take first 2 characters
    return (firstWord ?? "?").slice(0, 2).toUpperCase();
  }

  // Multiple words: first letter of first 2 words
  const secondWord = words[1];
  const firstChar = firstWord[0] ?? "";
  const secondChar = secondWord?.[0] ?? "";
  return (firstChar + secondChar).toUpperCase();
}

/**
 * Create default avatar configuration for a name.
 * Auto-generates color from name and uses initials type.
 *
 * @param name - The name to create avatar for
 * @returns Avatar configuration object
 */
export function createDefaultAvatar(name: string) {
  return {
    type: "initials" as const,
    color: generateColorFromName(name),
  };
}

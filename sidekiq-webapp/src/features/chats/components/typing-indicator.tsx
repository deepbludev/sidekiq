"use client";

/**
 * Typing indicator showing three pulsing dots while AI is thinking.
 *
 * Uses staggered animation delays for a wave-like effect.
 * Styled with semantic tokens for consistent theming.
 */
export function TypingIndicator() {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="border-border bg-card flex items-center gap-1 rounded-full border px-4 py-2.5">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="bg-muted-foreground h-2 w-2 animate-pulse rounded-full"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
        <span className="text-muted-foreground ml-2 text-sm">
          AI is thinking...
        </span>
      </div>
    </div>
  );
}

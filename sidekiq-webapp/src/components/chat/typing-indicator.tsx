"use client";

/**
 * Typing indicator showing three pulsing dots while AI is thinking.
 *
 * Uses staggered animation delays for a wave-like effect.
 */
export function TypingIndicator() {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex items-center gap-1 rounded-full border border-zinc-700/50 bg-zinc-800/50 px-4 py-2.5">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-2 w-2 animate-pulse rounded-full bg-zinc-400"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
        <span className="ml-2 text-sm text-zinc-400">AI is thinking...</span>
      </div>
    </div>
  );
}

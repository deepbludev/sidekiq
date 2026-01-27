"use client";

import { Sparkles, Code, Search, FileText } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@sidekiq/shared/lib/utils";

interface PromptCategory {
  name: string;
  icon: LucideIcon;
  prompts: string[];
}

const PROMPT_CATEGORIES: PromptCategory[] = [
  {
    name: "Creative",
    icon: Sparkles,
    prompts: [
      "Write a short story about a time traveler",
      "Help me brainstorm names for my startup",
      "Create a haiku about technology",
    ],
  },
  {
    name: "Coding",
    icon: Code,
    prompts: [
      "Explain async/await in JavaScript",
      "Write a React hook for local storage",
      "Help me debug this error message",
    ],
  },
  {
    name: "Research",
    icon: Search,
    prompts: [
      "Compare REST vs GraphQL APIs",
      "What are the benefits of TypeScript?",
      "Explain the CAP theorem simply",
    ],
  },
  {
    name: "Writing",
    icon: FileText,
    prompts: [
      "Help me write a professional email",
      "Summarize this article for me",
      "Proofread and improve this text",
    ],
  },
];

interface EmptyStateProps {
  /** Callback when user selects a prompt suggestion */
  onPromptSelect: (prompt: string) => void;
  /** Custom conversation starters from Sidekiq (replaces default categories) */
  conversationStarters?: string[];
  /** Sidekiq name to display in welcome message */
  sidekiqName?: string;
}

/**
 * Empty state shown when chat has no messages.
 * Displays categorized prompt suggestions to help users get started.
 * When a Sidekiq is active, shows its custom conversation starters instead.
 */
export function EmptyState({
  onPromptSelect,
  conversationStarters,
  sidekiqName,
}: EmptyStateProps) {
  // Render Sidekiq-specific empty state with conversation starters
  if (conversationStarters && conversationStarters.length > 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8">
        {/* Welcome message */}
        <div className="mb-8 text-center">
          <h2 className="text-foreground text-2xl font-semibold">
            Chat with {sidekiqName ?? "Sidekiq"}
          </h2>
          <p className="text-muted-foreground mt-2">
            Choose a starter or type your own message
          </p>
        </div>

        {/* Sidekiq conversation starters - simple list */}
        <div className="grid w-full max-w-xl grid-cols-1 gap-3">
          {conversationStarters.map((starter, index) => (
            <button
              key={index}
              onClick={() => onPromptSelect(starter)}
              className={cn(
                "border-border bg-card w-full rounded-lg border p-4 text-left text-sm",
                "text-foreground/80 hover:text-foreground",
                "hover:bg-accent",
                "transition-colors duration-200",
                "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
              )}
            >
              {starter}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Default empty state with categorized prompts
  return (
    <div className="flex h-full flex-col items-center justify-center p-8">
      {/* Welcome message */}
      <div className="mb-8 text-center">
        <h2 className="text-foreground text-2xl font-semibold">
          Start your first conversation
        </h2>
        <p className="text-muted-foreground mt-2">
          Choose a prompt below or type your own message
        </p>
      </div>

      {/* Categorized prompts */}
      <div className="grid w-full max-w-3xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {PROMPT_CATEGORIES.map((category) => (
          <div key={category.name} className="space-y-3">
            {/* Category header */}
            <div className="flex items-center gap-2">
              <category.icon className="text-muted-foreground h-4 w-4" />
              <span className="text-foreground text-sm font-medium">
                {category.name}
              </span>
            </div>

            {/* Prompt buttons */}
            <div className="space-y-2">
              {category.prompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => onPromptSelect(prompt)}
                  className={cn(
                    "border-border bg-card w-full rounded-lg border p-3 text-left text-sm",
                    "text-foreground/80 hover:text-foreground",
                    "hover:bg-accent",
                    "transition-colors duration-200",
                    "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
                  )}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

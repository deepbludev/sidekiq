"use client";

import { Sparkles, Code, Search, FileText } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@sidekiq/lib/utils";

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
}

/**
 * Empty state shown when chat has no messages.
 * Displays categorized prompt suggestions to help users get started.
 */
export function EmptyState({ onPromptSelect }: EmptyStateProps) {
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
                    "w-full rounded-lg p-3 text-left text-sm",
                    "glass-subtle",
                    "text-foreground/80 hover:text-foreground",
                    "hover:bg-white/60 dark:hover:bg-zinc-800/60",
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

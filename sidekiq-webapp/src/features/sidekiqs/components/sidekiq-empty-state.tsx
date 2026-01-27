import Link from "next/link";
import { Sparkles, Plus } from "lucide-react";

import { Button } from "@sidekiq/ui/button";

/**
 * Empty state for Sidekiq list.
 * Shows when user has no Sidekiqs with CTA to create first one.
 *
 * Follows the chat empty state pattern but tailored for Sidekiq creation.
 */
export function SidekiqEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="bg-primary/10 mb-4 rounded-full p-4">
        <Sparkles className="text-primary size-8" />
      </div>
      <h2 className="mb-2 text-xl font-semibold">Create your first Sidekiq</h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        Sidekiqs are custom AI assistants with their own personality,
        instructions, and conversation starters. Create one to get started.
      </p>
      <Button asChild>
        <Link href="/sidekiqs/new">
          <Plus className="mr-2 size-4" />
          Create Sidekiq
        </Link>
      </Button>
    </div>
  );
}

"use client";

import { Sparkles, MessageSquare } from "lucide-react";

import { Button } from "@sidekiq/components/ui/button";
import { Card, CardContent, CardHeader } from "@sidekiq/components/ui/card";
import { SidekiqAvatar } from "./sidekiq-avatar";

interface SidekiqPreviewProps {
  name: string;
  description: string;
  avatar: {
    type: "initials" | "emoji";
    color: string;
    emoji?: string;
  };
  conversationStarters: string[];
}

/**
 * Live preview panel for Sidekiq create/edit form.
 * Shows how the Sidekiq will appear in the UI.
 * Updates in real-time as user types.
 *
 * @param name - The Sidekiq name
 * @param description - The Sidekiq description
 * @param avatar - Avatar configuration
 * @param conversationStarters - Array of starter prompts
 */
export function SidekiqPreview({
  name,
  description,
  avatar,
  conversationStarters,
}: SidekiqPreviewProps) {
  const displayName = name.trim() || "Untitled Sidekiq";
  const displayDescription = description.trim() || "No description provided";

  return (
    <div className="space-y-6">
      {/* Preview header */}
      <div className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
        <Sparkles className="size-4" />
        Live Preview
      </div>

      {/* Card preview */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-4">
            <SidekiqAvatar name={displayName} avatar={avatar} size="lg" />
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-lg font-semibold">{displayName}</h3>
              <p className="text-muted-foreground line-clamp-2 text-sm">
                {displayDescription}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {conversationStarters.length > 0 && (
            <div className="space-y-2">
              <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                Conversation Starters
              </p>
              <div className="flex flex-wrap gap-2">
                {conversationStarters
                  .filter((s) => s.trim())
                  .slice(0, 4)
                  .map((starter, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      className="h-auto px-3 py-2 text-left whitespace-normal"
                      disabled
                    >
                      {starter.length > 50
                        ? `${starter.slice(0, 50)}...`
                        : starter}
                    </Button>
                  ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chat preview mockup */}
      <Card>
        <CardHeader className="pb-2">
          <div className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
            <MessageSquare className="size-4" />
            Chat Preview
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Mock user message */}
            <div className="flex justify-end">
              <div className="bg-primary text-primary-foreground max-w-[80%] rounded-2xl rounded-tr-sm px-4 py-2">
                <p className="text-sm">Hello! Can you help me?</p>
              </div>
            </div>
            {/* Mock assistant response */}
            <div className="flex gap-2">
              <SidekiqAvatar
                name={displayName}
                avatar={avatar}
                size="sm"
                className="mt-0.5"
              />
              <div className="bg-muted max-w-[80%] rounded-2xl rounded-tl-sm px-4 py-2">
                <p className="text-muted-foreground text-sm italic">
                  {displayName} will respond based on the instructions you
                  provide...
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

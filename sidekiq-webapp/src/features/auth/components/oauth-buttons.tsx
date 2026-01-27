"use client";

import { useState } from "react";
import { Github, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { authClient } from "@sidekiq/auth/api/client";
import { Button } from "@sidekiq/ui/button";

interface OAuthButtonsProps {
  callbackURL?: string;
}

/**
 * OAuth provider buttons for sign in/up pages
 */
export function OAuthButtons({ callbackURL = "/chat" }: OAuthButtonsProps) {
  const [isGitHubLoading, setIsGitHubLoading] = useState(false);

  async function handleGitHubSignIn() {
    setIsGitHubLoading(true);
    try {
      await authClient.signIn.social({
        provider: "github",
        callbackURL,
      });
    } catch {
      toast.error("Failed to sign in with GitHub");
      setIsGitHubLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="border-border w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card text-muted-foreground px-2">
            Or continue with
          </span>
        </div>
      </div>
      <Button
        variant="outline"
        type="button"
        disabled={isGitHubLoading}
        onClick={handleGitHubSignIn}
        className="border-border hover:bg-accent w-full bg-transparent"
      >
        {isGitHubLoading ? <Loader2 className="animate-spin" /> : <Github />}
        GitHub
      </Button>
    </div>
  );
}

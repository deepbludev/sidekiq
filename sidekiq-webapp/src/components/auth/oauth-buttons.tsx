"use client";

import { useState } from "react";
import { Github, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { authClient } from "@sidekiq/server/better-auth/client";
import { Button } from "@sidekiq/components/ui/button";

interface OAuthButtonsProps {
  callbackURL?: string;
}

/**
 * OAuth provider buttons for sign in/up pages
 */
export function OAuthButtons({
  callbackURL = "/dashboard",
}: OAuthButtonsProps) {
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
          <span className="w-full border-t border-zinc-700" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-zinc-900 px-2 text-zinc-400">
            Or continue with
          </span>
        </div>
      </div>
      <Button
        variant="outline"
        type="button"
        disabled={isGitHubLoading}
        onClick={handleGitHubSignIn}
        className="w-full border-zinc-700 bg-zinc-800 hover:bg-zinc-700"
      >
        {isGitHubLoading ? <Loader2 className="animate-spin" /> : <Github />}
        GitHub
      </Button>
    </div>
  );
}

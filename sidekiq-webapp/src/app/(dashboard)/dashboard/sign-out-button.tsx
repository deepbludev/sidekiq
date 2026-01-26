"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";

import { authClient } from "@sidekiq/server/better-auth/client";
import { Button } from "@sidekiq/components/ui/button";

export function SignOutButton() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleSignOut() {
    setIsLoading(true);
    try {
      await authClient.signOut();
      toast.success("Signed out successfully");
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Failed to sign out");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      onClick={handleSignOut}
      disabled={isLoading}
      className="border-border hover:bg-accent bg-transparent"
    >
      {isLoading ? <Loader2 className="animate-spin" /> : <LogOut />}
      Sign Out
    </Button>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { XCircle, Clock, AlertTriangle } from "lucide-react";

import { Button } from "@sidekiq/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@sidekiq/components/ui/card";
import { TeamAvatar } from "@sidekiq/components/team/team-avatar";
import { api } from "@sidekiq/shared/trpc/react";
import { toast } from "sonner";
import type { SidekiqAvatar } from "@sidekiq/shared/db/schema";

interface InviteData {
  teamName: string;
  teamAvatar: SidekiqAvatar;
  email: string;
  isExpired: boolean;
  expiresAt: Date;
}

interface InviteAcceptCardProps {
  token: string;
  invite: InviteData | null;
  isAuthenticated: boolean;
  userEmail?: string;
  signInUrl: string;
}

/**
 * Card component for accepting team invitations.
 * Handles various states: valid invite, expired, wrong email, not authenticated.
 *
 * @param token - The invite token from the URL
 * @param invite - The invite data (null if invalid/not found)
 * @param isAuthenticated - Whether the user is currently authenticated
 * @param userEmail - The authenticated user's email (if authenticated)
 * @param signInUrl - URL to redirect for sign-in with callback
 */
export function InviteAcceptCard({
  token,
  invite,
  isAuthenticated,
  userEmail,
  signInUrl,
}: InviteAcceptCardProps) {
  const router = useRouter();

  const acceptMutation = api.team.acceptInvite.useMutation({
    onSuccess: (data) => {
      toast.success(`Welcome to ${data.team.name}!`);
      router.push("/chat");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Invalid or not found invite
  if (!invite) {
    return (
      <Card className="mx-auto w-full max-w-md">
        <CardHeader className="text-center">
          <div className="bg-destructive/10 mx-auto mb-4 flex size-12 items-center justify-center rounded-full">
            <XCircle className="text-destructive size-6" />
          </div>
          <CardTitle>Invite Not Found</CardTitle>
          <CardDescription>
            This invitation link is invalid or has already been used.
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Button variant="outline" onClick={() => router.push("/chat")}>
            Go to Sidekiq
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Expired invite
  if (invite.isExpired) {
    return (
      <Card className="mx-auto w-full max-w-md">
        <CardHeader className="text-center">
          <div className="bg-muted mx-auto mb-4 flex size-12 items-center justify-center rounded-full">
            <Clock className="text-muted-foreground size-6" />
          </div>
          <CardTitle>Invite Expired</CardTitle>
          <CardDescription>
            This invitation to join <strong>{invite.teamName}</strong> has
            expired. Please ask the team owner to send a new invitation.
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Button variant="outline" onClick={() => router.push("/chat")}>
            Go to Sidekiq
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Not authenticated - need to sign in
  if (!isAuthenticated) {
    return (
      <Card className="mx-auto w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <TeamAvatar
              avatar={invite.teamAvatar}
              name={invite.teamName}
              size="xl"
            />
          </div>
          <CardTitle>Join {invite.teamName}</CardTitle>
          <CardDescription>
            You&apos;ve been invited to join <strong>{invite.teamName}</strong>{" "}
            on Sidekiq. Sign in or create an account to accept this invitation.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground text-center text-sm">
          <p>
            This invite is for: <strong>{invite.email}</strong>
          </p>
        </CardContent>
        <CardFooter className="flex-col gap-2">
          <Button className="w-full" asChild>
            <a href={signInUrl}>Sign In to Accept</a>
          </Button>
          <p className="text-muted-foreground text-xs">
            Don&apos;t have an account? You can create one after clicking sign
            in.
          </p>
        </CardFooter>
      </Card>
    );
  }

  // Wrong email - authenticated but email doesn't match
  if (userEmail && userEmail.toLowerCase() !== invite.email.toLowerCase()) {
    return (
      <Card className="mx-auto w-full max-w-md">
        <CardHeader className="text-center">
          <div className="bg-destructive/10 mx-auto mb-4 flex size-12 items-center justify-center rounded-full">
            <AlertTriangle className="text-destructive size-6" />
          </div>
          <CardTitle>Email Mismatch</CardTitle>
          <CardDescription>
            This invitation was sent to <strong>{invite.email}</strong>, but
            you&apos;re signed in as <strong>{userEmail}</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground text-center text-sm">
          <p>
            Please sign in with the correct email address to accept this
            invitation.
          </p>
        </CardContent>
        <CardFooter className="flex-col gap-2">
          <Button variant="outline" className="w-full" asChild>
            <a href={`/api/auth/signout?callbackUrl=/invite/${token}`}>
              Sign Out and Switch Account
            </a>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Valid invite - can accept
  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4">
          <TeamAvatar
            avatar={invite.teamAvatar}
            name={invite.teamName}
            size="xl"
          />
        </div>
        <CardTitle>Join {invite.teamName}</CardTitle>
        <CardDescription>
          You&apos;ve been invited to join <strong>{invite.teamName}</strong> on
          Sidekiq. Click below to accept and start collaborating with your team.
        </CardDescription>
      </CardHeader>
      <CardFooter className="flex-col gap-2">
        <Button
          className="w-full"
          onClick={() => acceptMutation.mutate({ token })}
          disabled={acceptMutation.isPending}
        >
          {acceptMutation.isPending ? "Joining..." : "Accept Invitation"}
        </Button>
        <Button
          variant="ghost"
          className="w-full"
          onClick={() => router.push("/chat")}
          disabled={acceptMutation.isPending}
        >
          Decline
        </Button>
      </CardFooter>
    </Card>
  );
}

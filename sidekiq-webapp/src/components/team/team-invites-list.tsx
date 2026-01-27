"use client";

import { formatDistanceToNow } from "date-fns";
import { Clock, MoreHorizontal, RefreshCw, Trash2 } from "lucide-react";

import { Button } from "@sidekiq/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@sidekiq/components/ui/dropdown-menu";
import { api } from "@sidekiq/shared/trpc/react";
import { toast } from "sonner";

interface PendingInvite {
  id: string;
  email: string;
  expiresAt: Date;
  createdAt: Date;
}

interface TeamInvitesListProps {
  /** Team ID for API calls */
  teamId: string;
  /** List of pending invites */
  invites: PendingInvite[];
}

/**
 * List of pending team invites with revoke and resend actions.
 * Displays expiration time and action dropdown for each invite.
 *
 * @param props - Component props
 */
export function TeamInvitesList({ teamId, invites }: TeamInvitesListProps) {
  const utils = api.useUtils();

  const revokeMutation = api.team.revokeInvite.useMutation({
    onSuccess: () => {
      void utils.team.listInvites.invalidate({ id: teamId });
      toast.success("Invite revoked");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const resendMutation = api.team.resendInvite.useMutation({
    onSuccess: (data) => {
      toast.success("Invite resent");
      // Copy new URL to clipboard
      void navigator.clipboard.writeText(data.inviteUrl);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  if (invites.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-muted-foreground text-sm font-medium">
        Pending Invites ({invites.length})
      </h3>

      <div className="space-y-2">
        {invites.map((invite) => (
          <div
            key={invite.id}
            className="flex items-center justify-between gap-4 rounded-lg border border-dashed p-3"
          >
            <div className="min-w-0">
              <p className="truncate font-medium">{invite.email}</p>
              <div className="text-muted-foreground flex items-center gap-1 text-xs">
                <Clock className="size-3" />
                <span>
                  Expires{" "}
                  {formatDistanceToNow(new Date(invite.expiresAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8 shrink-0">
                  <MoreHorizontal className="size-4" />
                  <span className="sr-only">Invite actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    resendMutation.mutate({ inviteId: invite.id });
                  }}
                  disabled={resendMutation.isPending}
                >
                  <RefreshCw className="mr-2 size-4" />
                  Resend Invite
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    revokeMutation.mutate({ inviteId: invite.id });
                  }}
                  disabled={revokeMutation.isPending}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 size-4" />
                  Revoke Invite
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>
    </div>
  );
}

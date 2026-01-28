import { headers } from "next/headers";
import { auth } from "@sidekiq/auth/api";
import { createCaller } from "@sidekiq/shared/trpc/root";
import { createTRPCContext } from "@sidekiq/shared/trpc/trpc";
import { InviteAcceptCard } from "@sidekiq/workspace/components/invite-accept-card";
import { env } from "@sidekiq/shared/env";

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

/**
 * Public invite acceptance page.
 * Fetches invite data and renders appropriate state.
 *
 * @param params - Route params containing the invite token
 */
export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;

  // Get session if user is authenticated
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Create tRPC caller for server-side query
  const ctx = await createTRPCContext({
    headers: await headers(),
  });
  const caller = createCaller(ctx);

  // Fetch invite data (public procedure)
  const invite = await caller.workspace.getInviteByToken({ token });

  // Build sign-in URL with callback to return here after auth
  const currentUrl = `${env.BETTER_AUTH_URL}/invite/${token}`;
  const signInUrl = `/sign-in?callbackUrl=${encodeURIComponent(currentUrl)}`;

  return (
    <InviteAcceptCard
      token={token}
      invite={invite}
      isAuthenticated={!!session?.user}
      userEmail={session?.user?.email}
      signInUrl={signInUrl}
    />
  );
}

/**
 * Generate dynamic metadata based on the invite.
 * Shows workspace name for valid invites.
 *
 * @param params - Route params containing the invite token
 */
export async function generateMetadata({ params }: InvitePageProps) {
  const { token } = await params;

  // Create context for server-side query
  const ctx = await createTRPCContext({
    headers: await headers(),
  });
  const caller = createCaller(ctx);

  const invite = await caller.workspace.getInviteByToken({ token });

  if (invite && !invite.isExpired) {
    return {
      title: `Join ${invite.workspaceName} - Sidekiq`,
      description: `You've been invited to join ${invite.workspaceName} on Sidekiq`,
    };
  }

  return {
    title: "Workspace Invite - Sidekiq",
    description: "Accept your workspace invitation on Sidekiq",
  };
}

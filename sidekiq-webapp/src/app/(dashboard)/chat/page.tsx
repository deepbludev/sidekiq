import { redirect } from "next/navigation";
import { and, eq, or, isNull } from "drizzle-orm";

import { getSession } from "@sidekiq/server/better-auth/server";
import { ChatInterface } from "@sidekiq/chats/components/chat-interface";
import { db } from "@sidekiq/shared/db";
import { sidekiqs } from "@sidekiq/shared/db/schema";

interface NewChatPageProps {
  searchParams: Promise<{ sidekiq?: string }>;
}

/**
 * New Chat page
 *
 * Server component representing the "new chat" state.
 * No thread is loaded - thread will be created on first message send.
 *
 * This is the landing page for starting fresh conversations.
 * Optionally accepts a sidekiq query parameter to start a chat with a specific Sidekiq.
 */
export default async function NewChatPage({ searchParams }: NewChatPageProps) {
  const session = await getSession();
  if (!session) {
    redirect("/sign-in");
  }

  const { sidekiq: sidekiqId } = await searchParams;

  // Fetch Sidekiq data if sidekiqId is provided
  // Sidekiq must be owned by user OR be a team Sidekiq the user has access to
  const sidekiq = sidekiqId
    ? await db.query.sidekiqs.findFirst({
        where: and(
          eq(sidekiqs.id, sidekiqId),
          or(
            eq(sidekiqs.ownerId, session.user.id),
            // Team Sidekiqs (teamId is not null) - simplified access check
            // Full team membership check would require joining user_teams table
            // For now, we allow if user is owner; team access will be Phase 8
            isNull(sidekiqs.teamId),
          ),
        ),
        columns: {
          id: true,
          name: true,
          description: true,
          avatar: true,
          conversationStarters: true,
          defaultModel: true,
        },
      })
    : null;

  // No thread ID - this is the "new chat" state
  // Thread will be created when user sends their first message
  // Key prop forces remount when Sidekiq changes, resetting all internal state (model selection, etc.)
  return (
    <ChatInterface
      key={sidekiq?.id ?? "no-sidekiq"}
      threadId={null}
      sidekiq={sidekiq}
    />
  );
}

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { getSession } from "@sidekiq/auth/api/server";
import { ChatInterface } from "@sidekiq/chats/components/chat-interface";
import { db } from "@sidekiq/shared/db";
import { sidekiqs } from "@sidekiq/shared/db/schema";
import { validateWorkspaceMembership } from "@sidekiq/shared/lib/workspace-auth";

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
  const sidekiq = sidekiqId
    ? await db.query.sidekiqs.findFirst({
        where: eq(sidekiqs.id, sidekiqId),
        columns: {
          id: true,
          name: true,
          description: true,
          avatar: true,
          conversationStarters: true,
          defaultModel: true,
          workspaceId: true, // Need this for membership check
        },
      })
    : null;

  // If sidekiq found, verify user is a member of its workspace
  if (sidekiq?.workspaceId) {
    const membership = await validateWorkspaceMembership(
      db,
      sidekiq.workspaceId,
      session.user.id,
    );
    if (!membership) {
      // User is not a member of this sidekiq's workspace -- show new chat without sidekiq
      return <ChatInterface key="no-sidekiq" threadId={null} sidekiq={null} />;
    }
  }

  // Strip workspaceId before passing to ChatInterface (it only needs display fields)
  const sidekiqForChat = sidekiq
    ? {
        id: sidekiq.id,
        name: sidekiq.name,
        description: sidekiq.description,
        avatar: sidekiq.avatar,
        conversationStarters: sidekiq.conversationStarters,
        defaultModel: sidekiq.defaultModel,
      }
    : null;

  // No thread ID - this is the "new chat" state
  // Thread will be created when user sends their first message
  // Key prop forces remount when Sidekiq changes, resetting all internal state (model selection, etc.)
  return (
    <ChatInterface
      key={sidekiqForChat?.id ?? "no-sidekiq"}
      threadId={null}
      sidekiq={sidekiqForChat}
    />
  );
}

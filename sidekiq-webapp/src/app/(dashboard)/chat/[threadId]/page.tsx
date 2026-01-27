import { redirect } from "next/navigation";
import { and, eq, asc } from "drizzle-orm";
import type { UIMessage } from "ai";
import type { Metadata } from "next";

import { getSession } from "@sidekiq/server/better-auth/server";
import { db } from "@sidekiq/server/db";
import { threads, messages } from "@sidekiq/server/db/schema";
import { ChatInterface } from "@sidekiq/components/chat/chat-interface";

/**
 * Props for the existing thread page.
 * Next.js 15 app router params are async/Promise-based.
 */
interface ThreadPageProps {
  params: Promise<{ threadId: string }>;
}

/**
 * Generate dynamic metadata for the thread page.
 * Sets browser tab title to "{thread title} - Sidekiq" or "New Chat - Sidekiq".
 *
 * Note: Next.js automatically deduplicates this query with the one in the page component
 * since they're within the same request.
 *
 * @param params - Route params containing threadId
 * @returns Metadata object with dynamic title
 */
export async function generateMetadata({
  params,
}: ThreadPageProps): Promise<Metadata> {
  const { threadId } = await params;

  const session = await getSession();
  if (!session) {
    return { title: "Sidekiq" };
  }

  const thread = await db.query.threads.findFirst({
    where: and(eq(threads.id, threadId), eq(threads.userId, session.user.id)),
    columns: { title: true },
  });

  const title = thread?.title ?? "New Chat";
  return { title: `${title} - Sidekiq` };
}

/**
 * Existing Thread page
 *
 * Server component that loads an existing thread with its messages.
 * Verifies ownership and redirects to /chat if thread not found or access denied.
 *
 * Archived threads can still be viewed (isArchived doesn't prevent viewing).
 */
export default async function ThreadPage({ params }: ThreadPageProps) {
  const { threadId } = await params;

  const session = await getSession();
  if (!session) {
    redirect("/sign-in");
  }

  // Load thread with ownership check and sidekiq relation for context restoration
  const thread = await db.query.threads.findFirst({
    where: and(eq(threads.id, threadId), eq(threads.userId, session.user.id)),
    columns: {
      id: true,
      title: true,
      isArchived: true,
      activeModel: true,
      sidekiqId: true,
    },
    with: {
      sidekiq: {
        columns: {
          id: true,
          name: true,
          description: true,
          avatar: true,
          conversationStarters: true,
          defaultModel: true,
        },
      },
    },
  });

  // Redirect to new chat if thread not found or doesn't belong to user
  if (!thread) {
    redirect("/chat");
  }

  // Load messages for the thread, ordered by creation time
  const threadMessages = await db.query.messages.findMany({
    where: eq(messages.threadId, threadId),
    orderBy: asc(messages.createdAt),
    columns: {
      id: true,
      role: true,
      content: true,
      createdAt: true,
      model: true,
      inputTokens: true,
      outputTokens: true,
      metadata: true,
    },
  });

  // Convert database messages to UIMessage format for ChatInterface
  const initialMessages: UIMessage[] = threadMessages.map((msg) => ({
    id: msg.id,
    role: msg.role,
    parts: [{ type: "text", text: msg.content }],
    createdAt: msg.createdAt,
    metadata: {
      model: msg.model,
      inputTokens: msg.inputTokens,
      outputTokens: msg.outputTokens,
      ...(msg.metadata && typeof msg.metadata === "object" ? msg.metadata : {}),
    },
  }));

  return (
    <ChatInterface
      threadId={thread.id}
      initialMessages={initialMessages}
      initialTitle={thread.title}
      initialModel={thread.activeModel}
      sidekiq={thread.sidekiq}
    />
  );
}

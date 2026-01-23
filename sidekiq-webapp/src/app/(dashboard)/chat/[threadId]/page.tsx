import { redirect } from "next/navigation";
import { and, eq, asc } from "drizzle-orm";
import type { UIMessage } from "ai";

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

  // Load thread with ownership check
  const thread = await db.query.threads.findFirst({
    where: and(eq(threads.id, threadId), eq(threads.userId, session.user.id)),
    columns: {
      id: true,
      title: true,
      isArchived: true,
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
    },
  });

  // Convert database messages to UIMessage format for ChatInterface
  const initialMessages: UIMessage[] = threadMessages.map((msg) => ({
    id: msg.id,
    role: msg.role,
    parts: [{ type: "text", text: msg.content }],
    createdAt: msg.createdAt,
  }));

  return (
    <ChatInterface threadId={thread.id} initialMessages={initialMessages} />
  );
}

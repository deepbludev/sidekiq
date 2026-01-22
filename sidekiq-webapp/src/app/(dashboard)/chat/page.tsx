import { redirect } from "next/navigation";
import { eq, desc } from "drizzle-orm";
import { nanoid } from "nanoid";

import { getSession } from "@sidekiq/server/better-auth/server";
import { db } from "@sidekiq/server/db";
import { threads } from "@sidekiq/server/db/schema";
import { ChatInterface } from "@sidekiq/components/chat/chat-interface";

/**
 * Chat page
 *
 * Server component that finds or creates a default thread for the user
 * and renders the ChatInterface client component.
 *
 * Thread management UI comes in Phase 3.
 */
export default async function ChatPage() {
  const session = await getSession();
  if (!session) {
    redirect("/sign-in");
  }

  // Find most recent thread or create one if none exists
  // Temporary approach - Thread creation UI comes in Phase 3
  let thread = await db.query.threads.findFirst({
    where: eq(threads.userId, session.user.id),
    orderBy: desc(threads.lastActivityAt),
  });

  if (!thread) {
    const threadId = nanoid();
    const [newThread] = await db
      .insert(threads)
      .values({
        id: threadId,
        userId: session.user.id,
        title: "New Chat",
        lastActivityAt: new Date(),
      })
      .returning();

    // newThread should always exist after insert, but TypeScript needs this check
    if (!newThread) {
      throw new Error("Failed to create thread");
    }
    thread = newThread;
  }

  return <ChatInterface threadId={thread.id} />;
}

import { redirect } from "next/navigation";

import { getSession } from "@sidekiq/server/better-auth/server";
import { ChatInterface } from "@sidekiq/components/chat/chat-interface";

/**
 * New Chat page
 *
 * Server component representing the "new chat" state.
 * No thread is loaded - thread will be created on first message send.
 *
 * This is the landing page for starting fresh conversations.
 */
export default async function NewChatPage() {
  const session = await getSession();
  if (!session) {
    redirect("/sign-in");
  }

  // No thread ID - this is the "new chat" state
  // Thread will be created when user sends their first message
  return <ChatInterface threadId={null} />;
}

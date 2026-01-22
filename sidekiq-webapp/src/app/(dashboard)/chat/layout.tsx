/**
 * Chat layout wrapper
 * Simple layout that provides full height flex container for chat interface.
 * Sidebar functionality will be added in Phase 5.
 */
export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="flex h-screen flex-col">{children}</div>;
}

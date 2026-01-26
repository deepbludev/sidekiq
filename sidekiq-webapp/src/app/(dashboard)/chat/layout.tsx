/**
 * Chat layout passthrough.
 *
 * The sidebar navigation has been moved to the dashboard layout
 * ((dashboard)/layout.tsx) so it is visible across all dashboard routes.
 * This layout now serves as a simple passthrough for chat pages.
 */
export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

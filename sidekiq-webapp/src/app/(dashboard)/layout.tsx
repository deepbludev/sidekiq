import { redirect } from "next/navigation";

import { getSession } from "@sidekiq/server/better-auth/server";

/**
 * Dashboard layout with full session validation
 * Provides a second layer of protection after middleware
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/sign-in");
  }

  return <div className="bg-background min-h-screen">{children}</div>;
}

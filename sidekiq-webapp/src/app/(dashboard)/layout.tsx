import { redirect } from "next/navigation";

import { getSession } from "@sidekiq/auth/api/server";
import { TooltipProvider } from "@sidekiq/ui/tooltip";
import { SidebarLayout } from "@sidekiq/shared/layout/sidebar-layout";
import { SidebarMobileTabs } from "@sidekiq/shared/layout/sidebar-mobile-tabs";

/**
 * Dashboard layout with two-tier sidebar navigation.
 *
 * Provides session validation (second layer after middleware) and the
 * shared navigation structure for all dashboard routes:
 *
 * - **Desktop (md+):** Two-tier sidebar (icon rail + panel) on the left
 * - **Mobile (<md):** Bottom tab bar with full-screen overlays
 * - **Main content:** `pb-14 md:pb-0` provides bottom padding on mobile
 *   to prevent content from being hidden behind the tab bar
 *
 * The sidebar is placed at this layout level (not per-route) so it
 * remains visible across all dashboard pages: chat, sidekiqs, settings.
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

  return (
    <TooltipProvider>
      <div className="bg-background flex h-screen">
        {/* Desktop: Two-tier sidebar (icon rail + panel) */}
        <div className="hidden md:flex">
          <SidebarLayout />
        </div>

        {/* Main content area */}
        <main className="flex-1 overflow-hidden pb-14 md:pb-0">{children}</main>

        {/* Mobile: Bottom tab bar */}
        <SidebarMobileTabs />
      </div>
    </TooltipProvider>
  );
}

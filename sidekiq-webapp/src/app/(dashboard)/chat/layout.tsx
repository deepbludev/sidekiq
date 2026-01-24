import { TooltipProvider } from "@sidekiq/components/ui/tooltip";
import { Sidebar, SidebarMobile } from "@sidekiq/components/sidebar";

/**
 * Chat layout with sidebar navigation.
 *
 * Desktop: Shows sidebar on left with collapsible toggle.
 * Mobile: Shows hamburger menu that opens sidebar in a drawer.
 *
 * Theme toggle is now in the sidebar footer dropdown (Settings/Theme/Logout).
 */
export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TooltipProvider>
      <div className="flex h-screen">
        {/* Desktop sidebar - hidden on mobile */}
        <div className="hidden md:flex">
          <Sidebar />
        </div>

        {/* Main content area */}
        <div className="flex flex-1 flex-col">
          {/* Mobile header with drawer trigger - hidden on desktop */}
          <header className="border-border/50 flex h-14 shrink-0 items-center gap-2 border-b px-4 md:hidden">
            <SidebarMobile>
              <Sidebar />
            </SidebarMobile>
            <span className="text-lg font-semibold">Sidekiq</span>
          </header>

          {/* Main content */}
          <main className="flex-1 overflow-hidden">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  );
}

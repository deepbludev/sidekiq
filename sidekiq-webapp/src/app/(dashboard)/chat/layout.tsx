import { TooltipProvider } from "@sidekiq/components/ui/tooltip";
import { ThemeToggle } from "@sidekiq/components/theme/theme-toggle";
import { Sidebar } from "@sidekiq/components/sidebar";

/**
 * Chat layout with sidebar navigation.
 *
 * Desktop: Shows sidebar on left with collapsible toggle.
 * Mobile: Shows simplified header with hamburger menu (drawer added in Plan 05-05).
 *
 * Theme toggle remains in mobile header until sidebar footer is implemented.
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
        <div className="hidden md:block">
          <Sidebar />
        </div>

        {/* Main content area */}
        <div className="flex flex-1 flex-col">
          {/* Mobile header - hidden on desktop */}
          <header className="border-border/50 flex h-14 shrink-0 items-center justify-between border-b px-4 md:hidden">
            {/* Mobile menu trigger placeholder - drawer added in Plan 05-05 */}
            <span className="text-lg font-semibold">Sidekiq</span>
            <ThemeToggle />
          </header>

          {/* Main content */}
          <main className="flex-1 overflow-hidden">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  );
}

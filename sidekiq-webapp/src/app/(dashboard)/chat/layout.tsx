import { TooltipProvider } from "@sidekiq/components/ui/tooltip";
import { ThemeToggle } from "@sidekiq/components/theme/theme-toggle";

/**
 * Chat layout with header containing theme toggle.
 * Sidebar will be added in Phase 5.
 */
export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TooltipProvider>
      <div className="flex h-screen flex-col">
        {/* Header */}
        <header className="border-border/50 flex h-14 shrink-0 items-center justify-between border-b px-4">
          <div className="flex items-center gap-2">
            {/* Logo/brand - placeholder for now */}
            <span className="text-lg font-semibold">Sidekiq</span>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </TooltipProvider>
  );
}

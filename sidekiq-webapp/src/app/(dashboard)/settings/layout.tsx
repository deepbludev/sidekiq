"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { User, Users } from "lucide-react";

import { cn } from "@sidekiq/lib/utils";

const settingsNav = [
  { href: "/settings", label: "Profile", icon: User, exact: true },
  { href: "/settings/teams", label: "Teams", icon: Users },
  // Future: { href: "/settings/billing", label: "Billing", icon: CreditCard },
];

/**
 * Settings layout with navigation sidebar.
 *
 * The two-tier sidebar is now always visible via the dashboard layout,
 * so the "Back to chat" button has been removed. The settings content
 * renders alongside the sidebar in the main content area.
 *
 * Shared across all settings pages.
 */
export default function SettingsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="mx-auto max-w-4xl overflow-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <div className="flex flex-col gap-8 md:flex-row">
        {/* Navigation */}
        <nav className="w-full space-y-1 md:w-48">
          {settingsNav.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Content */}
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}

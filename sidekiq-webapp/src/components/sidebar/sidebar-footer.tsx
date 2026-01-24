"use client";

import { LogOut, Settings, Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";

import { cn } from "@sidekiq/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@sidekiq/components/ui/dropdown-menu";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@sidekiq/components/ui/avatar";
import { Button } from "@sidekiq/components/ui/button";
import { authClient } from "@sidekiq/server/better-auth/client";

interface SidebarFooterProps {
  /** Whether the sidebar is in collapsed state */
  isCollapsed: boolean;
}

/**
 * Sidebar footer with user avatar and dropdown menu.
 *
 * Features:
 * - Displays user avatar with name/email (when expanded)
 * - Shows initials fallback when no avatar image
 * - Dropdown menu with:
 *   - Settings (placeholder, disabled)
 *   - Theme toggle submenu (Light/Dark/System)
 *   - Logout option
 *
 * @example
 * ```tsx
 * <SidebarFooter isCollapsed={false} />
 * ```
 */
export function SidebarFooter({ isCollapsed }: SidebarFooterProps) {
  const { theme, setTheme } = useTheme();
  const { data: session } = authClient.useSession();

  const user = session?.user;

  // Generate initials from name or email
  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() ??
    user?.email?.[0]?.toUpperCase() ??
    "U";

  /**
   * Sign out and redirect to sign-in page.
   */
  const handleSignOut = async () => {
    await authClient.signOut();
    window.location.href = "/sign-in";
  };

  return (
    <div className="border-border/50 border-t p-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start gap-2",
              isCollapsed && "justify-center px-0",
            )}
          >
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={user?.image ?? undefined}
                alt={user?.name ?? "User"}
              />
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <div className="flex flex-col items-start text-left">
                <span className="max-w-[140px] truncate text-sm font-medium">
                  {user?.name ?? "User"}
                </span>
                <span className="text-muted-foreground max-w-[140px] truncate text-xs">
                  {user?.email ?? ""}
                </span>
              </div>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="top" className="w-56">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* Settings - placeholder, no navigation yet */}
          <DropdownMenuItem disabled>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </DropdownMenuItem>

          {/* Theme submenu */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              {theme === "dark" ? (
                <Moon className="mr-2 h-4 w-4" />
              ) : theme === "light" ? (
                <Sun className="mr-2 h-4 w-4" />
              ) : (
                <Monitor className="mr-2 h-4 w-4" />
              )}
              Theme
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => setTheme("light")}>
                <Sun className="mr-2 h-4 w-4" />
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                <Moon className="mr-2 h-4 w-4" />
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                <Monitor className="mr-2 h-4 w-4" />
                System
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSeparator />

          {/* Logout */}
          <DropdownMenuItem onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

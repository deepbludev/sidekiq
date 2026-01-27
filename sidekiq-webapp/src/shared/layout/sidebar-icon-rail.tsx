"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  PenSquare,
  MessageSquare,
  Sparkles,
  Users,
  Settings,
  LogOut,
  Moon,
  Sun,
  Monitor,
} from "lucide-react";
import { useTheme } from "next-themes";
import type { LucideIcon } from "lucide-react";

import { cn } from "@sidekiq/shared/lib/utils";
import { getActiveFeature } from "@sidekiq/shared/lib/sidebar-utils";
import { Button } from "@sidekiq/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@sidekiq/ui/tooltip";
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
} from "@sidekiq/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@sidekiq/ui/avatar";
import { authClient } from "@sidekiq/auth/api/client";

/**
 * Props for the RailIcon sub-component.
 */
interface RailIconProps {
  /** Lucide icon component to render */
  icon: LucideIcon;
  /** Tooltip label text */
  label: string;
  /** Navigation href */
  href: string;
  /** Whether this rail icon is currently active */
  isActive: boolean;
  /** Callback when an already-active icon is clicked (re-click to toggle panel) */
  onReClick?: () => void;
}

/**
 * Individual icon button in the rail with tooltip and active state.
 *
 * Uses a Link for navigation when not active. When already active and
 * `onReClick` is provided, calls `onReClick` instead of navigating
 * (used for panel collapse toggle on re-click).
 *
 * @param props - Component props
 */
function RailIcon({
  icon: Icon,
  label,
  href,
  isActive,
  onReClick,
}: RailIconProps) {
  // When active and onReClick is provided, render a button instead of a link
  if (isActive && onReClick) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={onReClick}
            className={cn(
              "size-9 rounded-md",
              "text-sidebar-foreground/70 hover:text-sidebar-foreground",
              "bg-sidebar-accent text-sidebar-foreground",
            )}
          >
            <Icon className="size-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          asChild
          className={cn(
            "size-9 rounded-md",
            "text-sidebar-foreground/70 hover:text-sidebar-foreground",
            isActive && "bg-sidebar-accent text-sidebar-foreground",
          )}
        >
          <Link href={href}>
            <Icon className="size-5" />
          </Link>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

/**
 * User avatar button with dropdown menu for account actions.
 *
 * Displays the user's avatar image or initials fallback.
 * Dropdown includes Settings link, theme submenu (Light/Dark/System),
 * and logout option.
 */
function UserAvatarButton() {
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-9 rounded-md">
          <Avatar className="size-8">
            <AvatarImage
              src={user?.image ?? undefined}
              alt={user?.name ?? "User"}
            />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="right" className="w-56">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Settings */}
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings className="mr-2 size-4" />
            Settings
          </Link>
        </DropdownMenuItem>

        {/* Theme submenu */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            {theme === "dark" ? (
              <Moon className="mr-2 size-4" />
            ) : theme === "light" ? (
              <Sun className="mr-2 size-4" />
            ) : (
              <Monitor className="mr-2 size-4" />
            )}
            Theme
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onClick={() => setTheme("light")}>
              <Sun className="mr-2 size-4" />
              Light
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>
              <Moon className="mr-2 size-4" />
              Dark
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>
              <Monitor className="mr-2 size-4" />
              System
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        {/* Logout */}
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 size-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Primary icon rail for the two-tier sidebar navigation.
 *
 * Renders a thin vertical column (48px / w-12) with:
 * - **Top:** New Chat button (accent-colored)
 * - **Middle:** Navigation icons (Chats, Sidekiqs, Teams)
 * - **Bottom:** Settings icon and user avatar with dropdown
 *
 * Active state is derived from the current URL pathname via
 * `getActiveFeature()`, ensuring the icon rail and panel
 * stay synchronized without shared React state.
 *
 * @param props.onIconReClick - Callback when an already-active nav icon is clicked (panel toggle)
 *
 * @example
 * ```tsx
 * <div className="flex h-full">
 *   <SidebarIconRail onIconReClick={togglePanel} />
 *   <Separator orientation="vertical" />
 *   <SidebarPanel />
 * </div>
 * ```
 */
interface SidebarIconRailProps {
  /** Callback when an already-active icon is re-clicked (used for panel collapse toggle) */
  onIconReClick?: () => void;
}

export function SidebarIconRail({ onIconReClick }: SidebarIconRailProps) {
  const pathname = usePathname();
  const router = useRouter();
  const activeFeature = getActiveFeature(pathname ?? "/chat");

  return (
    <div className="bg-sidebar flex h-full w-12 shrink-0 flex-col items-center py-3">
      {/* Top: New Chat action */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/chat")}
            className="bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 size-8 rounded-md"
          >
            <PenSquare className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">New Chat</TooltipContent>
      </Tooltip>

      {/* Middle: Navigation icons */}
      <nav className="mt-4 flex flex-col items-center gap-1">
        <RailIcon
          icon={MessageSquare}
          label="Chats"
          href="/chat"
          isActive={activeFeature === "chats"}
          onReClick={onIconReClick}
        />
        <RailIcon
          icon={Sparkles}
          label="Sidekiqs"
          href="/sidekiqs"
          isActive={activeFeature === "sidekiqs"}
          onReClick={onIconReClick}
        />
        <RailIcon
          icon={Users}
          label="Teams"
          href="/settings/teams"
          isActive={activeFeature === "teams"}
          onReClick={onIconReClick}
        />
      </nav>

      {/* Flex spacer */}
      <div className="flex-1" />

      {/* Bottom: Settings + User avatar */}
      <div className="flex flex-col items-center gap-1">
        <RailIcon
          icon={Settings}
          label="Settings"
          href="/settings"
          isActive={
            (pathname?.startsWith("/settings") ?? false) &&
            activeFeature !== "teams"
          }
        />
        <UserAvatarButton />
      </div>
    </div>
  );
}

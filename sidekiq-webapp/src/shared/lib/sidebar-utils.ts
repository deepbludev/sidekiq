/**
 * Sidebar utility functions for route-based panel switching.
 *
 * Provides a centralized route-to-feature mapping used by both the icon rail
 * and the panel container to derive active state from the current URL pathname.
 *
 * @module sidebar-utils
 */

/**
 * Represents the active sidebar feature/panel.
 * Each feature maps to a specific panel in the two-tier sidebar.
 */
export type SidebarFeature = "chats" | "sidekiqs" | "teams";

/**
 * Determines the active sidebar feature from the current URL pathname.
 *
 * Settings navigates to a full page -- there is no sidebar feature for it.
 * The function checks routes in priority order to avoid conflicts
 * (e.g., /settings/teams must be checked before general /settings).
 *
 * @param pathname - Current URL pathname from usePathname()
 * @returns The active sidebar feature
 *
 * @example
 * ```ts
 * getActiveFeature("/chat")           // "chats"
 * getActiveFeature("/chat/abc123")    // "chats"
 * getActiveFeature("/sidekiqs")       // "sidekiqs"
 * getActiveFeature("/settings/teams") // "teams"
 * getActiveFeature("/settings")       // "chats" (default)
 * getActiveFeature("/")               // "chats" (default)
 * ```
 */
export function getActiveFeature(pathname: string): SidebarFeature {
  // Teams check MUST come before general /settings check
  if (pathname.startsWith("/settings/teams")) return "teams";
  if (pathname.startsWith("/sidekiqs")) return "sidekiqs";
  // Default: /chat, /chat/[id], /, /settings, and anything else
  return "chats";
}

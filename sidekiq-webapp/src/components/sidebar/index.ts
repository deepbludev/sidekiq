/**
 * Sidebar components barrel export.
 *
 * Layout shell components have moved to `src/shared/layout/` and are
 * re-exported here for backward compatibility during migration.
 *
 * Feature-specific panels remain here until they move to their
 * respective feature slices in Plans 03-05.
 *
 * @module sidebar
 */

// Layout shell (re-exported from shared/layout/)
export { SidebarLayout } from "@sidekiq/shared/layout/sidebar-layout";
export { SidebarIconRail } from "@sidekiq/shared/layout/sidebar-icon-rail";
export { SidebarPanel } from "@sidekiq/shared/layout/sidebar-panel";
export { SidebarMobileTabs } from "@sidekiq/shared/layout/sidebar-mobile-tabs";
export { SidebarMobileOverlay } from "@sidekiq/shared/layout/sidebar-mobile-overlay";
export { SidebarSearch } from "@sidekiq/shared/layout/sidebar-search";

// Feature-specific panels (move to feature slices in Plans 03-05)
export { SidebarPanelChats } from "./sidebar-panel-chats";
export { SidebarPanelSidekiqs } from "./sidebar-panel-sidekiqs";
export { SidebarPanelTeams } from "./sidebar-panel-teams";
export { SidebarThreadList } from "./sidebar-thread-list";
export { SidebarThreadGroup } from "./sidebar-thread-group";

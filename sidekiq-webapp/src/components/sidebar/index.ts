/**
 * Sidebar components barrel export.
 *
 * Two-tier sidebar architecture:
 * - SidebarLayout: Desktop layout with icon rail + contextual panel
 * - SidebarIconRail: Permanent 48px icon rail with navigation icons
 * - SidebarPanel: Contextual secondary panel that switches based on URL
 * - SidebarPanelChats: Chats panel with search and thread list
 * - SidebarPanelSidekiqs: Full Sidekiqs panel with search and grid
 * - SidebarPanelTeams: Teams panel with team list and create
 * - SidebarMobileTabs: Bottom tab bar for mobile viewports
 * - SidebarMobileOverlay: Full-screen overlay panels for mobile
 * - SidebarSearch: Search input component
 * - SidebarThreadList: Virtualized thread list
 * - SidebarThreadGroup: Date-grouped thread section header
 *
 * @module sidebar
 */
export { SidebarLayout } from "./sidebar-layout";
export { SidebarIconRail } from "./sidebar-icon-rail";
export { SidebarPanel } from "./sidebar-panel";
export { SidebarPanelChats } from "./sidebar-panel-chats";
export { SidebarPanelSidekiqs } from "./sidebar-panel-sidekiqs";
export { SidebarPanelTeams } from "./sidebar-panel-teams";
export { SidebarMobileTabs } from "./sidebar-mobile-tabs";
export { SidebarMobileOverlay } from "./sidebar-mobile-overlay";
export { SidebarSearch } from "./sidebar-search";
export { SidebarThreadList } from "./sidebar-thread-list";
export { SidebarThreadGroup } from "./sidebar-thread-group";

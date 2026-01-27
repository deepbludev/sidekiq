/**
 * Workspace feature slice barrel export.
 *
 * Public API for the workspace feature. External modules should import
 * from `@sidekiq/workspace` or `@sidekiq/workspace/*` paths.
 *
 * @module workspace
 */

// Components
export { DeleteTeamDialog } from "./components/delete-team-dialog";
export { InviteAcceptCard } from "./components/invite-accept-card";
export { InviteMemberDialog } from "./components/invite-member-dialog";
export { RemoveMemberDialog } from "./components/remove-member-dialog";
export { SidebarPanelTeams } from "./components/sidebar-panel-teams";
export { TeamAvatar } from "./components/team-avatar";
export { TeamCreateDialog } from "./components/team-create-dialog";
export { TeamEmptyState } from "./components/team-empty-state";
export { TeamForm, type TeamFormValues } from "./components/team-form";
export { TeamInvitesList } from "./components/team-invites-list";
export { TeamMemberList } from "./components/team-member-list";
export { TeamMemberRow } from "./components/team-member-row";
export { TeamSettingsSection } from "./components/team-settings-section";

// Hooks
export { useActiveTeam } from "./hooks/use-active-team";
export { useMemberSearch, type TeamMember } from "./hooks/use-member-search";

// Lib - Client-safe utilities
export {
  type TeamRole,
  canInvite,
  canRemoveMember,
  canChangeRole,
  canTransferOwnership,
  canDeleteTeam,
  canLeaveTeam,
  canRevokeInvite,
  canUpdateTeam,
  getRoleIcon,
  getRoleLabel,
} from "./lib/permissions";

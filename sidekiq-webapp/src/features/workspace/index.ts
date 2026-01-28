/**
 * Workspace feature slice barrel export.
 *
 * Public API for the workspace feature. External modules should import
 * from `@sidekiq/workspace` or `@sidekiq/workspace/*` paths.
 *
 * @module workspace
 */

// Components
export { DeleteWorkspaceDialog } from "./components/delete-workspace-dialog";
export { InviteAcceptCard } from "./components/invite-accept-card";
export { InviteMemberDialog } from "./components/invite-member-dialog";
export { RemoveMemberDialog } from "./components/remove-member-dialog";
export { SidebarPanelWorkspaces } from "./components/sidebar-panel-workspaces";
export { WorkspaceAvatar } from "./components/workspace-avatar";
export { WorkspaceCreateDialog } from "./components/workspace-create-dialog";
export { WorkspaceEmptyState } from "./components/workspace-empty-state";
export {
  WorkspaceForm,
  type WorkspaceFormValues,
} from "./components/workspace-form";
export { WorkspaceInvitesList } from "./components/workspace-invites-list";
export { WorkspaceMemberList } from "./components/workspace-member-list";
export { WorkspaceMemberRow } from "./components/workspace-member-row";
export { WorkspaceSettingsSection } from "./components/workspace-settings-section";

// Hooks
export { useActiveWorkspace } from "./hooks/use-active-workspace";
export {
  useMemberSearch,
  type WorkspaceMember,
} from "./hooks/use-member-search";

// Lib - Client-safe utilities
export {
  type WorkspaceRole,
  canInvite,
  canRemoveMember,
  canChangeRole,
  canTransferOwnership,
  canDeleteWorkspace,
  canLeaveWorkspace,
  canRevokeInvite,
  canUpdateWorkspace,
  getRoleIcon,
  getRoleLabel,
} from "./lib/permissions";

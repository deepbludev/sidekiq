/**
 * Sidekiqs feature slice barrel export.
 *
 * Public API for the sidekiqs feature. External modules should import
 * from `@sidekiq/sidekiqs` or `@sidekiq/sidekiqs/*` paths.
 *
 * @module sidekiqs
 */

// Components
export { AvatarPicker } from "./components/avatar-picker";
export { ColorPicker } from "./components/color-picker";
export { ConversationStarters } from "./components/conversation-starters";
export { DeleteSidekiqDialog } from "./components/delete-sidekiq-dialog";
export { EmojiPickerPopover } from "./components/emoji-picker-popover";
export { InstructionsEditor } from "./components/instructions-editor";
export { SidekiqAvatar } from "./components/sidekiq-avatar";
export { SidekiqCard } from "./components/sidekiq-card";
export { SidekiqEmptyState } from "./components/sidekiq-empty-state";
export { SidekiqForm } from "./components/sidekiq-form";
export { SidekiqIndicator } from "./components/sidekiq-indicator";
export { SidekiqList } from "./components/sidekiq-list";
export { SidekiqPicker } from "./components/sidekiq-picker";
export { SidekiqPreview } from "./components/sidekiq-preview";
export {
  StarterTemplates,
  SIDEKIQ_TEMPLATES,
  type SidekiqTemplate,
} from "./components/starter-templates";
export { SidebarPanelSidekiqs } from "./components/sidebar-panel-sidekiqs";

// Hooks
export { useSidekiqActions } from "./hooks/use-sidekiq-actions";

// Validations
export {
  sidekiqAvatarSchema,
  type SidekiqAvatar as SidekiqAvatarType,
  createSidekiqSchema,
  type CreateSidekiqInput,
  sidekiqFormSchema,
  type SidekiqFormValues,
  updateSidekiqSchema,
  type UpdateSidekiqInput,
  deleteSidekiqSchema,
  type DeleteSidekiqInput,
  toggleFavoriteSchema,
  type ToggleFavoriteInput,
  duplicateSidekiqSchema,
  type DuplicateSidekiqInput,
  listSidekiqsSchema,
  type ListSidekiqsInput,
  getSidekiqByIdSchema,
  type GetSidekiqByIdInput,
} from "./validations";

// Constants
export {
  type EmojiEntry,
  type EmojiCategory,
  EMOJI_CATEGORIES,
  ALL_EMOJI_ENTRIES,
  searchEmojis,
} from "./constants/emoji-data";

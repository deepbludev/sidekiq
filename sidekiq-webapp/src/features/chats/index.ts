/**
 * Chats feature slice barrel export.
 *
 * Public API for the chats feature. External modules should import
 * from `@sidekiq/chats` or `@sidekiq/chats/*` paths.
 *
 * @module chats
 */

// Components
export { ChatHeader } from "./components/chat-header";
export { ChatInput } from "./components/chat-input";
export { ChatInterface } from "./components/chat-interface";
export { ChatScrollAnchor } from "./components/chat-scroll-anchor";
export { DeleteThreadDialog } from "./components/delete-thread-dialog";
export { EmptyState } from "./components/empty-state";
export { MessageActions } from "./components/message-actions";
export { MessageContent } from "./components/message-content";
export {
  MessageItem,
  extractTextContent,
  formatTime,
  getCreatedAt,
} from "./components/message-item";
export { MessageList, type ModelSwitch } from "./components/message-list";
export { ModelSwitchHint } from "./components/model-switch-hint";
export { RenameThreadInput } from "./components/rename-thread-input";
export { ScrollToBottom } from "./components/scroll-to-bottom";
export { SidebarPanelChats } from "./components/sidebar-panel-chats";
export { SidebarThreadGroup } from "./components/sidebar-thread-group";
export { SidebarThreadList } from "./components/sidebar-thread-list";
export { ThreadContextMenu } from "./components/thread-context-menu";
export { ThreadItem } from "./components/thread-item";
export { TypingIndicator } from "./components/typing-indicator";

// Hooks
export { useAutoScroll } from "./hooks/use-auto-scroll";
export { useKeyboardShortcuts } from "./hooks/use-keyboard-shortcuts";
export { useScrollPosition } from "./hooks/use-scroll-position";
export { useThreadActions } from "./hooks/use-thread-actions";
export {
  useThreadSearch,
  type Thread,
  type UseThreadSearchResult,
} from "./hooks/use-thread-search";

"use client";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@sidekiq/components/ui/context-menu";
import {
  Pin,
  PinOff,
  Archive,
  ArchiveRestore,
  Pencil,
  Trash2,
  RefreshCw,
} from "lucide-react";

interface ThreadContextMenuProps {
  /** Child element that triggers the context menu on right-click */
  children: React.ReactNode;
  /** Whether the thread is pinned */
  isPinned: boolean;
  /** Whether the thread is archived */
  isArchived: boolean;
  /** Callback to toggle pin status */
  onTogglePin: () => void;
  /** Callback to archive the thread */
  onArchive: () => void;
  /** Callback to unarchive the thread */
  onUnarchive: () => void;
  /** Callback to start renaming the thread */
  onRename: () => void;
  /** Callback to delete the thread (opens confirmation dialog) */
  onDelete: () => void;
  /** Optional callback to regenerate the thread title */
  onRegenerateTitle?: () => void;
}

/**
 * Right-click context menu for thread actions.
 *
 * Provides all thread management options in a context menu format.
 * Shows different options based on thread state (archived, pinned).
 *
 * @example
 * ```tsx
 * <ThreadContextMenu
 *   isPinned={thread.isPinned}
 *   isArchived={thread.isArchived}
 *   onTogglePin={() => togglePin({ threadId: thread.id })}
 *   onArchive={() => archiveThread({ threadId: thread.id })}
 *   onUnarchive={() => unarchiveThread({ threadId: thread.id })}
 *   onRename={() => setIsRenaming(true)}
 *   onDelete={() => setShowDeleteDialog(true)}
 * >
 *   <div>Thread content</div>
 * </ThreadContextMenu>
 * ```
 */
export function ThreadContextMenu({
  children,
  isPinned,
  isArchived,
  onTogglePin,
  onArchive,
  onUnarchive,
  onRename,
  onDelete,
  onRegenerateTitle,
}: ThreadContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem onClick={onTogglePin}>
          {isPinned ? (
            <>
              <PinOff className="mr-2 h-4 w-4" />
              Unpin
            </>
          ) : (
            <>
              <Pin className="mr-2 h-4 w-4" />
              Pin
            </>
          )}
        </ContextMenuItem>
        <ContextMenuItem onClick={onRename}>
          <Pencil className="mr-2 h-4 w-4" />
          Rename
        </ContextMenuItem>
        {onRegenerateTitle && (
          <ContextMenuItem onClick={onRegenerateTitle}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Regenerate title
          </ContextMenuItem>
        )}
        <ContextMenuSeparator />
        {isArchived ? (
          <ContextMenuItem onClick={onUnarchive}>
            <ArchiveRestore className="mr-2 h-4 w-4" />
            Restore
          </ContextMenuItem>
        ) : (
          <ContextMenuItem onClick={onArchive}>
            <Archive className="mr-2 h-4 w-4" />
            Archive
          </ContextMenuItem>
        )}
        <ContextMenuSeparator />
        <ContextMenuItem
          onClick={onDelete}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

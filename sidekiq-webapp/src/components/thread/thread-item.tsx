"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pin, Archive, MoreHorizontal } from "lucide-react";
import { cn } from "@sidekiq/shared/lib/utils";
import { ThreadContextMenu } from "./thread-context-menu";
import { DeleteThreadDialog } from "./delete-thread-dialog";
import { RenameThreadInput } from "./rename-thread-input";
import { useThreadActions } from "@sidekiq/hooks/use-thread-actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@sidekiq/components/ui/dropdown-menu";
import { Button } from "@sidekiq/components/ui/button";
import { SidekiqAvatar } from "@sidekiq/components/sidekiq/sidekiq-avatar";
import type { SidekiqAvatar as SidekiqAvatarType } from "@sidekiq/shared/db/schema";

interface Thread {
  id: string;
  title: string | null;
  isPinned: boolean;
  isArchived: boolean;
  lastActivityAt: Date;
  messageCount: number;
  /** Foreign key to sidekiqs table (null for regular threads) */
  sidekiqId?: string | null;
  /** Preserved name if the Sidekiq was deleted */
  deletedSidekiqName?: string | null;
  /** Related Sidekiq data (null if regular thread or Sidekiq deleted) */
  sidekiq?: {
    id: string;
    name: string;
    avatar: SidekiqAvatarType;
  } | null;
}

interface ThreadItemProps {
  /** The thread to display */
  thread: Thread;
  /** Whether this is the currently active thread */
  isActive: boolean;
  /** ID of the active thread (for navigation after delete/archive) */
  activeThreadId?: string | null;
}

/**
 * Thread list item with hover actions and context menu.
 *
 * Displays thread title with pin/archive indicators.
 * Shows action buttons on hover and supports right-click context menu.
 * Inline rename via title click.
 *
 * @example
 * ```tsx
 * <ThreadItem
 *   thread={thread}
 *   isActive={currentThreadId === thread.id}
 *   activeThreadId={currentThreadId}
 * />
 * ```
 */
export function ThreadItem({
  thread,
  isActive,
  activeThreadId,
}: ThreadItemProps) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);

  const {
    deleteThread,
    archiveThread,
    unarchiveThread,
    togglePin,
    renameThread,
    isDeleting,
  } = useThreadActions({ activeThreadId });

  const handleClick = () => {
    if (!isRenaming) {
      router.push(`/chat/${thread.id}`);
    }
  };

  const handleRename = (newTitle: string) => {
    renameThread({ threadId: thread.id, title: newTitle });
    setIsRenaming(false);
  };

  const handleDelete = () => {
    deleteThread({ threadId: thread.id });
    setShowDeleteDialog(false);
  };

  return (
    <>
      <ThreadContextMenu
        isPinned={thread.isPinned}
        isArchived={thread.isArchived}
        onTogglePin={() => togglePin({ threadId: thread.id })}
        onArchive={() => archiveThread({ threadId: thread.id })}
        onUnarchive={() => unarchiveThread({ threadId: thread.id })}
        onRename={() => setIsRenaming(true)}
        onDelete={() => setShowDeleteDialog(true)}
      >
        <div
          role="button"
          tabIndex={0}
          onClick={handleClick}
          onKeyDown={(e) => e.key === "Enter" && handleClick()}
          className={cn(
            "group flex items-center gap-2 rounded-md px-3 py-2",
            "cursor-pointer transition-colors",
            "hover:bg-sidebar-accent/50",
            isActive && "bg-sidebar-accent border-sidebar-primary border-l-2",
            thread.isArchived && "opacity-60",
          )}
        >
          {/* Sidekiq avatar or pin indicator */}
          {thread.sidekiq ? (
            <SidekiqAvatar
              name={thread.sidekiq.name}
              avatar={thread.sidekiq.avatar}
              size="sm"
              className="size-5 shrink-0"
            />
          ) : thread.deletedSidekiqName ? (
            // Sidekiq was deleted - show placeholder
            <div className="bg-muted text-muted-foreground flex size-5 shrink-0 items-center justify-center rounded-full text-[10px]">
              ?
            </div>
          ) : thread.isPinned ? (
            <Pin className="text-muted-foreground h-3 w-3 shrink-0" />
          ) : null}

          {/* Title or rename input */}
          <div className="min-w-0 flex-1">
            {isRenaming ? (
              <RenameThreadInput
                initialTitle={thread.title}
                onRename={handleRename}
                onCancel={() => setIsRenaming(false)}
              />
            ) : (
              <>
                <span className="text-sidebar-foreground block truncate text-sm">
                  {thread.title ?? "New conversation"}
                </span>
                {/* Sidekiq subtitle */}
                {thread.sidekiq ? (
                  <span className="text-muted-foreground block truncate text-xs">
                    with {thread.sidekiq.name}
                  </span>
                ) : thread.deletedSidekiqName ? (
                  <span className="text-muted-foreground/60 block truncate text-xs italic">
                    [Sidekiq deleted]
                  </span>
                ) : null}
              </>
            )}
          </div>

          {/* Archive indicator */}
          {thread.isArchived && (
            <Archive className="text-muted-foreground h-3 w-3 shrink-0" />
          )}

          {/* Hover actions - only show when not renaming */}
          {!isRenaming && (
            <div
              className={cn(
                "flex items-center gap-1",
                "opacity-0 transition-opacity group-hover:opacity-100",
              )}
            >
              {/* Quick pin toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation();
                  togglePin({ threadId: thread.id });
                }}
              >
                {thread.isPinned ? (
                  <Pin className="h-3 w-3 fill-current" />
                ) : (
                  <Pin className="h-3 w-3" />
                )}
              </Button>

              {/* More actions dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem onClick={() => setIsRenaming(true)}>
                    Rename
                  </DropdownMenuItem>
                  {thread.isArchived ? (
                    <DropdownMenuItem
                      onClick={() => unarchiveThread({ threadId: thread.id })}
                    >
                      Restore
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      onClick={() => archiveThread({ threadId: thread.id })}
                    >
                      Archive
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </ThreadContextMenu>

      <DeleteThreadDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        threadTitle={thread.title}
        isDeleting={isDeleting}
      />
    </>
  );
}

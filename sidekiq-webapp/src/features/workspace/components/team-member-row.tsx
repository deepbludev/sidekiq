"use client";

import { useState } from "react";
import {
  Crown,
  Shield,
  MoreHorizontal,
  UserMinus,
  ArrowUpDown,
  LogOut,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@sidekiq/ui/avatar";
import { Button } from "@sidekiq/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@sidekiq/ui/dropdown-menu";
import { Badge } from "@sidekiq/ui/badge";
import {
  canRemoveMember,
  canChangeRole,
  canLeaveTeam,
  getRoleLabel,
  type TeamRole,
} from "@sidekiq/workspace/lib/permissions";
import type { TeamMember } from "@sidekiq/workspace/hooks/use-member-search";

interface TeamMemberRowProps {
  /** The team member to display */
  member: TeamMember;
  /** Current user's role in the team */
  currentUserRole: TeamRole;
  /** Current user's ID */
  currentUserId: string;
  /** Callback when remove action is triggered */
  onRemove: (userId: string) => void;
  /** Callback when role change action is triggered */
  onChangeRole: (userId: string, newRole: "admin" | "member") => void;
  /** Callback when leave action is triggered */
  onLeave: () => void;
  /** Optional function to highlight matching text during search */
  highlightMatch?: (text: string) => React.ReactNode;
}

/**
 * Single row in the team member list.
 * Displays user info, role badge, and action menu based on permissions.
 *
 * Per CONTEXT.md:
 * - Crown icon for owner
 * - Shield icon for admin
 * - Actions via three-dot dropdown menu
 *
 * @param props - Component props
 */
export function TeamMemberRow({
  member,
  currentUserRole,
  currentUserId,
  onRemove,
  onChangeRole,
  onLeave,
  highlightMatch = (text) => text,
}: TeamMemberRowProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isSelf = member.userId === currentUserId;
  const canRemove = canRemoveMember(currentUserRole, member.role, isSelf);
  const canChange = canChangeRole(
    currentUserRole,
    member.role,
    member.role === "admin" ? "member" : "admin",
  );
  const canSelfLeave = isSelf && canLeaveTeam(currentUserRole);

  const hasActions = canRemove || canChange || canSelfLeave;

  /**
   * Get initials for avatar fallback.
   * @param name - Full name
   * @returns Two-character initials
   */
  const getInitials = (name: string): string => {
    const words = name.trim().split(/\s+/);
    const first = words[0];
    const second = words[1];
    if (words.length >= 2 && first?.[0] && second?.[0]) {
      return (first[0] + second[0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const RoleIcon =
    member.role === "owner" ? Crown : member.role === "admin" ? Shield : null;

  return (
    <div className="hover:bg-accent/50 flex items-center justify-between gap-4 rounded-md px-3 py-2 transition-colors">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar className="size-10 shrink-0">
          <AvatarImage
            src={member.user.image ?? undefined}
            alt={member.user.name}
          />
          <AvatarFallback>{getInitials(member.user.name)}</AvatarFallback>
        </Avatar>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-foreground truncate text-sm font-medium">
              {highlightMatch(member.user.name)}
            </span>
            {isSelf && (
              <Badge variant="secondary" className="text-xs">
                You
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground truncate text-sm">
            {highlightMatch(member.user.email)}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <div className="flex items-center gap-1.5">
          {RoleIcon && (
            <RoleIcon
              className={`size-4 ${
                member.role === "owner"
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            />
          )}
          <span className="text-muted-foreground text-sm">
            {getRoleLabel(member.role)}
          </span>
        </div>

        {hasActions && (
          <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <MoreHorizontal className="size-4" />
                <span className="sr-only">Member actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canChange && (
                <DropdownMenuItem
                  onClick={() => {
                    onChangeRole(
                      member.userId,
                      member.role === "admin" ? "member" : "admin",
                    );
                    setIsMenuOpen(false);
                  }}
                >
                  <ArrowUpDown className="mr-2 size-4" />
                  {member.role === "admin"
                    ? "Demote to Member"
                    : "Promote to Admin"}
                </DropdownMenuItem>
              )}
              {canRemove && (
                <>
                  {canChange && <DropdownMenuSeparator />}
                  <DropdownMenuItem
                    onClick={() => {
                      onRemove(member.userId);
                      setIsMenuOpen(false);
                    }}
                    className="text-destructive focus:text-destructive"
                  >
                    <UserMinus className="mr-2 size-4" />
                    Remove from Team
                  </DropdownMenuItem>
                </>
              )}
              {canSelfLeave && (
                <>
                  {(canChange || canRemove) && <DropdownMenuSeparator />}
                  <DropdownMenuItem
                    onClick={() => {
                      onLeave();
                      setIsMenuOpen(false);
                    }}
                    className="text-destructive focus:text-destructive"
                  >
                    <LogOut className="mr-2 size-4" />
                    Leave Team
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}

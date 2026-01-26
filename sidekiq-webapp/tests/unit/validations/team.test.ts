import { describe, expect, it } from "vitest";
import {
  teamAvatarSchema,
  createTeamSchema,
  updateTeamSchema,
  deleteTeamSchema,
  inviteMemberSchema,
  acceptInviteSchema,
  revokeInviteSchema,
  resendInviteSchema,
  removeMemberSchema,
  changeRoleSchema,
  transferOwnershipSchema,
  leaveTeamSchema,
  getTeamByIdSchema,
} from "@sidekiq/lib/validations/team";

describe("teamAvatarSchema", () => {
  it("should accept valid initials type (same as sidekiqAvatarSchema)", () => {
    const result = teamAvatarSchema.safeParse({
      type: "initials",
      color: "#6366f1",
    });
    expect(result.success).toBe(true);
  });

  it("should accept valid emoji type (same as sidekiqAvatarSchema)", () => {
    const result = teamAvatarSchema.safeParse({
      type: "emoji",
      color: "#ef4444",
      emoji: "🚀",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid hex color", () => {
    const result = teamAvatarSchema.safeParse({
      type: "initials",
      color: "invalid",
    });
    expect(result.success).toBe(false);
  });
});

describe("createTeamSchema", () => {
  it("should accept valid name with default avatar", () => {
    const result = createTeamSchema.safeParse({
      name: "Engineering",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.avatar).toEqual({
        type: "initials",
        color: "#6366f1",
      });
    }
  });

  it("should accept valid name with custom avatar", () => {
    const result = createTeamSchema.safeParse({
      name: "Design Team",
      avatar: { type: "emoji", color: "#22c55e", emoji: "🎨" },
    });
    expect(result.success).toBe(true);
  });

  it("should accept name at minimum boundary (1 char)", () => {
    const result = createTeamSchema.safeParse({ name: "A" });
    expect(result.success).toBe(true);
  });

  it("should accept name at maximum boundary (100 chars)", () => {
    const result = createTeamSchema.safeParse({ name: "A".repeat(100) });
    expect(result.success).toBe(true);
  });

  it("should reject empty name", () => {
    const result = createTeamSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Team name is required");
    }
  });

  it("should reject name exceeding 100 characters", () => {
    const result = createTeamSchema.safeParse({ name: "A".repeat(101) });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Team name must be at most 100 characters",
      );
    }
  });

  it("should apply default avatar when not provided", () => {
    const result = createTeamSchema.safeParse({ name: "Test Team" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.avatar).toEqual({
        type: "initials",
        color: "#6366f1",
      });
    }
  });
});

describe("updateTeamSchema", () => {
  it("should accept valid id with name update", () => {
    const result = updateTeamSchema.safeParse({
      id: "team-123",
      name: "New Name",
    });
    expect(result.success).toBe(true);
  });

  it("should accept id only (no other fields)", () => {
    const result = updateTeamSchema.safeParse({ id: "team-123" });
    expect(result.success).toBe(true);
  });

  it("should accept id with avatar update", () => {
    const result = updateTeamSchema.safeParse({
      id: "team-123",
      avatar: { type: "emoji", color: "#ef4444", emoji: "🎯" },
    });
    expect(result.success).toBe(true);
  });

  it("should reject missing id", () => {
    const result = updateTeamSchema.safeParse({ name: "New Name" });
    expect(result.success).toBe(false);
  });

  it("should reject empty id", () => {
    const result = updateTeamSchema.safeParse({
      id: "",
      name: "New Name",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Team ID is required");
    }
  });
});

describe("deleteTeamSchema", () => {
  it("should accept valid id", () => {
    const result = deleteTeamSchema.safeParse({ id: "team-123" });
    expect(result.success).toBe(true);
  });

  it("should reject empty id", () => {
    const result = deleteTeamSchema.safeParse({ id: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Team ID is required");
    }
  });

  it("should reject missing id", () => {
    const result = deleteTeamSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("inviteMemberSchema", () => {
  it("should accept valid teamId, email, and sendEmail", () => {
    const result = inviteMemberSchema.safeParse({
      teamId: "team-123",
      email: "user@example.com",
      sendEmail: true,
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid email", () => {
    const result = inviteMemberSchema.safeParse({
      teamId: "team-123",
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Invalid email address");
    }
  });

  it("should reject empty teamId", () => {
    const result = inviteMemberSchema.safeParse({
      teamId: "",
      email: "user@example.com",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Team ID is required");
    }
  });

  it("should transform email to lowercase", () => {
    const result = inviteMemberSchema.safeParse({
      teamId: "team-123",
      email: "TEST@EXAMPLE.COM",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("test@example.com");
    }
  });

  it("should default sendEmail to true", () => {
    const result = inviteMemberSchema.safeParse({
      teamId: "team-123",
      email: "user@example.com",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sendEmail).toBe(true);
    }
  });

  it("should accept sendEmail=false", () => {
    const result = inviteMemberSchema.safeParse({
      teamId: "team-123",
      email: "user@example.com",
      sendEmail: false,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sendEmail).toBe(false);
    }
  });
});

describe("acceptInviteSchema", () => {
  it("should accept valid token", () => {
    const result = acceptInviteSchema.safeParse({ token: "abc-123-def" });
    expect(result.success).toBe(true);
  });

  it("should reject empty token", () => {
    const result = acceptInviteSchema.safeParse({ token: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Invite token is required");
    }
  });

  it("should reject missing token", () => {
    const result = acceptInviteSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("revokeInviteSchema", () => {
  it("should accept valid inviteId", () => {
    const result = revokeInviteSchema.safeParse({ inviteId: "invite-123" });
    expect(result.success).toBe(true);
  });

  it("should reject empty inviteId", () => {
    const result = revokeInviteSchema.safeParse({ inviteId: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Invite ID is required");
    }
  });

  it("should reject missing inviteId", () => {
    const result = revokeInviteSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("resendInviteSchema", () => {
  it("should accept valid inviteId", () => {
    const result = resendInviteSchema.safeParse({ inviteId: "invite-123" });
    expect(result.success).toBe(true);
  });

  it("should reject empty inviteId", () => {
    const result = resendInviteSchema.safeParse({ inviteId: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Invite ID is required");
    }
  });

  it("should reject missing inviteId", () => {
    const result = resendInviteSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("removeMemberSchema", () => {
  it("should accept valid teamId and userId", () => {
    const result = removeMemberSchema.safeParse({
      teamId: "team-123",
      userId: "user-456",
    });
    expect(result.success).toBe(true);
  });

  it("should reject empty teamId", () => {
    const result = removeMemberSchema.safeParse({
      teamId: "",
      userId: "user-456",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Team ID is required");
    }
  });

  it("should reject empty userId", () => {
    const result = removeMemberSchema.safeParse({
      teamId: "team-123",
      userId: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("User ID is required");
    }
  });

  it("should reject missing teamId", () => {
    const result = removeMemberSchema.safeParse({ userId: "user-456" });
    expect(result.success).toBe(false);
  });

  it("should reject missing userId", () => {
    const result = removeMemberSchema.safeParse({ teamId: "team-123" });
    expect(result.success).toBe(false);
  });
});

describe("changeRoleSchema", () => {
  it("should accept valid input with newRole=admin", () => {
    const result = changeRoleSchema.safeParse({
      teamId: "team-123",
      userId: "user-456",
      newRole: "admin",
    });
    expect(result.success).toBe(true);
  });

  it("should accept valid input with newRole=member", () => {
    const result = changeRoleSchema.safeParse({
      teamId: "team-123",
      userId: "user-456",
      newRole: "member",
    });
    expect(result.success).toBe(true);
  });

  it("should reject newRole=owner (not in enum)", () => {
    const result = changeRoleSchema.safeParse({
      teamId: "team-123",
      userId: "user-456",
      newRole: "owner",
    });
    expect(result.success).toBe(false);
  });

  it("should reject missing newRole", () => {
    const result = changeRoleSchema.safeParse({
      teamId: "team-123",
      userId: "user-456",
    });
    expect(result.success).toBe(false);
  });

  it("should reject invalid newRole value", () => {
    const result = changeRoleSchema.safeParse({
      teamId: "team-123",
      userId: "user-456",
      newRole: "superadmin",
    });
    expect(result.success).toBe(false);
  });

  it("should reject empty teamId", () => {
    const result = changeRoleSchema.safeParse({
      teamId: "",
      userId: "user-456",
      newRole: "admin",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Team ID is required");
    }
  });

  it("should reject empty userId", () => {
    const result = changeRoleSchema.safeParse({
      teamId: "team-123",
      userId: "",
      newRole: "admin",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("User ID is required");
    }
  });
});

describe("transferOwnershipSchema", () => {
  it("should accept valid teamId and newOwnerId", () => {
    const result = transferOwnershipSchema.safeParse({
      teamId: "team-123",
      newOwnerId: "user-456",
    });
    expect(result.success).toBe(true);
  });

  it("should reject empty teamId", () => {
    const result = transferOwnershipSchema.safeParse({
      teamId: "",
      newOwnerId: "user-456",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Team ID is required");
    }
  });

  it("should reject empty newOwnerId", () => {
    const result = transferOwnershipSchema.safeParse({
      teamId: "team-123",
      newOwnerId: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("New owner ID is required");
    }
  });

  it("should reject missing teamId", () => {
    const result = transferOwnershipSchema.safeParse({
      newOwnerId: "user-456",
    });
    expect(result.success).toBe(false);
  });

  it("should reject missing newOwnerId", () => {
    const result = transferOwnershipSchema.safeParse({
      teamId: "team-123",
    });
    expect(result.success).toBe(false);
  });
});

describe("leaveTeamSchema", () => {
  it("should accept valid teamId", () => {
    const result = leaveTeamSchema.safeParse({ teamId: "team-123" });
    expect(result.success).toBe(true);
  });

  it("should reject empty teamId", () => {
    const result = leaveTeamSchema.safeParse({ teamId: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Team ID is required");
    }
  });

  it("should reject missing teamId", () => {
    const result = leaveTeamSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("getTeamByIdSchema", () => {
  it("should accept valid id", () => {
    const result = getTeamByIdSchema.safeParse({ id: "team-123" });
    expect(result.success).toBe(true);
  });

  it("should reject empty id", () => {
    const result = getTeamByIdSchema.safeParse({ id: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Team ID is required");
    }
  });

  it("should reject missing id", () => {
    const result = getTeamByIdSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

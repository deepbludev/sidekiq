import { describe, expect, it } from "vitest";
import {
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
} from "@sidekiq/lib/team-permissions";

describe("canInvite", () => {
  it("should return true for owner", () => {
    expect(canInvite("owner")).toBe(true);
  });

  it("should return true for admin", () => {
    expect(canInvite("admin")).toBe(true);
  });

  it("should return false for member", () => {
    expect(canInvite("member")).toBe(false);
  });

  it("should return false for null (non-member)", () => {
    expect(canInvite(null)).toBe(false);
  });
});

describe("canRemoveMember", () => {
  it("should return true when owner removes admin", () => {
    expect(canRemoveMember("owner", "admin", false)).toBe(true);
  });

  it("should return true when owner removes member", () => {
    expect(canRemoveMember("owner", "member", false)).toBe(true);
  });

  it("should return false when owner removes another owner", () => {
    expect(canRemoveMember("owner", "owner", false)).toBe(false);
  });

  it("should return false when owner removes self", () => {
    expect(canRemoveMember("owner", "owner", true)).toBe(false);
  });

  it("should return true when admin removes member", () => {
    expect(canRemoveMember("admin", "member", false)).toBe(true);
  });

  it("should return false when admin removes another admin", () => {
    expect(canRemoveMember("admin", "admin", false)).toBe(false);
  });

  it("should return false when admin removes owner", () => {
    expect(canRemoveMember("admin", "owner", false)).toBe(false);
  });

  it("should return false when admin removes self", () => {
    expect(canRemoveMember("admin", "member", true)).toBe(false);
  });

  it("should return false when member removes anyone", () => {
    expect(canRemoveMember("member", "member", false)).toBe(false);
    expect(canRemoveMember("member", "admin", false)).toBe(false);
    expect(canRemoveMember("member", "owner", false)).toBe(false);
  });

  it("should return false for null (non-member)", () => {
    expect(canRemoveMember(null, "member", false)).toBe(false);
    expect(canRemoveMember(null, "admin", false)).toBe(false);
    expect(canRemoveMember(null, "owner", false)).toBe(false);
  });
});

describe("canChangeRole", () => {
  it("should return true when owner changes admin to member", () => {
    expect(canChangeRole("owner", "admin", "member")).toBe(true);
  });

  it("should return true when owner changes member to admin", () => {
    expect(canChangeRole("owner", "member", "admin")).toBe(true);
  });

  it("should return false when owner changes owner role", () => {
    expect(canChangeRole("owner", "owner", "admin")).toBe(false);
    expect(canChangeRole("owner", "owner", "member")).toBe(false);
  });

  it("should return true when admin changes member to admin", () => {
    expect(canChangeRole("admin", "member", "admin")).toBe(true);
  });

  it("should return true when admin changes admin to member", () => {
    expect(canChangeRole("admin", "admin", "member")).toBe(true);
  });

  it("should return false when admin changes anyone to owner", () => {
    expect(canChangeRole("admin", "member", "owner")).toBe(false);
    expect(canChangeRole("admin", "admin", "owner")).toBe(false);
  });

  it("should return false when admin changes owner", () => {
    expect(canChangeRole("admin", "owner", "member")).toBe(false);
    expect(canChangeRole("admin", "owner", "admin")).toBe(false);
  });

  it("should return false when member changes anything", () => {
    expect(canChangeRole("member", "member", "admin")).toBe(false);
    expect(canChangeRole("member", "admin", "member")).toBe(false);
    expect(canChangeRole("member", "owner", "admin")).toBe(false);
  });

  it("should return false for null (non-member)", () => {
    expect(canChangeRole(null, "member", "admin")).toBe(false);
    expect(canChangeRole(null, "admin", "member")).toBe(false);
    expect(canChangeRole(null, "owner", "member")).toBe(false);
  });
});

describe("canTransferOwnership", () => {
  it("should return true for owner", () => {
    expect(canTransferOwnership("owner")).toBe(true);
  });

  it("should return false for admin", () => {
    expect(canTransferOwnership("admin")).toBe(false);
  });

  it("should return false for member", () => {
    expect(canTransferOwnership("member")).toBe(false);
  });

  it("should return false for null (non-member)", () => {
    expect(canTransferOwnership(null)).toBe(false);
  });
});

describe("canDeleteTeam", () => {
  it("should return true for owner", () => {
    expect(canDeleteTeam("owner")).toBe(true);
  });

  it("should return false for admin", () => {
    expect(canDeleteTeam("admin")).toBe(false);
  });

  it("should return false for member", () => {
    expect(canDeleteTeam("member")).toBe(false);
  });

  it("should return false for null (non-member)", () => {
    expect(canDeleteTeam(null)).toBe(false);
  });
});

describe("canLeaveTeam", () => {
  it("should return true for admin", () => {
    expect(canLeaveTeam("admin")).toBe(true);
  });

  it("should return true for member", () => {
    expect(canLeaveTeam("member")).toBe(true);
  });

  it("should return false for owner", () => {
    expect(canLeaveTeam("owner")).toBe(false);
  });
});

describe("canRevokeInvite", () => {
  it("should return true for owner", () => {
    expect(canRevokeInvite("owner")).toBe(true);
  });

  it("should return true for admin", () => {
    expect(canRevokeInvite("admin")).toBe(true);
  });

  it("should return false for member", () => {
    expect(canRevokeInvite("member")).toBe(false);
  });

  it("should return false for null (non-member)", () => {
    expect(canRevokeInvite(null)).toBe(false);
  });
});

describe("canUpdateTeam", () => {
  it("should return true for owner", () => {
    expect(canUpdateTeam("owner")).toBe(true);
  });

  it("should return true for admin", () => {
    expect(canUpdateTeam("admin")).toBe(true);
  });

  it("should return false for member", () => {
    expect(canUpdateTeam("member")).toBe(false);
  });

  it("should return false for null (non-member)", () => {
    expect(canUpdateTeam(null)).toBe(false);
  });
});

describe("getRoleIcon", () => {
  it('should return "crown" for owner', () => {
    expect(getRoleIcon("owner")).toBe("crown");
  });

  it('should return "shield" for admin', () => {
    expect(getRoleIcon("admin")).toBe("shield");
  });

  it("should return null for member", () => {
    expect(getRoleIcon("member")).toBeNull();
  });
});

describe("getRoleLabel", () => {
  it('should return "Owner" for owner', () => {
    expect(getRoleLabel("owner")).toBe("Owner");
  });

  it('should return "Admin" for admin', () => {
    expect(getRoleLabel("admin")).toBe("Admin");
  });

  it('should return "Member" for member', () => {
    expect(getRoleLabel("member")).toBe("Member");
  });
});

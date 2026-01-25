import { describe, expect, it } from "vitest";
import {
  AVATAR_COLORS,
  generateColorFromName,
  getInitials,
  createDefaultAvatar,
} from "@sidekiq/lib/utils/avatar";

describe("AVATAR_COLORS", () => {
  it("should contain 12 colors", () => {
    expect(AVATAR_COLORS).toHaveLength(12);
  });

  it("should have all valid hex format colors", () => {
    const hexRegex = /^#[0-9A-Fa-f]{6}$/;
    for (const color of AVATAR_COLORS) {
      expect(color).toMatch(hexRegex);
    }
  });

  it("should include default indigo color", () => {
    expect(AVATAR_COLORS).toContain("#6366f1");
  });
});

describe("getInitials", () => {
  it("should return first 2 chars uppercase for single word", () => {
    expect(getInitials("Assistant")).toBe("AS");
  });

  it("should return first letter of each word for two words", () => {
    expect(getInitials("Code Helper")).toBe("CH");
  });

  it("should use only first 2 words for three+ words", () => {
    expect(getInitials("Very Long Name")).toBe("VL");
  });

  it("should use only first 2 words for many words", () => {
    expect(getInitials("A B C D E F")).toBe("AB");
  });

  it("should return single letter for single char input", () => {
    expect(getInitials("A")).toBe("A");
  });

  it("should return ? for empty string", () => {
    expect(getInitials("")).toBe("?");
  });

  it("should return ? for whitespace only", () => {
    expect(getInitials("   ")).toBe("?");
    expect(getInitials("\t")).toBe("?");
    expect(getInitials("\n")).toBe("?");
  });

  it("should handle extra whitespace between words", () => {
    expect(getInitials("Code    Helper")).toBe("CH");
    expect(getInitials("  Spaced   Name  ")).toBe("SN");
  });

  it("should return uppercase for lowercase input", () => {
    expect(getInitials("code helper")).toBe("CH");
  });

  it("should return uppercase for mixed case input", () => {
    expect(getInitials("cOdE hElPeR")).toBe("CH");
  });

  it("should handle two-character word", () => {
    expect(getInitials("AI")).toBe("AI");
  });

  it("should handle single word with many characters", () => {
    expect(getInitials("Supercalifragilistic")).toBe("SU");
  });
});

describe("generateColorFromName", () => {
  it("should return a valid hex color from palette", () => {
    const color = generateColorFromName("Test Assistant");
    expect(AVATAR_COLORS).toContain(color);
  });

  it("should be deterministic - same name returns same color", () => {
    const color1 = generateColorFromName("My Assistant");
    const color2 = generateColorFromName("My Assistant");
    expect(color1).toBe(color2);
  });

  it("should be case-insensitive", () => {
    const color1 = generateColorFromName("Test");
    const color2 = generateColorFromName("TEST");
    const color3 = generateColorFromName("test");
    expect(color1).toBe(color2);
    expect(color2).toBe(color3);
  });

  it("should be whitespace-insensitive for leading/trailing spaces", () => {
    const color1 = generateColorFromName("Test");
    const color2 = generateColorFromName("  Test  ");
    expect(color1).toBe(color2);
  });

  it("should return different colors for different names", () => {
    // Note: This is probabilistic but with 12 colors and different strings,
    // we should get different colors for sufficiently different names
    const names = [
      "Alpha",
      "Beta",
      "Gamma",
      "Delta",
      "Epsilon",
      "Zeta",
      "Eta",
      "Theta",
      "Iota",
      "Kappa",
    ];
    const colors = new Set(names.map((name) => generateColorFromName(name)));
    // Should have at least 3 different colors for 10 different names
    expect(colors.size).toBeGreaterThanOrEqual(3);
  });

  it("should handle empty string without throwing", () => {
    expect(() => generateColorFromName("")).not.toThrow();
    const color = generateColorFromName("");
    expect(AVATAR_COLORS).toContain(color);
  });

  it("should handle whitespace-only string", () => {
    expect(() => generateColorFromName("   ")).not.toThrow();
    const color = generateColorFromName("   ");
    expect(AVATAR_COLORS).toContain(color);
  });

  it("should handle special characters", () => {
    const color = generateColorFromName("Test!@#$%^&*()");
    expect(AVATAR_COLORS).toContain(color);
  });

  it("should handle unicode characters", () => {
    const color = generateColorFromName("Test 🤖");
    expect(AVATAR_COLORS).toContain(color);
  });

  it("should handle very long names", () => {
    const longName = "A".repeat(1000);
    const color = generateColorFromName(longName);
    expect(AVATAR_COLORS).toContain(color);
  });
});

describe("createDefaultAvatar", () => {
  it("should return object with type: initials", () => {
    const avatar = createDefaultAvatar("Test");
    expect(avatar.type).toBe("initials");
  });

  it("should return color from generateColorFromName", () => {
    const avatar = createDefaultAvatar("Test");
    const expectedColor = generateColorFromName("Test");
    expect(avatar.color).toBe(expectedColor);
  });

  it("should not include emoji field", () => {
    const avatar = createDefaultAvatar("Test");
    expect(avatar).not.toHaveProperty("emoji");
    // Only type and color properties
    expect(Object.keys(avatar)).toEqual(["type", "color"]);
  });

  it("should be deterministic for same name", () => {
    const avatar1 = createDefaultAvatar("Code Helper");
    const avatar2 = createDefaultAvatar("Code Helper");
    expect(avatar1).toEqual(avatar2);
  });

  it("should handle empty string", () => {
    const avatar = createDefaultAvatar("");
    expect(avatar.type).toBe("initials");
    expect(AVATAR_COLORS).toContain(avatar.color);
  });

  it("should return valid avatar for any input", () => {
    const testCases = ["", "A", "Test", "Long Name Here", "🤖 Bot"];
    for (const name of testCases) {
      const avatar = createDefaultAvatar(name);
      expect(avatar.type).toBe("initials");
      expect(AVATAR_COLORS).toContain(avatar.color);
    }
  });
});

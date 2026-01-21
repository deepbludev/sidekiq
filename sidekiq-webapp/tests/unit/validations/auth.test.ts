import { describe, expect, it } from "vitest";
import {
  signUpSchema,
  signInSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@sidekiq/lib/validations/auth";

describe("signUpSchema", () => {
  it("should accept valid input", () => {
    const result = signUpSchema.safeParse({
      name: "Test User",
      email: "test@example.com",
      password: "password123",
      confirmPassword: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("should reject name less than 2 characters", () => {
    const result = signUpSchema.safeParse({
      name: "T",
      email: "test@example.com",
      password: "password123",
      confirmPassword: "password123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Name must be at least 2 characters"
      );
    }
  });

  it("should reject name more than 50 characters", () => {
    const result = signUpSchema.safeParse({
      name: "A".repeat(51),
      email: "test@example.com",
      password: "password123",
      confirmPassword: "password123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Name must be at most 50 characters"
      );
    }
  });

  it("should reject invalid email", () => {
    const result = signUpSchema.safeParse({
      name: "Test User",
      email: "invalid-email",
      password: "password123",
      confirmPassword: "password123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Invalid email address");
    }
  });

  it("should reject password less than 8 characters", () => {
    const result = signUpSchema.safeParse({
      name: "Test User",
      email: "test@example.com",
      password: "short",
      confirmPassword: "short",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Password must be at least 8 characters"
      );
    }
  });

  it("should reject password more than 128 characters", () => {
    const longPassword = "a".repeat(129);
    const result = signUpSchema.safeParse({
      name: "Test User",
      email: "test@example.com",
      password: longPassword,
      confirmPassword: longPassword,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Password must be at most 128 characters"
      );
    }
  });

  it("should reject mismatched passwords", () => {
    const result = signUpSchema.safeParse({
      name: "Test User",
      email: "test@example.com",
      password: "password123",
      confirmPassword: "different123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Passwords do not match");
    }
  });
});

describe("signInSchema", () => {
  it("should accept valid input", () => {
    const result = signInSchema.safeParse({
      email: "test@example.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid email", () => {
    const result = signInSchema.safeParse({
      email: "invalid-email",
      password: "password123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Invalid email address");
    }
  });

  it("should reject empty password", () => {
    const result = signInSchema.safeParse({
      email: "test@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Password is required");
    }
  });
});

describe("forgotPasswordSchema", () => {
  it("should accept valid email", () => {
    const result = forgotPasswordSchema.safeParse({
      email: "test@example.com",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid email", () => {
    const result = forgotPasswordSchema.safeParse({
      email: "invalid-email",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Invalid email address");
    }
  });
});

describe("resetPasswordSchema", () => {
  it("should accept valid input", () => {
    const result = resetPasswordSchema.safeParse({
      password: "newpassword123",
      confirmPassword: "newpassword123",
    });
    expect(result.success).toBe(true);
  });

  it("should reject password less than 8 characters", () => {
    const result = resetPasswordSchema.safeParse({
      password: "short",
      confirmPassword: "short",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Password must be at least 8 characters"
      );
    }
  });

  it("should reject mismatched passwords", () => {
    const result = resetPasswordSchema.safeParse({
      password: "newpassword123",
      confirmPassword: "different123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Passwords do not match");
    }
  });
});

import { describe, expect, it } from "vitest";
import {
  updateModelPreferencesSchema,
  type UpdateModelPreferencesInput,
} from "@sidekiq/lib/validations/user";

describe("updateModelPreferencesSchema", () => {
  describe("valid inputs", () => {
    it("should accept defaultModel only", () => {
      const result = updateModelPreferencesSchema.safeParse({
        defaultModel: "anthropic/claude-sonnet-4-20250514",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.defaultModel).toBe(
          "anthropic/claude-sonnet-4-20250514",
        );
        expect(result.data.toggleFavorite).toBeUndefined();
      }
    });

    it("should accept toggleFavorite only", () => {
      const result = updateModelPreferencesSchema.safeParse({
        toggleFavorite: "openai/gpt-4o",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.toggleFavorite).toBe("openai/gpt-4o");
        expect(result.data.defaultModel).toBeUndefined();
      }
    });

    it("should accept both defaultModel and toggleFavorite", () => {
      const result = updateModelPreferencesSchema.safeParse({
        defaultModel: "anthropic/claude-sonnet-4-20250514",
        toggleFavorite: "openai/gpt-4o",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.defaultModel).toBe(
          "anthropic/claude-sonnet-4-20250514",
        );
        expect(result.data.toggleFavorite).toBe("openai/gpt-4o");
      }
    });

    it("should accept empty object", () => {
      const result = updateModelPreferencesSchema.safeParse({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.defaultModel).toBeUndefined();
        expect(result.data.toggleFavorite).toBeUndefined();
      }
    });

    it("should accept any string as model ID (validation at router level)", () => {
      // Schema accepts any string - actual model validation happens at router level
      const result = updateModelPreferencesSchema.safeParse({
        defaultModel: "any-string-value",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("invalid inputs", () => {
    it("should reject non-string defaultModel", () => {
      const result = updateModelPreferencesSchema.safeParse({
        defaultModel: 123,
      });

      expect(result.success).toBe(false);
    });

    it("should reject non-string toggleFavorite", () => {
      const result = updateModelPreferencesSchema.safeParse({
        toggleFavorite: true,
      });

      expect(result.success).toBe(false);
    });

    it("should reject array values", () => {
      const result = updateModelPreferencesSchema.safeParse({
        defaultModel: ["model1", "model2"],
      });

      expect(result.success).toBe(false);
    });

    it("should reject null values", () => {
      const result = updateModelPreferencesSchema.safeParse({
        defaultModel: null,
      });

      expect(result.success).toBe(false);
    });
  });

  describe("type inference", () => {
    it("should correctly type the parsed result", () => {
      const input: UpdateModelPreferencesInput = {
        defaultModel: "anthropic/claude-sonnet-4-20250514",
        toggleFavorite: "openai/gpt-4o",
      };

      const result = updateModelPreferencesSchema.parse(input);

      // TypeScript should infer these correctly
      const defaultModel: string | undefined = result.defaultModel;
      const toggleFavorite: string | undefined = result.toggleFavorite;

      expect(defaultModel).toBe("anthropic/claude-sonnet-4-20250514");
      expect(toggleFavorite).toBe("openai/gpt-4o");
    });
  });
});

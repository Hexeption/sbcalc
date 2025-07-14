import { describe, it, expect, vi } from "vitest";
import {
  encodeRecipeState,
  decodeRecipeState,
  generateShareableUrl,
  createRecipeDescription,
  type ShareableRecipeState,
} from "@/lib/share-utils";

// Mock window.location
const mockLocation = {
  origin: "https://example.com",
  href: "https://example.com",
};

Object.defineProperty(window, "location", {
  value: mockLocation,
  writable: true,
});

describe("share-utils", () => {
  const mockState: ShareableRecipeState = {
    recipes: {
      HYPERION: 1,
      IRON_INGOT: 64,
    },
    forgeSettings: {
      forgeSlots: 5,
      useMultipleSlots: true,
      quickForgeLevel: 10,
    },
  };

  describe("encodeRecipeState", () => {
    it("should encode recipe state to base64 string", () => {
      const encoded = encodeRecipeState(mockState);

      expect(encoded).toBeTruthy();
      expect(typeof encoded).toBe("string");
    });

    it("should handle encoding errors gracefully", () => {
      // Mock JSON.stringify to throw an error
      const originalStringify = JSON.stringify;
      JSON.stringify = vi.fn().mockImplementation(() => {
        throw new Error("Stringify error");
      });

      const result = encodeRecipeState(mockState);
      expect(result).toBe("");

      // Restore original
      JSON.stringify = originalStringify;
    });
  });

  describe("decodeRecipeState", () => {
    it("should decode valid encoded state", () => {
      const encoded = encodeRecipeState(mockState);
      const decoded = decodeRecipeState(encoded);

      expect(decoded).toEqual(mockState);
    });

    it("should return null for invalid encoded string", () => {
      const result = decodeRecipeState("invalid-base64");
      expect(result).toBeNull();
    });

    it("should return null for valid base64 but invalid JSON", () => {
      const invalidJson = btoa("not valid json");
      const result = decodeRecipeState(invalidJson);
      expect(result).toBeNull();
    });

    it("should return null for missing required properties", () => {
      const incompleteState = { recipes: {} }; // missing forgeSettings
      const encoded = btoa(JSON.stringify(incompleteState));
      const result = decodeRecipeState(encoded);
      expect(result).toBeNull();
    });
  });

  describe("generateShareableUrl", () => {
    it("should generate valid shareable URL", () => {
      const url = generateShareableUrl(mockState);

      expect(url).toContain("https://example.com");
      expect(url).toContain("shared=");
    });

    it("should return empty string for encoding errors", () => {
      // Mock encodeRecipeState to fail
      const originalStringify = JSON.stringify;
      JSON.stringify = vi.fn().mockImplementation(() => {
        throw new Error("Stringify error");
      });

      const result = generateShareableUrl(mockState);
      expect(result).toBe("");

      // Restore original
      JSON.stringify = originalStringify;
    });
  });

  describe("createRecipeDescription", () => {
    it("should describe single recipe correctly", () => {
      const singleRecipeState: ShareableRecipeState = {
        recipes: { HYPERION: 1 },
        forgeSettings: mockState.forgeSettings,
      };

      const description = createRecipeDescription(singleRecipeState);
      expect(description).toBe("1x hyperion");
    });

    it("should describe multiple recipes correctly", () => {
      const description = createRecipeDescription(mockState);
      expect(description).toBe("2 recipes (65 total items)");
    });

    it("should handle empty recipes", () => {
      const emptyState: ShareableRecipeState = {
        recipes: {},
        forgeSettings: mockState.forgeSettings,
      };

      const description = createRecipeDescription(emptyState);
      expect(description).toBe("Empty recipe");
    });

    it("should format item names correctly", () => {
      const stateWithUnderscores: ShareableRecipeState = {
        recipes: { ENCHANTED_IRON_INGOT: 1 },
        forgeSettings: mockState.forgeSettings,
      };

      const description = createRecipeDescription(stateWithUnderscores);
      expect(description).toBe("1x enchanted iron ingot");
    });
  });
});

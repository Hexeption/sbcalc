import type { ForgeSettings } from "./types";

export interface ShareableRecipeState {
  recipes: Record<string, number>; // item -> quantity
  forgeSettings: ForgeSettings;
}

/**
 * Encode recipe state to a shareable URL
 */
export function encodeRecipeState(state: ShareableRecipeState): string {
  try {
    const compressed = JSON.stringify(state);
    const encoded = btoa(compressed);
    return encoded;
  } catch (error) {
    console.error("Failed to encode recipe state:", error);
    return "";
  }
}

/**
 * Decode recipe state from URL parameter
 */
export function decodeRecipeState(
  encoded: string,
): ShareableRecipeState | null {
  try {
    const compressed = atob(encoded);
    const state = JSON.parse(compressed) as ShareableRecipeState;

    // Validate the state structure
    if (!state.recipes || !state.forgeSettings) {
      throw new Error("Invalid state structure");
    }

    return state;
  } catch (error) {
    console.error("Failed to decode recipe state:", error);
    return null;
  }
}

/**
 * Generate a shareable URL for the current recipe state
 */
export function generateShareableUrl(state: ShareableRecipeState): string {
  const encoded = encodeRecipeState(state);
  if (!encoded) return "";

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const url = new URL(baseUrl);
  url.searchParams.set("shared", encoded);

  return url.toString();
}

/**
 * Get recipe state from current URL
 */
export function getSharedRecipeState(): ShareableRecipeState | null {
  if (typeof window === "undefined") return null;

  const url = new URL(window.location.href);
  const shared = url.searchParams.get("shared");

  if (!shared) return null;

  return decodeRecipeState(shared);
}

/**
 * Create a compact description of the shared recipe
 */
export function createRecipeDescription(state: ShareableRecipeState): string {
  const recipeCount = Object.keys(state.recipes).length;
  const totalItems = Object.values(state.recipes).reduce(
    (sum, qty) => sum + qty,
    0,
  );

  if (recipeCount === 0) return "Empty recipe";
  if (recipeCount === 1) {
    const entry = Object.entries(state.recipes)[0];
    if (entry) {
      const [itemName, quantity] = entry;
      return `${quantity}x ${itemName.replace(/_/g, " ").toLowerCase()}`;
    }
  }

  return `${recipeCount} recipes (${totalItems} total items)`;
}

import { parseSNBT } from "@workspace/snbt-parser";
import { getHeadTextureUrl } from "./site-paths";
import type { RecipeEntry, RecipesData } from "./types";

/**
 * Get display name from recipe entry, removing Minecraft formatting codes
 * Falls back to items data, then formats internal name if not found in either
 * For enchanted books, uses the first lore line
 */
export const getDisplayName = (
  recipeEntry: RecipeEntry | undefined,
  internalname: string,
  itemsData?: RecipesData,
): string => {
  // For enchanted books, use the first lore line
  if (
    recipeEntry?.itemid === "minecraft:enchanted_book" &&
    Array.isArray(recipeEntry?.lore) &&
    recipeEntry.lore.length > 0
  ) {
    return recipeEntry.lore[0]?.replace(/{LVL}/g, "100") || "";
  }

  // First try to get from recipe entry
  if (recipeEntry?.displayname) {
    return recipeEntry.displayname.replace(/{LVL}/g, "100");
  }

  // Then try to get from items data
  const entry = itemsData?.[internalname];
  if (entry?.displayname) {
    // Check if it's an enchanted book in items data
    if (
      entry.itemid === "minecraft:enchanted_book" &&
      Array.isArray(entry.lore) &&
      entry.lore.length > 0
    ) {
      return entry.lore[0]?.replace(/{LVL}/g, "100") || "";
    }
    return entry.displayname.replace(/{LVL}/g, "100");
  }

  // Last resort: format the internal name
  return internalname
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

/**
 * Extract data from SNBT using our custom @workspace/snbt-parser
 * Handles all NBT data types including compounds, arrays, and special Minecraft formats
 */
export function extractFromSNBT(nbttag: string): {
  textureUrl: string | null;
  itemModel: string | null;
} {
  try {
    const parsed = parseSNBT(nbttag);

    // Extract player head texture
    let textureUrl: string | null = null;
    if (parsed && typeof parsed === "object" && "SkullOwner" in parsed) {
      const skullOwner = parsed.SkullOwner as any;

      if (skullOwner?.Properties?.textures?.[0]?.Value) {
        try {
          const decodedTexture = JSON.parse(
            atob(skullOwner.Properties.textures[0].Value),
          );
          if (decodedTexture.textures?.SKIN?.url) {
            const skinUrl: string = decodedTexture.textures.SKIN.url;
            // Extract texture hash from the URL
            const hashMatch = skinUrl.match(
              /textures\.minecraft\.net\/texture\/([a-f0-9]+)/i,
            );
            if (hashMatch?.[1]) {
              textureUrl = getHeadTextureUrl(hashMatch[1]);
            }
          }
        } catch (_e) {
          // Silent fail
        }
      }
    }

    // Extract ItemModel
    let itemModel: string | null = null;
    if (parsed && typeof parsed === "object" && "ItemModel" in parsed) {
      const model = (parsed as any).ItemModel;
      if (typeof model === "string") {
        itemModel = model.replace("minecraft:", "");
      }
    }

    return { textureUrl, itemModel };
  } catch (_e) {
    // If our custom SNBT parser fails, return null values
    return { textureUrl: null, itemModel: null };
  }
}

/**
 * Convert Minecraft color codes to hex colors
 */
const MINECRAFT_COLORS: Record<string, string> = {
  "0": "#000000", // Black
  "1": "#0000AA", // Dark Blue
  "2": "#00AA00", // Dark Green
  "3": "#00AAAA", // Dark Aqua
  "4": "#AA0000", // Dark Red
  "5": "#AA00AA", // Dark Purple
  "6": "#FFAA00", // Gold
  "7": "#AAAAAA", // Gray
  "8": "#555555", // Dark Gray
  "9": "#5555FF", // Blue
  a: "#55FF55", // Green
  b: "#55FFFF", // Aqua
  c: "#FF5555", // Red
  d: "#FF55FF", // Light Purple
  e: "#FFFF55", // Yellow
  f: "#FFFFFF", // White
};

// Darkened variants for light backgrounds
const MINECRAFT_COLORS_LIGHT: Record<string, string> = {
  "0": "#000000",
  "1": "#00008B",
  "2": "#006600",
  "3": "#007777",
  "4": "#AA0000",
  "5": "#880088",
  "6": "#B87700",
  "7": "#666666",
  "8": "#444444",
  "9": "#3333CC",
  a: "#118811",
  b: "#008888",
  c: "#CC3333",
  d: "#AA22AA",
  e: "#998800",
  f: "#1c1917",
};

/**
 * Parse Minecraft color codes and return array of colored text segments
 */
export interface ColorSegment {
  text: string;
  color: string;
}

export const parseMinecraftColors = (
  text: string,
  isDark = true,
): ColorSegment[] => {
  const colors = isDark ? MINECRAFT_COLORS : MINECRAFT_COLORS_LIGHT;
  const result: ColorSegment[] = [];
  let currentColor = isDark ? "#FFFFFF" : "#1c1917";
  let currentText = "";
  let index = 0;

  while (index < text.length) {
    if (text[index] === "§" && index + 1 < text.length) {
      if (currentText) {
        result.push({
          text: currentText,
          color: currentColor,
        });
        currentText = "";
      }

      const colorCode = text[index + 1] as keyof typeof MINECRAFT_COLORS;
      if (colorCode && colors[colorCode]) {
        currentColor = colors[colorCode];
      }
      index += 2;
    } else {
      currentText += text[index];
      index++;
    }
  }

  if (currentText) {
    result.push({
      text: currentText,
      color: currentColor,
    });
  }

  return result;
};

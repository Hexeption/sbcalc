import type { RecipeEntry, RecipesData } from "./types";
import { parseSNBT } from "@workspace/snbt-parser";

/**
 * Get display name from recipe entry, removing Minecraft formatting codes
 * Falls back to items data, then formats internal name if not found in either
 */
export const getDisplayName = (
  recipeEntry: RecipeEntry | undefined,
  internalname: string,
  itemsData?: RecipesData,
): string => {
  // First try to get from recipe entry
  if (recipeEntry?.displayname) {
    return recipeEntry.displayname.replace(/§./g, "");
  }

  // Then try to get from items data
  if (itemsData && itemsData[internalname]?.displayname) {
    return itemsData[internalname].displayname!.replace(/§./g, "");
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

    // Extract player head texture using MineSkin API
    let textureUrl: string | null = null;
    if (parsed && typeof parsed === "object" && "SkullOwner" in parsed) {
      const skullOwner = parsed.SkullOwner as any;

      // Primary method: Use MineSkin API with the direct Minecraft texture URL
      if (skullOwner?.Properties?.textures?.[0]?.Value) {
        try {
          const decodedTexture = JSON.parse(
            atob(skullOwner.Properties.textures[0].Value),
          );
          if (decodedTexture.textures?.SKIN?.url) {
            const minecraftTextureUrl = decodedTexture.textures.SKIN.url;
            // MineSkin can render custom textures from Minecraft URLs (works for items like Judgement Core)
            textureUrl = `https://api.mineskin.org/render/head?url=${encodeURIComponent(minecraftTextureUrl)}`;
          }
        } catch (e) {
          // Fallback to UUID-based approach for regular players
          if (skullOwner?.Id) {
            textureUrl = `https://crafatar.com/renders/head/${skullOwner.Id}`;
          }
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
  } catch (error) {
    // If our custom SNBT parser fails, return null values
    console.warn("Failed to parse SNBT:", error);
    return { textureUrl: null, itemModel: null };
  }
}

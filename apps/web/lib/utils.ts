import type { RecipeEntry, RecipesData } from "./types";

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
 * Minimal SNBT extractor for SkullOwner.Properties.textures[0].Value and ItemModel
 */
export function extractFromSNBT(nbttag: string): {
  textureUrl: string | null;
  itemModel: string | null;
} {
  // Extract player head texture
  const textureMatch = nbttag.match(
    /SkullOwner:\{[^}]*Properties:\{[^}]*textures:\[0:\{[^}]*Value:\\?"([A-Za-z0-9+/=]+)\\?"/,
  );
  let textureUrl: string | null = null;
  if (textureMatch && textureMatch[1]) {
    try {
      const decoded = JSON.parse(atob(textureMatch[1]));

      console.log("Decoded texture:", decoded);

      if (decoded.textures?.SKIN?.url) {
        const url = decoded.textures.SKIN.url;
        const hashIndex = url.lastIndexOf("/");
        const hash = url.substring(hashIndex + 1);
        textureUrl = `https://mc-heads.net/head/${hash}`;
      } else {
        textureUrl = decoded.textures?.SKIN?.url || null;
      }
    } catch (e) {
      textureUrl = null;
    }
  }

  // Extract ItemModel (accepts ItemModel, itemmodel, or item_model)
  let itemModel: string | null = null;
  const itemModelMatch = nbttag.match(/ItemModel:"([^"]+)"/i);

  if (itemModelMatch && itemModelMatch[1]) {
    itemModel = itemModelMatch[1].replace("minecraft:", "");
  }

  return { textureUrl, itemModel };
}

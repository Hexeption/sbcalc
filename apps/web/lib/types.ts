// Type definitions for recipe data
export interface ForgeRecipe {
  type: "forge";
  forge_time: number;
  forge_ingredients: Array<{ item: string; count: number }>;
}

/** A forge recipe entry as it appears in the NEU recipes array */
export interface ForgeRecipeArrayEntry {
  type: "forge";
  duration: number;
  inputs: string[];
}

/** A crafting recipe grid (A1-C3 slots + optional count/overrideOutputId) */
export type CraftingRecipe = Record<string, string | number>;

export interface RecipeEntry {
  internalname: string;
  displayname?: string;
  itemid?: string;
  nbttag?: string;
  damage?: number;
  recipe?: CraftingRecipe;
  recipes?: Array<CraftingRecipe | ForgeRecipeArrayEntry>;
  type?: string;
  forge?: ForgeRecipe;
  ItemModel?: string;
  itemmodel?: string;
  item_model?: string;
  lore?: string[];
  infoType?: string;
  info?: string[];
}

export interface ItemListEntry {
  itemId: string;
  quantity: number;
}

export interface ForgeSettings {
  forgeSlots: number;
  useMultipleSlots: boolean;
  quickForgeLevel?: number;
}

export interface ForgeRequirement {
  itemId: string;
  requiredQuantity: number;
  forgeTimeSeconds: number;
}

export interface ForgePlanProgress {
  targetItemId: string;
  completedByItem: Record<string, number>;
}

export interface ActiveForgeJob {
  id: string;
  planTargetItemId: string;
  itemId: string;
  startedAtMs: number;
  endsAtMs: number;
  totalDurationSeconds: number;
}

export interface Settings {
  forgeSlots: number;
  useMultipleSlots: boolean;
  quickForgeLevel: number;
}

export type RecipesData = Record<string, RecipeEntry>;

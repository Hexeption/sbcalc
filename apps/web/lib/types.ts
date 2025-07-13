// Type definitions for recipe data
export interface ForgeRecipe {
  type: "forge";
  forge_time: number;
  forge_ingredients: Array<{ item: string; count: number }>;
}

export interface RecipeEntry {
  displayname?: string;
  internalname?: string;
  itemid?: string;
  nbttag?: string;
  damage?: number;
  recipe?: Record<string, string>;
  recipes?: Array<Record<string, string>>;
  type?: string;
  forge?: ForgeRecipe;
  ItemModel?: string;
  itemmodel?: string;
  item_model?: string;
}

export interface ForgeSettings {
  forgeSlots: number;
  useMultipleSlots: boolean;
  quickForgeLevel?: number;
}

export interface Settings {
  forgeSlots: number;
  useMultipleSlots: boolean;
  quickForgeLevel: number;
}

export type RecipesData = Record<string, RecipeEntry>;

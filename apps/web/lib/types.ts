// Type definitions for recipe data
export type ForgeRecipe = {
  type: "forge";
  forge_time: number;
  forge_ingredients: Array<{ item: string; count: number }>;
};

export type RecipeEntry = {
  displayname?: string;
  internalname?: string;
  itemid?: string;
  nbttag?: string;
  recipe?: Record<string, string>;
  recipes?: Array<Record<string, string>>;
  type?: string;
  forge?: ForgeRecipe;
  ItemModel?: string;
  itemmodel?: string;
  item_model?: string;
};

export type RecipesData = Record<string, RecipeEntry>;

import type { CraftingRecipe, ForgeRecipe, RecipeEntry } from "./types";

/**
 * Helper to aggregate ingredient counts from recipe strings
 */
export const aggregateIngredients = (
  ingredients: string[],
): Record<string, number> => {
  const counts: Record<string, number> = {};
  for (const ingredient of ingredients) {
    const [name, count] = ingredient.split(":");
    if (!name) continue;
    const num = Number(count) || 1;
    counts[name] = (counts[name] || 0) + num;
  }
  return counts;
};

/**
 * Get the recipe from a recipe entry, prioritizing forge recipes over crafting recipes
 */
export const getRecipe = (
  entry: RecipeEntry,
): CraftingRecipe | ForgeRecipe | undefined => {
  // Support forge recipes in the 'recipes' array
  if (Array.isArray(entry.recipes)) {
    const forgeRecipe = entry.recipes.find(
      (r): r is { type: "forge"; duration: number; inputs: string[] } =>
        "type" in r && r.type === "forge",
    );
    if (forgeRecipe) {
      return {
        type: "forge",
        forge_time: forgeRecipe.duration || 0,
        forge_ingredients: (forgeRecipe.inputs || []).map((input: string) => {
          const [item, count] = input.split(":");
          return { item: item || "", count: Number(count) || 1 };
        }),
      };
    }
  }
  if (entry.type === "forge" && entry.forge) {
    return entry.forge;
  }
  return (
    entry.recipe ||
    (Array.isArray(entry.recipes)
      ? (entry.recipes[0] as CraftingRecipe)
      : undefined)
  );
};

/**
 * Extract ingredients from a recipe object
 */
export const getIngredientsFromRecipe = (
  recipe: CraftingRecipe | ForgeRecipe,
): string[] => {
  if ((recipe as ForgeRecipe).type === "forge") {
    // Forge recipe: return as "item:count" strings
    return (recipe as ForgeRecipe).forge_ingredients.map(
      (ing: { item: string; count: number }) => `${ing.item}:${ing.count}`,
    );
  }
  return Object.values(recipe as CraftingRecipe)
    .filter((v) => typeof v === "string" && v && v.includes(":"))
    .map((v) => v as string);
};

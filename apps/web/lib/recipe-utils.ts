import type { RecipesData, ForgeRecipe } from "./types";
import { BASE_MATERIALS } from "./constants";

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
 * Get the recipe from a recipe entry, prioritizing single recipe over recipes array
 */
// Returns a recipe object or forge recipe if present
export const getRecipe = (
  entry: any,
): Record<string, string> | ForgeRecipe | undefined => {
  // Support forge recipes in the 'recipes' array
  if (Array.isArray(entry.recipes)) {
    const forgeRecipe = entry.recipes.find((r: any) => r.type === "forge");
    if (forgeRecipe) {
      // Map the data structure to our ForgeRecipe type
      return {
        type: "forge",
        forge_time: forgeRecipe.duration || 0,
        forge_ingredients: (forgeRecipe.inputs || []).map((input: string) => {
          const [item, count] = input.split(":");
          return { item, count: Number(count) || 1 };
        }),
      };
    }
  }
  if (entry.type === "forge" && entry.forge) {
    return entry.forge;
  }
  return (
    entry.recipe ||
    (Array.isArray(entry.recipes) ? entry.recipes[0] : undefined)
  );
};

/**
 * Extract ingredients from a recipe object
 */
export const getIngredientsFromRecipe = (
  recipe: Record<string, string> | ForgeRecipe,
): string[] => {
  if ((recipe as ForgeRecipe).type === "forge") {
    // Forge recipe: return as "item:count" strings
    return (recipe as ForgeRecipe).forge_ingredients.map(
      (ing: { item: string; count: number }) => `${ing.item}:${ing.count}`,
    );
  }
  return Object.values(recipe as Record<string, string>)
    .filter((v) => typeof v === "string" && v && v.includes(":"))
    .map((v) => v as string);
};

/**
 * Recursively collect all base (non-craftable) items and their total counts, with cycle protection
 */
export const getBaseRequirements = (
  internalname: string,
  recipes: RecipesData,
  multiplier = 1,
  acc: Record<string, number> = {},
  visited: Set<string> = new Set(),
  itemsData?: RecipesData, // pass items.json as itemsData
): Record<string, number> => {
  if (visited.has(internalname)) return acc;
  visited.add(internalname);

  const entry = recipes[internalname];
  if (!entry) return acc;

  const recipe = getRecipe(entry);
  if (!recipe) return acc;

  const ingredients = getIngredientsFromRecipe(recipe);
  const counts = aggregateIngredients(ingredients);

  for (const [name, count] of Object.entries(counts)) {
    const total = count * multiplier;
    if (
      !BASE_MATERIALS.has(name) &&
      recipes[name] &&
      getRecipe(recipes[name])
    ) {
      getBaseRequirements(name, recipes, total, acc, visited, itemsData);
    } else if (itemsData && itemsData[name]) {
      // If not in recipes but exists in items.json, treat as base
      acc[name] = (acc[name] || 0) + total;
    } else {
      acc[name] = (acc[name] || 0) + total;
    }
  }

  return acc;
};

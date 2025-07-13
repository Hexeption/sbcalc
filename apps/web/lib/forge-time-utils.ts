import type { RecipesData, ForgeRecipe } from "@/lib/types";
import {
  getRecipe,
  getIngredientsFromRecipe,
  aggregateIngredients,
} from "@/lib/recipe-utils";

// Recursively sum total forge time for a given item and multiplier
export function getTotalForgeTime(
  internalname: string,
  recipes: RecipesData,
  multiplier = 1,
  visited: Set<string> = new Set(),
): number {
  if (visited.has(internalname)) return 0;
  visited.add(internalname);

  const entry = recipes[internalname];
  if (!entry) return 0;

  const recipe = getRecipe(entry);
  if (!recipe) return 0;

  let total = 0;
  if ((recipe as ForgeRecipe).type === "forge") {
    total += ((recipe as ForgeRecipe).forge_time || 0) * multiplier;
  }

  const ingredients = getIngredientsFromRecipe(recipe);
  const counts = aggregateIngredients(ingredients);
  for (const [name, count] of Object.entries(counts)) {
    total += getTotalForgeTime(name, recipes, count * multiplier, visited);
  }
  return total;
}

// Format seconds as s/m/h/d
export function formatForgeTime(seconds?: number): string {
  if (typeof seconds !== "number" || isNaN(seconds)) return "";
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  if (seconds < 86400) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  }
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  return `${d}d ${h}h`;
}

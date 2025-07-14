import type { RecipesData, ForgeRecipe, ForgeSettings } from "@/lib/types";
import {
  getRecipe,
  getIngredientsFromRecipe,
  aggregateIngredients,
} from "@/lib/recipe-utils";

// Calculate optimal forge time considering multiple slots
export function calculateOptimalForgeTime(
  forgeTime: number,
  quantity: number,
  options: ForgeSettings = {
    forgeSlots: 2,
    useMultipleSlots: true,
    quickForgeLevel: 0,
  },
): number {
  const {
    forgeSlots = 2,
    useMultipleSlots = true,
    quickForgeLevel = 0,
  } = options;

  // Apply Quick Forge reduction first
  const reducedForgeTime = applyQuickForgeReduction(forgeTime, quickForgeLevel);

  if (!useMultipleSlots || forgeSlots <= 1) {
    return reducedForgeTime * quantity;
  }

  // If we have more slots than items needed, parallel processing
  if (quantity <= forgeSlots) {
    return reducedForgeTime; // All items can be forged in parallel
  }

  // Calculate batches and remaining time
  const batches = Math.floor(quantity / forgeSlots);
  const remainder = quantity % forgeSlots;

  let totalTime = batches * reducedForgeTime;
  if (remainder > 0) {
    totalTime += reducedForgeTime; // One more batch for remaining items
  }

  return totalTime;
}

// Recursively sum total forge time for a given item and multiplier
export function getTotalForgeTime(
  internalname: string,
  recipes: RecipesData,
  multiplier = 1,
  visited: Set<string> = new Set(),
  options: ForgeSettings = {
    forgeSlots: 2,
    useMultipleSlots: true,
    quickForgeLevel: 0,
  },
): number {
  if (visited.has(internalname)) return 0;
  visited.add(internalname);

  const entry = recipes[internalname];
  if (!entry) return 0;

  const recipe = getRecipe(entry);
  if (!recipe) return 0;

  let total = 0;
  if ((recipe as ForgeRecipe).type === "forge") {
    const forgeTime = (recipe as ForgeRecipe).forge_time || 0;
    total += calculateOptimalForgeTime(forgeTime, multiplier, options);
  }

  const ingredients = getIngredientsFromRecipe(recipe);
  const counts = aggregateIngredients(ingredients);
  for (const [name, count] of Object.entries(counts)) {
    total += getTotalForgeTime(
      name,
      recipes,
      count * multiplier,
      visited,
      options,
    );
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
    const s = seconds % 60;
    if (s === 0) {
      return `${h}h ${m}m`;
    }
    return `${h}h ${m}m ${s}s`;
  }
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  return `${d}d ${h}h`;
}

// Calculate Quick Forge time reduction percentage based on level
export function calculateQuickForgeReduction(level: number): number {
  if (level <= 0) return 0;

  // Formula: min(30, 10 + (Level * 0.5) + (floor(Level / 20) * 10))
  const baseReduction = 10;
  const levelReduction = level * 0.5;
  const bonusReduction = Math.floor(level / 20) * 10;

  return Math.min(30, baseReduction + levelReduction + bonusReduction);
}

// Apply Quick Forge reduction to forge time
export function applyQuickForgeReduction(
  forgeTime: number,
  level: number,
): number {
  if (level <= 0) return forgeTime;

  const reductionPercent = calculateQuickForgeReduction(level);
  const reductionMultiplier = (100 - reductionPercent) / 100;

  return Math.floor(forgeTime * reductionMultiplier);
}

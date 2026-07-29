import {
  aggregateIngredients,
  getIngredientsFromRecipe,
  getRecipe,
} from "@/lib/recipe-utils";
import type {
  ActiveForgeJob,
  CraftingRecipe,
  ForgeRecipe,
  ForgeRequirement,
  RecipesData,
} from "@/lib/types";

function asPositiveInteger(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.ceil(value);
}

function isForgeRecipe(
  recipe: CraftingRecipe | ForgeRecipe | undefined,
): recipe is ForgeRecipe {
  return (recipe as ForgeRecipe | undefined)?.type === "forge";
}

/**
 * Collect every forge output needed for a forge target. Crafting recipes are
 * traversed but not included, and their output count is respected.
 */
export function getForgeRequirements(
  targetItemId: string,
  targetQuantity: number,
  recipes: RecipesData,
): ForgeRequirement[] {
  const rootRecipe = recipes[targetItemId]
    ? getRecipe(recipes[targetItemId])
    : undefined;
  if (!isForgeRecipe(rootRecipe)) return [];

  const totals = new Map<string, ForgeRequirement>();
  const order: string[] = [];

  const visit = (itemId: string, quantity: number, ancestors: Set<string>) => {
    const requiredQuantity = asPositiveInteger(quantity);
    if (requiredQuantity === 0 || ancestors.has(itemId)) return;

    const entry = recipes[itemId];
    const recipe = entry ? getRecipe(entry) : undefined;
    if (!recipe) return;

    const forgeRecipe = isForgeRecipe(recipe);
    const outputCount = forgeRecipe
      ? 1
      : Math.max(
          1,
          Number((recipe as Record<string, string | number>).count) || 1,
        );
    const recipeOperations = Math.ceil(requiredQuantity / outputCount);
    const nextAncestors = new Set(ancestors);
    nextAncestors.add(itemId);

    const counts = aggregateIngredients(getIngredientsFromRecipe(recipe));
    for (const [ingredientId, ingredientCount] of Object.entries(counts)) {
      visit(ingredientId, ingredientCount * recipeOperations, nextAncestors);
    }

    if (!forgeRecipe) return;

    const existing = totals.get(itemId);
    if (existing) {
      existing.requiredQuantity += requiredQuantity;
      return;
    }

    totals.set(itemId, {
      itemId,
      requiredQuantity,
      forgeTimeSeconds: Math.max(0, recipe.forge_time || 0),
    });
    order.push(itemId);
  };

  visit(targetItemId, targetQuantity, new Set());
  return order.flatMap((itemId) => {
    const requirement = totals.get(itemId);
    return requirement ? [requirement] : [];
  });
}

export function getForgeJobRemainingSeconds(
  job: ActiveForgeJob,
  nowMs: number,
): number {
  return Math.max(0, Math.ceil((job.endsAtMs - nowMs) / 1000));
}

export function getForgeJobProgress(
  job: ActiveForgeJob,
  nowMs: number,
): number {
  if (job.totalDurationSeconds <= 0) return 100;
  const elapsedSeconds = (nowMs - job.startedAtMs) / 1000;
  return Math.min(
    100,
    Math.max(0, (elapsedSeconds / job.totalDurationSeconds) * 100),
  );
}

export function isForgeJobReady(job: ActiveForgeJob, nowMs: number): boolean {
  return job.endsAtMs <= nowMs;
}

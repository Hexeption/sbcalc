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
 * Create a stable identifier for one concrete position in a recipe tree.
 */
export function getForgeRequirementPathId(path: readonly string[]): string {
  return JSON.stringify(path);
}

/**
 * Collect every forge output needed for a forge target. Separate recipe-tree
 * branches remain separate even when they forge the same item. Crafting
 * recipes are traversed but not included, and their output count is respected.
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

  const requirements: ForgeRequirement[] = [];
  const occurrencesByItem = new Map<string, number>();

  const visit = (
    itemId: string,
    quantity: number,
    ancestors: Set<string>,
    treePath: readonly string[],
  ) => {
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
      visit(ingredientId, ingredientCount * recipeOperations, nextAncestors, [
        ...treePath,
        ingredientId,
      ]);
    }

    if (!forgeRecipe) return;

    const occurrenceIndex = occurrencesByItem.get(itemId) ?? 0;
    const treePathId = getForgeRequirementPathId(treePath);
    requirements.push({
      requirementId:
        occurrenceIndex === 0 ? itemId : `${itemId}::${treePathId}`,
      treePathId,
      itemId,
      requiredQuantity,
      forgeTimeSeconds: Math.max(0, recipe.forge_time || 0),
    });
    occurrencesByItem.set(itemId, occurrenceIndex + 1);
  };

  visit(targetItemId, targetQuantity, new Set(), [targetItemId]);
  return requirements;
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

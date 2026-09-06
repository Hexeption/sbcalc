import { BASE_MATERIALS, PATH_DELIM } from "@/lib/constants";
import { calculateOptimalForgeTime } from "@/lib/forge-time-utils";
import {
  aggregateIngredients,
  getIngredientsFromRecipe,
  getRecipe,
} from "@/lib/recipe-utils";
import type { ForgeRecipe, ForgeSettings, RecipesData } from "@/lib/types";

export interface NetTreeNode {
  internalname: string;
  /** Unique node path (root->node internalname chain). */
  path: string;
  /** Total units needed at this position before deducting inventory. */
  gross: number;
  /** Units still needed after deducting inventory (drives children + display). */
  net: number;
  /** Units of `gross` covered by inventory (gross - net). */
  fromInventory: number;
  /** Base material / leaf — nothing to expand further. */
  isBase: boolean;
  isForge: boolean;
  /** Optimized forge seconds for this node's net quantity (forge nodes only). */
  forgeTimeSeconds: number;
  /** Children that still need work (net > 0). Owned branches are dropped. */
  children: NetTreeNode[];
}

/**
 * Build a "net requirements" tree: what you still need to craft/gather for
 * `multiplier` of `rootName`, given an `inventory` of items you already own.
 *
 * Inventory is consumed by a single depth-first pass (a shared pool), so an
 * item used in several branches is deducted once. Owning an item means you
 * neither craft it nor its sub-materials, so fully-covered branches are pruned
 * (their children are omitted). Quantities mirror the tree's math:
 * `actualMultiplier = ceil(net / recipeCount)`, forge recipes count = 1.
 */
export const getNetTree = (
  rootName: string,
  recipes: RecipesData,
  multiplier: number,
  inventory: Map<string, number>,
  forgeSettings: ForgeSettings,
  itemsData?: RecipesData,
): NetTreeNode => {
  const remainingInv = new Map(inventory);

  const build = (
    name: string,
    gross: number,
    path: string,
    visited: Set<string>,
  ): NetTreeNode => {
    // Consume from inventory (shared pool, DFS order).
    const have = remainingInv.get(name) ?? 0;
    const used = Math.min(have, gross);
    if (used > 0) remainingInv.set(name, have - used);
    const net = gross - used;

    let entry = recipes[name];
    let isLeafFromItems = false;
    if (!entry && itemsData?.[name]) {
      entry = itemsData[name];
      isLeafFromItems = true;
    }
    const recipe = entry && !isLeafFromItems ? getRecipe(entry) : undefined;
    const isBase = BASE_MATERIALS.has(name) || isLeafFromItems || !recipe;
    const isForge = (recipe as ForgeRecipe | undefined)?.type === "forge";

    const node: NetTreeNode = {
      internalname: name,
      path,
      gross,
      net,
      fromInventory: used,
      isBase,
      isForge,
      forgeTimeSeconds:
        isForge && net > 0
          ? calculateOptimalForgeTime(
              (recipe as ForgeRecipe).forge_time || 0,
              net,
              forgeSettings,
            )
          : 0,
      children: [],
    };

    // Stop here for fully-owned, base, cyclic, or non-craftable items.
    if (net === 0 || isBase || !recipe || visited.has(name)) {
      return node;
    }

    const recipeCount = !isForge
      ? Number((recipe as Record<string, string | number>).count) || 1
      : 1;
    const actualMultiplier = Math.ceil(net / recipeCount);

    const newVisited = new Set(visited).add(name);
    const counts = aggregateIngredients(getIngredientsFromRecipe(recipe));
    for (const [child, count] of Object.entries(counts)) {
      const childNode = build(
        child,
        count * actualMultiplier,
        `${path}${PATH_DELIM}${child}`,
        newVisited,
      );
      // Drop owned branches; build() still ran so its inventory was consumed.
      if (childNode.net > 0) node.children.push(childNode);
    }

    return node;
  };

  return build(rootName, multiplier, rootName, new Set());
};

export interface NetSummary {
  /** Net amount still needed per item (intermediates + base), excluding root. */
  byName: Map<string, { net: number; isBase: boolean }>;
  /** Total optimized forge seconds across everything still to craft. */
  totalForgeSeconds: number;
  /** Number of distinct base materials still needed. */
  baseMaterialTypes: number;
}

/**
 * Aggregate a net tree (excluding the root) by item name, plus headline totals.
 */
export const summarizeNetTree = (root: NetTreeNode): NetSummary => {
  const byName = new Map<string, { net: number; isBase: boolean }>();
  let totalForgeSeconds = 0;

  const walk = (node: NetTreeNode, isRoot: boolean) => {
    if (!isRoot) {
      const existing = byName.get(node.internalname);
      if (existing) existing.net += node.net;
      else
        byName.set(node.internalname, { net: node.net, isBase: node.isBase });
    }
    totalForgeSeconds += node.forgeTimeSeconds;
    for (const child of node.children) walk(child, false);
  };
  walk(root, true);

  let baseMaterialTypes = 0;
  for (const { isBase } of byName.values()) if (isBase) baseMaterialTypes++;

  return { byName, totalForgeSeconds, baseMaterialTypes };
};

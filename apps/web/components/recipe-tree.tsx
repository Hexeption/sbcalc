"use client";

import React, { useState } from "react";
import type { RecipesData, ForgeRecipe } from "@/lib/types";
import { BASE_MATERIALS } from "@/lib/constants";
import { getDisplayName } from "@/lib/utils";
import {
  aggregateIngredients,
  getRecipe,
  getIngredientsFromRecipe,
} from "@/lib/recipe-utils";
import { ItemImage } from "./item-image";

interface RecipeTreeProps {
  internalname: string;
  recipes: RecipesData;
  multiplier?: number;
  depth?: number;
  visited?: Set<string>;
  itemsData?: RecipesData;
  expandedItems?: Set<string>;
  onToggleExpanded?: (itemName: string) => void;
}

export function RecipeTree({
  internalname,
  recipes,
  multiplier = 1,
  depth = 0,
  visited = new Set(),
  itemsData,
  expandedItems: externalExpandedItems,
  onToggleExpanded,
}: RecipeTreeProps): React.ReactElement | null {
  const [internalExpandedItems, setInternalExpandedItems] = useState<
    Set<string>
  >(new Set([internalname]));

  // Use external expanded state if provided, otherwise use internal state
  const expandedItems = externalExpandedItems || internalExpandedItems;
  const setExpandedItems = onToggleExpanded
    ? undefined
    : setInternalExpandedItems;

  // Check for cycle detection
  if (visited.has(internalname)) {
    return (
      <div
        className={`flex items-center gap-3 p-3 my-2 bg-card rounded-lg border-l-4 border-destructive`}
        style={{ marginLeft: `${depth * 20}px` }}
      >
        <span className="text-destructive">(cycle detected)</span>
      </div>
    );
  }

  // Try to get entry from recipes, fallback to itemsData
  let entry = recipes[internalname];
  let isLeafFromItems = false;
  if (!entry && itemsData && itemsData[internalname]) {
    entry = itemsData[internalname];
    isLeafFromItems = true;
  }
  if (!entry) return null;

  const recipe = !isLeafFromItems ? getRecipe(entry) : undefined;
  const isBaseMaterial = BASE_MATERIALS.has(internalname) || isLeafFromItems;
  const ingredients = recipe ? getIngredientsFromRecipe(recipe) : [];
  const hasIngredients = ingredients.length > 0 && !isBaseMaterial;

  const counts = aggregateIngredients(ingredients);
  const nextVisited = new Set(visited);
  nextVisited.add(internalname);

  const isExpanded = expandedItems.has(internalname);

  const toggleExpanded = (itemName: string) => {
    if (onToggleExpanded) {
      onToggleExpanded(itemName);
    } else if (setExpandedItems) {
      const newExpanded = new Set(expandedItems);
      if (newExpanded.has(itemName)) {
        newExpanded.delete(itemName);
      } else {
        newExpanded.add(itemName);
      }
      setExpandedItems(newExpanded);
    }
  };

  const displayName = getDisplayName(entry, internalname, itemsData);

  // Detect Forge recipe
  const isForgeRecipe = (recipe as ForgeRecipe)?.type === "forge";
  // Format forge time for display
  const rawForgeTime = isForgeRecipe
    ? (recipe as ForgeRecipe).forge_time
    : undefined;
  function formatForgeTime(seconds?: number): string {
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
  const forgeTime =
    rawForgeTime !== undefined ? formatForgeTime(rawForgeTime) : undefined;
  const recipeCount: number = !isForgeRecipe
    ? Number((recipe as any)?.count) || 1
    : 1;
  const actualMultiplier = Math.ceil(multiplier / recipeCount);

  return (
    <div className="space-y-1">
      {/* Current item display */}
      <div
        className={`flex items-center gap-4 p-3 my-2 bg-card rounded-lg border-l-4 ${
          visited.has(internalname) ? "border-destructive" : "border-primary"
        } hover:bg-accent transition-all hover:translate-x-1 ${hasIngredients ? "cursor-pointer" : ""}`}
        style={{ marginLeft: `${depth * 20}px` }}
        onClick={() => hasIngredients && toggleExpanded(internalname)}
      >
        <ItemImage
          entry={entry} // Use the current item's entry
          internalname={internalname}
          alt={displayName}
          width={32}
          height={32}
          style={{ verticalAlign: "middle" }}
          itemsData={itemsData}
        />
        <span className="font-medium text-foreground">{displayName}</span>
        {isForgeRecipe && (
          <span className="ml-2 bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 px-2 py-1 rounded text-xs font-semibold">
            Forge Recipe
          </span>
        )}
        <span className="ml-auto font-semibold text-primary bg-primary/10 px-3 py-1 rounded-md">
          {multiplier}x
        </span>
        {isForgeRecipe && forgeTime && (
          <span className="ml-2 bg-blue-500/20 text-blue-700 dark:text-blue-400 px-2 py-1 rounded text-xs font-medium">
            Forge Time: {forgeTime}
          </span>
        )}
        {isBaseMaterial && (
          <span className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded text-sm font-medium">
            Base Material
          </span>
        )}
        {hasIngredients && (
          <span className="text-muted-foreground text-sm ml-2">
            {isExpanded ? "▼" : "▶"}
          </span>
        )}
      </div>

      {/* Render children if expanded and has ingredients */}
      {isExpanded && hasIngredients && (
        <div className="space-y-1">
          {Object.entries(counts).map(([name, count]) => (
            <RecipeTree
              key={name}
              internalname={name}
              recipes={recipes}
              multiplier={count * actualMultiplier} // Correct multiplier for children
              depth={depth + 1} // Increment depth for children
              visited={nextVisited}
              itemsData={itemsData}
              expandedItems={externalExpandedItems}
              onToggleExpanded={onToggleExpanded}
            />
          ))}
        </div>
      )}
    </div>
  );
}

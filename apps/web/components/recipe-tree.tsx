"use client";

import { Checkbox } from "@workspace/ui/components/checkbox";
import { ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import type React from "react";
import { ForgeTreeTrackerControls } from "@/components/forge-tree-tracker-controls";
import { MinecraftColoredText } from "@/components/minecraft-colored-text";
import { trackRecipeTreeItemClick } from "@/lib/analytics";
import { BASE_MATERIALS } from "@/lib/constants";
import {
  calculateOptimalForgeTime,
  formatForgeTime,
} from "@/lib/forge-time-utils";
import { useRecipeData } from "@/lib/recipe-data-context";
import {
  aggregateIngredients,
  getIngredientsFromRecipe,
  getRecipe,
} from "@/lib/recipe-utils";
import type { ForgeRecipe, ForgeRequirement, ForgeSettings } from "@/lib/types";
import { getDisplayName } from "@/lib/utils";
import { ItemImage } from "./item-image";

interface RecipeTreeProps {
  internalname: string;
  multiplier?: number;
  depth?: number;
  visited?: Set<string>;
  expandedItems: Set<string>;
  onToggleExpanded: (itemName: string) => void;
  forgeSettings?: ForgeSettings;
  isLastChild?: boolean;
  ancestorLines?: boolean[];
  todoMode?: boolean;
  checkedItems?: Set<string>;
  onToggleChecked?: (itemName: string) => void;
  forgePlanTargetItemId?: string;
  forgeRequirements?: ReadonlyMap<string, ForgeRequirement>;
}

export function RecipeTree({
  internalname,
  multiplier = 1,
  depth = 0,
  visited = new Set(),
  expandedItems: externalExpandedItems,
  onToggleExpanded,
  forgeSettings = { forgeSlots: 2, useMultipleSlots: true, quickForgeLevel: 0 },
  isLastChild = true,
  ancestorLines = [],
  todoMode = false,
  checkedItems,
  onToggleChecked,
  forgePlanTargetItemId,
  forgeRequirements,
}: RecipeTreeProps): React.ReactElement | null {
  const { recipes, itemsData } = useRecipeData();

  const expandedItems = externalExpandedItems ?? new Set([internalname]);

  if (visited.has(internalname)) {
    return null;
  }

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

  const displayName = getDisplayName(entry, internalname, itemsData);
  const plainDisplayName = displayName.replace(/(?:\u00c2)?\u00a7./g, "");

  const isForgeRecipe = (recipe as ForgeRecipe)?.type === "forge";
  const rawForgeTime = isForgeRecipe
    ? (recipe as ForgeRecipe).forge_time
    : undefined;

  const optimizedForgeTime =
    rawForgeTime !== undefined
      ? calculateOptimalForgeTime(rawForgeTime, multiplier, forgeSettings)
      : undefined;

  const forgeTime =
    optimizedForgeTime !== undefined
      ? formatForgeTime(optimizedForgeTime)
      : undefined;
  const forgeRequirement = forgeRequirements?.get(internalname);
  const recipeCount: number = !isForgeRecipe
    ? Number((recipe as Record<string, string | number>)?.count) || 1
    : 1;
  const actualMultiplier = Math.ceil(multiplier / recipeCount);

  const wikiUrl =
    entry.infoType === "WIKI_URL" && entry.info?.length
      ? (entry.info.find((u) => u.includes("wiki.hypixel.net")) ??
        entry.info[0])
      : undefined;

  const isChecked = todoMode && checkedItems?.has(internalname);

  return (
    <div>
      <div className="flex items-stretch">
        {depth > 0 &&
          ancestorLines.map((hasLine, i) => (
            <div key={`line-${i}`} className="w-6 shrink-0 relative">
              {hasLine && (
                <div className="absolute left-3 top-0 bottom-0 w-px bg-border/40" />
              )}
            </div>
          ))}
        {depth > 0 && (
          <div className="w-6 shrink-0 relative">
            <div
              className={`absolute left-3 top-0 w-px bg-border/40 ${isLastChild ? "h-1/2" : "h-full"}`}
            />
            <div className="absolute left-3 top-1/2 w-3 h-px bg-border/40" />
          </div>
        )}
        <div
          className={`group flex flex-wrap items-center gap-2 px-3 py-2 my-0.5 rounded-lg transition-all flex-1 min-w-0 sm:flex-nowrap sm:gap-3 ${
            hasIngredients ? "cursor-pointer hover:bg-accent/30" : ""
          } ${isBaseMaterial ? "bg-emerald-500/5 border border-emerald-500/15" : "hover:bg-muted/50"} ${isChecked ? "opacity-40" : ""}`}
          onClick={() => {
            if (hasIngredients) {
              onToggleExpanded(internalname);
              trackRecipeTreeItemClick(
                internalname,
                displayName,
                depth,
                multiplier,
                isForgeRecipe,
                isExpanded,
              );
            }
          }}
        >
          {todoMode && onToggleChecked && (
            <Checkbox
              checked={!!isChecked}
              onCheckedChange={() => onToggleChecked(internalname)}
              onClick={(e) => e.stopPropagation()}
              className="flex-shrink-0"
            />
          )}
          {hasIngredients && (
            <span className="text-muted-foreground flex-shrink-0">
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </span>
          )}
          {!hasIngredients && <span className="w-3.5 flex-shrink-0" />}

          <ItemImage
            entry={entry}
            internalname={internalname}
            alt={plainDisplayName}
            width={24}
            height={24}
            style={{ verticalAlign: "middle", flexShrink: 0 }}
          />

          <MinecraftColoredText
            text={displayName}
            className="text-sm font-medium text-foreground truncate"
            title={plainDisplayName}
          />

          <div className="ml-auto flex basis-full items-center justify-end gap-1 flex-shrink-0 sm:basis-auto sm:gap-2">
            {isForgeRecipe && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                FORGE
              </span>
            )}
            {isForgeRecipe && forgeTime && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/15 font-mono">
                {forgeTime}
                {forgeSettings.useMultipleSlots && multiplier > 1 && (
                  <span className="ml-1 opacity-70">
                    ({Math.min(multiplier, forgeSettings.forgeSlots)}s)
                  </span>
                )}
              </span>
            )}
            {isForgeRecipe && forgePlanTargetItemId && forgeRequirement && (
              <ForgeTreeTrackerControls
                planTargetItemId={forgePlanTargetItemId}
                itemName={plainDisplayName}
                requirement={forgeRequirement}
                forgeSettings={forgeSettings}
              />
            )}
            {isBaseMaterial && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                BASE
              </span>
            )}
            {wikiUrl && (
              <a
                href={wikiUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="hidden p-1 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors opacity-0 group-hover:opacity-100 sm:block"
                title="Open wiki page"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            <span className="font-mono text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
              {multiplier}x
            </span>
          </div>
        </div>
      </div>

      {isExpanded && hasIngredients && (
        <div>
          {Object.entries(counts).map(([name, count], index, arr) => (
            <RecipeTree
              key={name}
              internalname={name}
              multiplier={count * actualMultiplier}
              depth={depth + 1}
              visited={nextVisited}
              expandedItems={externalExpandedItems}
              onToggleExpanded={onToggleExpanded}
              forgeSettings={forgeSettings}
              isLastChild={index === arr.length - 1}
              ancestorLines={
                depth === 0 ? [] : [...ancestorLines, !isLastChild]
              }
              todoMode={todoMode}
              checkedItems={checkedItems}
              onToggleChecked={onToggleChecked}
              forgePlanTargetItemId={forgePlanTargetItemId}
              forgeRequirements={forgeRequirements}
            />
          ))}
        </div>
      )}
    </div>
  );
}

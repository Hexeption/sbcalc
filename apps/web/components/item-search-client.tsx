"use client";

import React, { useState } from "react";
import { ItemSearch } from "@/components/item-search";
import { RecipeTree } from "@/components/recipe-tree";
import { BaseRequirementsList } from "@/components/base-requirements-list";
import type { RecipesData } from "@/lib/types";
import { getDisplayName } from "@/lib/utils";
import { getTotalForgeTime, formatForgeTime } from "@/lib/forge-time-utils";
import {
  getBaseRequirements,
  getRecipe,
  getIngredientsFromRecipe,
  aggregateIngredients,
} from "@/lib/recipe-utils";
import { BASE_MATERIALS } from "@/lib/constants";
import recipesRaw from "@/data/recipes_items.json";
import itemsRaw from "@/data/items.json";

const recipes: RecipesData = recipesRaw as any;
const items: RecipesData = itemsRaw as any;

export function ItemSearchClient() {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [multiplier, setMultiplier] = useState<number>(1);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Helper function to get all expandable items in the recipe tree
  const getAllExpandableItems = (
    internalname: string,
    visited: Set<string> = new Set(),
  ): Set<string> => {
    if (visited.has(internalname)) return new Set();

    const entry = recipes[internalname];
    if (!entry) return new Set();

    const recipe = getRecipe(entry);
    if (!recipe) return new Set();

    const ingredients = getIngredientsFromRecipe(recipe);
    if (ingredients.length === 0) return new Set();

    const expandableItems = new Set<string>();
    const nextVisited = new Set(visited);
    nextVisited.add(internalname);

    const aggregated = aggregateIngredients(ingredients);
    for (const [name] of Object.entries(aggregated)) {
      if (recipes[name] && !BASE_MATERIALS.has(name)) {
        expandableItems.add(name);
        // Recursively get expandable items from this ingredient
        const nestedExpandable = getAllExpandableItems(name, nextVisited);
        nestedExpandable.forEach((item) => expandableItems.add(item));
      }
    }

    return expandableItems;
  };

  // Initialize expanded items when item changes
  React.useEffect(() => {
    if (selectedItem) {
      setExpandedItems(new Set([selectedItem]));
    }
  }, [selectedItem]);

  const handleToggleExpanded = (itemName: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemName)) {
      newExpanded.delete(itemName);
    } else {
      newExpanded.add(itemName);
    }
    setExpandedItems(newExpanded);
  };

  const handleExpandAll = () => {
    if (selectedItem) {
      const allExpandable = getAllExpandableItems(selectedItem);
      allExpandable.add(selectedItem); // Include the root item
      setExpandedItems(allExpandable);
    }
  };

  const handleCollapseAll = () => {
    if (selectedItem) {
      setExpandedItems(new Set([selectedItem])); // Keep only the root item expanded
    }
  };

  const baseRequirements = selectedItem
    ? getBaseRequirements(selectedItem, recipes, multiplier)
    : {};
  const totalMaterials = Object.keys(baseRequirements).length;
  const totalForgeTime = selectedItem
    ? getTotalForgeTime(selectedItem, recipes, multiplier)
    : 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="text-center py-8 px-4">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent mb-2">
          Skyblock Calculator
        </h1>
        <p className="text-muted-foreground text-lg">
          This page allows you to search for items.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 px-4 md:px-8 pb-8 h-[calc(100vh-200px)]">
        {/* Left column: Search and Settings */}
        <div className="w-full lg:w-80 lg:flex-shrink-0 space-y-6">
          <div className="bg-card p-6 rounded-xl border border-border">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">🔍</span>
              <span className="text-xl font-semibold">Search Items</span>
            </div>
            <ItemSearch
              onSelect={(item) => {
                setSelectedItem(item);
                setMultiplier(1);
              }}
            />
          </div>

          {/* Amount Controls */}
          {selectedItem && (
            <div className="bg-card p-6 rounded-xl border border-border">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">⚙️</span>
                <span className="text-xl font-semibold">Settings</span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={multiplier}
                    onChange={(e) =>
                      setMultiplier(Math.max(1, Number(e.target.value)))
                    }
                    className="w-full px-4 py-2 bg-input border-2 border-input rounded-lg text-foreground font-medium focus:border-primary focus:outline-none transition-colors"
                  />
                </div>

                {/* Summary Cards */}
                <div className="space-y-3">
                  <div className="bg-muted/80 rounded-lg p-3 border border-border/50">
                    <div className="text-muted-foreground text-sm mb-1">
                      Target Item
                    </div>
                    <div className="text-lg font-bold text-primary truncate">
                      {getDisplayName(
                        recipes[selectedItem],
                        selectedItem,
                        items,
                      )}
                    </div>
                  </div>

                  <div className="bg-muted/80 rounded-lg p-3 border border-border/50">
                    <div className="text-muted-foreground text-sm mb-1">
                      Quantity
                    </div>
                    <div className="text-lg font-bold text-primary">
                      {multiplier}
                    </div>
                  </div>

                  <div className="bg-muted/80 rounded-lg p-3 border border-border/50">
                    <div className="text-muted-foreground text-sm mb-1">
                      Total Materials
                    </div>
                    <div className="text-lg font-bold text-primary">
                      {totalMaterials}
                    </div>
                  </div>
                  {/* Total Forge Time */}
                  {totalForgeTime > 0 && (
                    <div className="bg-muted/80 rounded-lg p-3 border border-border/50">
                      <div className="text-muted-foreground text-sm mb-1">
                        Total Forge Time
                      </div>
                      <div className="text-lg font-bold text-primary">
                        {formatForgeTime(totalForgeTime)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right column: Main content */}
        {/* Right Column - Results */}
        <div className="flex-1 min-w-0 flex flex-col">
          {selectedItem ? (
            <div className="space-y-6 flex-1 flex flex-col">
              {/* Crafting Tree */}
              <div className="bg-card/60 backdrop-blur-sm rounded-xl p-6 border border-border flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🔧</span>
                    <span className="text-xl font-semibold">Crafting Tree</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleExpandAll}
                      className="px-3 py-1 bg-secondary border border-border rounded-md text-foreground hover:bg-secondary/80 transition-colors"
                    >
                      Expand All
                    </button>
                    <button
                      onClick={handleCollapseAll}
                      className="px-3 py-1 bg-secondary border border-border rounded-md text-foreground hover:bg-secondary/80 transition-colors"
                    >
                      Collapse All
                    </button>
                  </div>
                </div>
                <div className="bg-muted/80 rounded-xl p-6 border border-border/50 flex-1 overflow-auto">
                  <RecipeTree
                    internalname={selectedItem}
                    recipes={recipes}
                    multiplier={multiplier}
                    itemsData={items}
                    expandedItems={expandedItems}
                    onToggleExpanded={handleToggleExpanded}
                  />
                </div>
              </div>

              {/* Materials List */}
              <div className="bg-card/60 backdrop-blur-sm rounded-xl p-6 border border-border flex-1 flex flex-col mb-20">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-2xl">📋</span>
                  <span className="text-xl font-semibold">
                    Materials Needed
                  </span>
                </div>
                <div className="flex-1 overflow-auto">
                  <BaseRequirementsList
                    internalname={selectedItem}
                    recipes={recipes}
                    multiplier={multiplier}
                    itemsData={items}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-card/60 backdrop-blur-sm rounded-xl p-12 border border-border text-center flex-1 flex flex-col justify-center">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-muted-foreground mb-2">
                No Item Selected
              </h3>
              <p className="text-muted-foreground">
                Search and select an item to view its crafting requirements.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-card/60 backdrop-blur-sm fixed bottom-0 w-full">
        <div className="px-4 py-6 text-center">
          <p className="text-muted-foreground text-sm">
            made with <span className="text-red-500">♥</span> by{" "}
            <span className="font-semibold text-foreground">hexeption</span>
          </p>
        </div>
      </footer>
    </div>
  );
}

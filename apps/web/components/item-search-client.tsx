"use client";

import React, { useState } from "react";
import { Github, X, ChevronDown, ChevronUp } from "lucide-react";
import { ItemSearch } from "@/components/item-search";
import { RecipeTree } from "@/components/recipe-tree";
import { BaseRequirementsList } from "@/components/base-requirements-list";
import { ForgeSettings } from "@/components/forge-settings";
import type { RecipesData } from "@/lib/types";
import { getDisplayName } from "@/lib/utils";
import { getTotalForgeTime, formatForgeTime } from "@/lib/forge-time-utils";
import { useSettings } from "@/lib/settings-context";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@workspace/ui/components/card";
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
  const [searchValue, setSearchValue] = useState<string>("");
  const { settings } = useSettings();

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
    ? getTotalForgeTime(selectedItem, recipes, multiplier, new Set(), {
        forgeSlots: settings.forgeSlots,
        useMultipleSlots: settings.useMultipleSlots,
      })
    : 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="text-center py-8 px-4 relative">
        <div className="absolute top-4 right-4 md:top-8 md:right-8">
          <Button variant="outline" size="sm" asChild>
            <a
              href="https://github.com/Hexeption/sbcalc"
              target="_blank"
              rel="noopener noreferrer"
              title="View on GitHub"
              className="flex items-center gap-2"
            >
              <Github className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden sm:inline">GitHub</span>
            </a>
          </Button>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent mb-2">
          Skyblock Calculator
        </h1>
        <p className="text-muted-foreground text-lg">
          Calculate crafting recipes, forge times, and base material
          requirements for any Hypixel Skyblock item.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 px-4 md:px-8 pb-8 h-[calc(100vh-200px)]">
        {/* Left column: Search and Settings */}
        <div className="w-full lg:w-80 lg:flex-shrink-0 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3">
                  <span className="text-2xl">🔍</span>
                  Search Items
                </CardTitle>
                {selectedItem && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedItem(null);
                      setMultiplier(1);
                      setExpandedItems(new Set());
                      setSearchValue("");
                    }}
                    className="hover:bg-destructive hover:text-destructive-foreground"
                    title="Clear selection"
                  >
                    <X className="w-4 h-4" />
                    <span className="hidden sm:inline">Clear</span>
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <ItemSearch
                searchValue={searchValue}
                onSearchChange={setSearchValue}
                onSelect={(item) => {
                  setSelectedItem(item);
                  setMultiplier(1);
                }}
              />
            </CardContent>
          </Card>

          {/* Amount Controls */}
          {selectedItem && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <span className="text-2xl">⚙️</span>
                  Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label
                      htmlFor="quantity"
                      className="text-muted-foreground mb-2 block"
                    >
                      Quantity
                    </Label>
                    <Input
                      id="quantity"
                      type="number"
                      min={1}
                      value={multiplier}
                      onChange={(e) =>
                        setMultiplier(Math.max(1, Number(e.target.value)))
                      }
                    />
                  </div>

                  {/* Forge Settings */}
                  <div className="border-t border-border pt-4">
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">
                      Forge Settings
                    </h4>
                    <ForgeSettings />
                  </div>

                  {/* Total Forge Time */}
                  {totalForgeTime > 0 && (
                    <div className="bg-muted/80 rounded-lg p-3 border border-border/50">
                      <div className="text-muted-foreground text-sm mb-1">
                        Total Forge Time
                        {settings.useMultipleSlots && (
                          <span className="ml-1 text-xs">
                            (optimized for {settings.forgeSlots} slots)
                          </span>
                        )}
                      </div>
                      <div className="text-lg font-bold text-primary">
                        {formatForgeTime(totalForgeTime)}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column: Main content */}
        {/* Right Column - Results */}
        <div className="flex-1 min-w-0 flex flex-col">
          {selectedItem ? (
            <div className="space-y-6 flex-1 flex flex-col">
              {/* Summary Cards Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-muted/80 rounded-lg p-3 border border-border/50">
                  <div className="text-muted-foreground text-xs mb-1">
                    Target Item
                  </div>
                  <div className="text-sm font-bold text-primary truncate">
                    {getDisplayName(recipes[selectedItem], selectedItem, items)}
                  </div>
                </div>

                <div className="bg-muted/80 rounded-lg p-3 border border-border/50">
                  <div className="text-muted-foreground text-xs mb-1">
                    Quantity
                  </div>
                  <div className="text-sm font-bold text-primary">
                    {multiplier}
                  </div>
                </div>

                <div className="bg-muted/80 rounded-lg p-3 border border-border/50">
                  <div className="text-muted-foreground text-xs mb-1">
                    Total Materials
                  </div>
                  <div className="text-sm font-bold text-primary">
                    {totalMaterials}
                  </div>
                </div>

                <div className="bg-muted/80 rounded-lg p-3 border border-border/50">
                  <div className="text-muted-foreground text-xs mb-1">
                    Forge Slots
                  </div>
                  <div className="text-sm font-bold text-primary">
                    {settings.forgeSlots}
                    {settings.useMultipleSlots && (
                      <span className="text-xs text-muted-foreground ml-1">
                        (parallel)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Crafting Tree */}
              <Card className="flex-1 flex flex-col">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-3">
                      <span className="text-2xl">🔧</span>
                      Crafting Tree
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExpandAll}
                      >
                        <ChevronDown className="w-4 h-4 mr-1" />
                        <span className="hidden sm:inline">Expand All</span>
                        <span className="sm:hidden">Expand</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCollapseAll}
                      >
                        <ChevronUp className="w-4 h-4 mr-1" />
                        <span className="hidden sm:inline">Collapse All</span>
                        <span className="sm:hidden">Collapse</span>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="bg-muted/80 rounded-xl p-6 border border-border/50 flex-1 overflow-auto">
                    <RecipeTree
                      internalname={selectedItem}
                      recipes={recipes}
                      multiplier={multiplier}
                      itemsData={items}
                      expandedItems={expandedItems}
                      onToggleExpanded={handleToggleExpanded}
                      forgeSettings={{
                        forgeSlots: settings.forgeSlots,
                        useMultipleSlots: settings.useMultipleSlots,
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Materials List */}
              <Card className="flex-1 flex flex-col mb-20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <span className="text-2xl">📋</span>
                    Materials Needed
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-auto">
                  <BaseRequirementsList
                    internalname={selectedItem}
                    recipes={recipes}
                    multiplier={multiplier}
                    itemsData={items}
                  />
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="text-center flex-1 flex flex-col justify-center">
              <CardContent>
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-muted-foreground mb-2">
                  No Item Selected
                </h3>
                <p className="text-muted-foreground">
                  Search and select an item to view its crafting requirements.
                </p>
              </CardContent>
            </Card>
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

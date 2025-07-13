"use client";

import React, { useState } from "react";
import { Github, X, ChevronDown, ChevronUp } from "lucide-react";
import { ItemSearch } from "@/components/item-search";
import { RecipeTree } from "@/components/recipe-tree";
import { BaseRequirementsList } from "@/components/base-requirements-list";
import { ForgeSettings } from "@/components/forge-settings";
import { RecipeSummaryCards } from "@/components/recipe-summary-cards";
import type { RecipesData } from "@/lib/types";
import { getDisplayName } from "@/lib/utils";
import { getTotalForgeTime } from "@/lib/forge-time-utils";
import { useSettings } from "@/lib/settings-context";
import { useRecipeTreeExpansion } from "@/hooks/use-recipe-tree-expansion";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@workspace/ui/components/card";
import { getBaseRequirements } from "@/lib/recipe-utils";
import recipesRaw from "@/data/recipes_items.json";
import itemsRaw from "@/data/items.json";

const recipes: RecipesData = recipesRaw as any;
const items: RecipesData = itemsRaw as any;

export function ItemSearchClient() {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [multiplier, setMultiplier] = useState<number>(1);
  const [searchValue, setSearchValue] = useState<string>("");
  const { settings } = useSettings();

  const {
    expandedItems,
    handleToggleExpanded,
    handleExpandAll,
    handleCollapseAll,
  } = useRecipeTreeExpansion(selectedItem, recipes);

  const baseRequirements = selectedItem
    ? getBaseRequirements(selectedItem, recipes, multiplier)
    : {};
  const totalMaterials = Object.keys(baseRequirements).length;
  const totalForgeTime = selectedItem
    ? getTotalForgeTime(selectedItem, recipes, multiplier, new Set(), {
        forgeSlots: settings.forgeSlots,
        useMultipleSlots: settings.useMultipleSlots,
        quickForgeLevel: settings.quickForgeLevel,
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
              <RecipeSummaryCards
                selectedItem={selectedItem}
                multiplier={multiplier}
                totalMaterials={totalMaterials}
                totalForgeTime={totalForgeTime}
                forgeSlots={settings.forgeSlots}
                useMultipleSlots={settings.useMultipleSlots}
                recipes={recipes}
                items={items}
              />

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
                        quickForgeLevel: settings.quickForgeLevel,
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

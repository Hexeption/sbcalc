"use client";

import { Button } from "@workspace/ui/components/button";
import { Clipboard, Heart, RotateCcw, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BaseRequirementsList } from "@/components/base-requirements-list";
import { CraftingTreeSingle } from "@/components/crafting-tree-single";
import { HeaderBar } from "@/components/header-bar";
import { InventoryPanel } from "@/components/inventory-panel";
import { RecipeSummaryCards } from "@/components/recipe-summary-cards";
import { SingleItemPanel } from "@/components/single-item-panel";
import { useRecipeTreeExpansion } from "@/hooks/use-recipe-tree-expansion";
import { useSharedRecipe } from "@/hooks/use-shared-recipe";
import { useSharedRecipeLoader } from "@/hooks/use-shared-recipe-loader";
import { useCalculatorStore } from "@/lib/calculator-store";
import { getNetTree, summarizeNetTree } from "@/lib/net-requirements";
import { useRecipeData } from "@/lib/recipe-data-context";
import { getDisplayName } from "@/lib/utils";

export function SkyblockCalculatorClient() {
  const {
    selectedItem,
    setSelectedItem,
    multiplier,
    setMultiplier,
    searchValue,
    setSearchValue,
    settings,
    updateSettings,
    getRecipeState,
    hydrate,
    inventory,
    setInventoryItem,
    addToInventory,
    clearInventory,
  } = useCalculatorStore();

  const { recipes, itemsData } = useRecipeData();
  const { sharedState } = useSharedRecipe();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const loaderActions = useMemo(
    () => ({
      setSelectedItem,
      setMultiplier,
      updateSettings,
    }),
    [setSelectedItem, setMultiplier, updateSettings],
  );
  useSharedRecipeLoader(sharedState, loaderActions);

  useEffect(() => {
    if (selectedItem) {
      const item = recipes[selectedItem];
      if (item) {
        const displayNameColored = getDisplayName(
          item,
          selectedItem,
          itemsData,
        );
        setSearchValue(displayNameColored.replace(/§./g, ""));
      }
    }
  }, [selectedItem, recipes, itemsData, setSearchValue]);

  const {
    expandedItems,
    handleToggleExpanded,
    handleExpandAll,
    handleCollapseAll,
  } = useRecipeTreeExpansion(selectedItem);

  const forgeSettings = useMemo(
    () => ({
      forgeSlots: settings.forgeSlots,
      useMultipleSlots: settings.useMultipleSlots,
      quickForgeLevel: settings.quickForgeLevel,
    }),
    [settings.forgeSlots, settings.useMultipleSlots, settings.quickForgeLevel],
  );

  // The net requirements tree (after deducting inventory) drives the tree, the
  // materials list, and the summary headline.
  const netTree = useMemo(
    () =>
      selectedItem
        ? getNetTree(
            selectedItem,
            recipes,
            multiplier,
            inventory,
            forgeSettings,
            itemsData,
          )
        : null,
    [selectedItem, recipes, multiplier, inventory, forgeSettings, itemsData],
  );

  const { listItems, totalMaterials, totalForgeTime } = useMemo(() => {
    if (!netTree)
      return { listItems: [], totalMaterials: 0, totalForgeTime: 0 };
    const summary = summarizeNetTree(netTree);
    const items = Array.from(summary.byName, ([name, v]) => ({
      name,
      net: v.net,
    })).sort((a, b) => b.net - a.net);
    return {
      listItems: items,
      totalMaterials: summary.baseMaterialTypes,
      totalForgeTime: summary.totalForgeSeconds,
    };
  }, [netTree]);

  const handleAddToInventory = useCallback(
    (name: string, qty: number) => addToInventory(name, Math.max(1, qty)),
    [addToInventory],
  );

  // Reset the selection and clear the inventory.
  const handleReset = useCallback(() => {
    clearInventory();
    setSelectedItem(null);
    setMultiplier(1);
    setSearchValue("");
  }, [clearInventory, setSelectedItem, setMultiplier, setSearchValue]);

  const [sidebarWidth, setSidebarWidth] = useState(340);
  const isResizing = useRef(false);

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isResizing.current = true;
      const startX = e.clientX;
      const startWidth = sidebarWidth;

      const onMouseMove = (ev: MouseEvent) => {
        if (!isResizing.current) return;
        const newWidth = Math.min(
          Math.max(startWidth + ev.clientX - startX, 260),
          600,
        );
        setSidebarWidth(newWidth);
      };

      const onMouseUp = () => {
        isResizing.current = false;
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [sidebarWidth],
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col overflow-hidden">
      <HeaderBar />

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Sidebar */}
        <aside
          className="sidebar-panel shrink-0 border-b md:border-b-0 md:border-r border-border/60 bg-card/30 overflow-y-auto overflow-x-hidden"
          style={{ "--sidebar-w": `${sidebarWidth}px` } as React.CSSProperties}
        >
          <div className="p-4 space-y-4">
            <SingleItemPanel
              selectedItem={selectedItem}
              searchValue={searchValue}
              multiplier={multiplier}
              onSearchChange={setSearchValue}
              onSelectItem={setSelectedItem}
              onMultiplierChange={setMultiplier}
              onClear={handleReset}
              recipeState={{
                recipes: getRecipeState(),
                forgeSettings,
              }}
            />
          </div>
        </aside>

        {/* Resize handle */}
        <div
          className="hidden md:flex w-1.5 cursor-col-resize items-center justify-center hover:bg-border/40 active:bg-border/60 transition-colors shrink-0"
          onMouseDown={handleResizeStart}
        >
          <div className="w-px h-8 bg-border/60 rounded-full" />
        </div>

        {/* Main content */}
        <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden">
          {selectedItem && netTree ? (
            <div className="p-4 md:p-6 space-y-5">
              <RecipeSummaryCards
                selectedItem={selectedItem}
                multiplier={multiplier}
                totalMaterials={totalMaterials}
                totalForgeTime={totalForgeTime}
                forgeSlots={settings.forgeSlots}
                useMultipleSlots={settings.useMultipleSlots}
              />

              {/* Inventory on top of the tree */}
              <InventoryPanel
                inventory={inventory}
                onAddItem={(name) => addToInventory(name, 1)}
                onSetItem={setInventoryItem}
                onClear={clearInventory}
              />

              {/* Tree (left) and remaining-materials list (right) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
                <CraftingTreeSingle
                  node={netTree}
                  expandedItems={expandedItems}
                  onExpandAll={handleExpandAll}
                  onCollapseAll={handleCollapseAll}
                  onToggleExpanded={handleToggleExpanded}
                  forgeSettings={forgeSettings}
                  onAddToInventory={handleAddToInventory}
                />

                <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm">
                  <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border/40">
                    <div className="flex items-center gap-3">
                      <Clipboard className="w-4 h-4 text-primary" />
                      <h3 className="font-semibold text-sm">Still Needed</h3>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleReset}
                      className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                    >
                      <RotateCcw className="w-3.5 h-3.5 mr-1" />
                      Reset
                    </Button>
                  </div>
                  <div className="p-5">
                    <BaseRequirementsList
                      items={listItems}
                      onAddToInventory={handleAddToInventory}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center min-h-[60vh]">
              <div className="text-center max-w-sm mx-auto px-4">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Search className="w-7 h-7 text-primary/60" />
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                  Search for an item
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Select an item from the search to view its full crafting tree
                  and material requirements.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>

      <footer className="border-t border-border/40 bg-card/40 backdrop-blur-sm py-3">
        <p className="text-muted-foreground text-xs text-center">
          made with{" "}
          <Heart className="w-3 h-3 inline text-red-500 fill-current" /> by{" "}
          <span className="font-medium text-foreground">hexeption</span>
        </p>
      </footer>
    </div>
  );
}

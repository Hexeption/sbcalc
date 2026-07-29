"use client";

import { Button } from "@workspace/ui/components/button";
import { ChevronDown, ChevronUp, ListChecks, Wrench, X } from "lucide-react";
import { useMemo } from "react";
import { MinecraftColoredText } from "@/components/minecraft-colored-text";
import { RecipeTree } from "@/components/recipe-tree";
import { getForgeRequirements } from "@/lib/forge-tracker-utils";
import { useRecipeData } from "@/lib/recipe-data-context";
import { getDisplayName } from "@/lib/utils";

export function CraftingTreeMulti(props: {
  selectedItemId: string;
  itemList: { itemId: string; quantity: number }[];
  expandedItems: Set<string>;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onToggleExpanded: (id: string) => void;
  onClose: () => void;
  forgeSettings: {
    forgeSlots: number;
    useMultipleSlots: boolean;
    quickForgeLevel: number;
  };
  todoMode: boolean;
  onToggleTodoMode: () => void;
  checkedItems: Set<string>;
  onToggleChecked: (id: string) => void;
}) {
  const {
    selectedItemId,
    itemList,
    expandedItems,
    onExpandAll,
    onCollapseAll,
    onToggleExpanded,
    onClose,
    forgeSettings,
    todoMode,
    onToggleTodoMode,
    checkedItems,
    onToggleChecked,
  } = props;

  const { recipes, itemsData } = useRecipeData();

  const multiplier =
    itemList.find((i) => i.itemId === selectedItemId)?.quantity || 1;
  const displayName = getDisplayName(
    recipes[selectedItemId],
    selectedItemId,
    itemsData,
  );
  const plainDisplayName = displayName.replace(/(?:\u00c2)?\u00a7./g, "");
  const forgeRequirements = useMemo(
    () =>
      new Map(
        getForgeRequirements(selectedItemId, multiplier, recipes).map(
          (requirement) => [requirement.treePathId, requirement] as const,
        ),
      ),
    [selectedItemId, multiplier, recipes],
  );

  return (
    <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border/40">
        <div className="flex items-center gap-2">
          <Wrench className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm flex items-center gap-1.5">
            Tree &mdash;
            <MinecraftColoredText text={displayName} title={plainDisplayName} />
          </h3>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleTodoMode}
            className={`h-7 px-2 text-xs ${todoMode ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"}`}
          >
            <ListChecks className="w-3.5 h-3.5 mr-1" />
            Todo
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onExpandAll}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <ChevronDown className="w-3.5 h-3.5 mr-1" />
            Expand
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCollapseAll}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <ChevronUp className="w-3.5 h-3.5 mr-1" />
            Collapse
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
      <div className="p-4 overflow-auto">
        <RecipeTree
          internalname={selectedItemId}
          multiplier={multiplier}
          expandedItems={expandedItems}
          onToggleExpanded={onToggleExpanded}
          forgeSettings={forgeSettings}
          todoMode={todoMode}
          checkedItems={checkedItems}
          onToggleChecked={onToggleChecked}
          forgePlanTargetItemId={selectedItemId}
          forgeRequirements={forgeRequirements}
          forgeTreePath={[selectedItemId]}
        />
      </div>
    </div>
  );
}

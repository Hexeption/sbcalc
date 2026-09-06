"use client";

import { Button } from "@workspace/ui/components/button";
import { ChevronDown, ChevronUp, Wrench } from "lucide-react";
import { RecipeTree } from "@/components/recipe-tree";
import type { NetTreeNode } from "@/lib/net-requirements";
import type { ForgeSettings } from "@/lib/types";

export function CraftingTreeSingle(props: {
  node: NetTreeNode;
  expandedItems: Set<string>;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onToggleExpanded: (id: string) => void;
  forgeSettings: ForgeSettings;
  onAddToInventory: (name: string, qty: number) => void;
}) {
  const {
    node,
    expandedItems,
    onExpandAll,
    onCollapseAll,
    onToggleExpanded,
    forgeSettings,
    onAddToInventory,
  } = props;

  return (
    <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border/40">
        <div className="flex items-center gap-2">
          <Wrench className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">Crafting Tree</h3>
        </div>
        <div className="flex gap-1">
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
        </div>
      </div>
      <div className="p-4 overflow-auto">
        {node.net > 0 ? (
          <RecipeTree
            node={node}
            expandedItems={expandedItems}
            onToggleExpanded={onToggleExpanded}
            forgeSettings={forgeSettings}
            onAddToInventory={onAddToInventory}
          />
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">
            You already have everything in your inventory.
          </p>
        )}
      </div>
    </div>
  );
}

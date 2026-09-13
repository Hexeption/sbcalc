"use client";

import { Button } from "@workspace/ui/components/button";
import { PackagePlus } from "lucide-react";
import { MinecraftColoredText } from "@/components/minecraft-colored-text";
import { useRecipeData } from "@/lib/recipe-data-context";
import { getDisplayName } from "@/lib/utils";
import { ItemImage } from "./item-image";

interface BaseRequirementsListProps {
  /** Net amounts still needed per item (already sorted), after inventory. */
  items: Array<{ name: string; net: number }>;
  onAddToInventory: (name: string, qty: number) => void;
}

export function BaseRequirementsList({
  items,
  onAddToInventory,
}: BaseRequirementsListProps) {
  const { recipes, itemsData } = useRecipeData();

  if (items.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        <PackagePlus className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p className="text-sm">
          Nothing left to gather — your inventory covers it all.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {items.map((row) => {
        const entry = recipes[row.name] ?? itemsData[row.name];
        const displayName = getDisplayName(entry, row.name, itemsData);
        const plainDisplayName = displayName.replace(/§./g, "");

        return (
          <div
            key={row.name}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/40 transition-colors group"
          >
            <ItemImage
              entry={entry}
              internalname={row.name}
              alt={plainDisplayName}
              width={24}
              height={24}
              style={{ verticalAlign: "middle" }}
            />
            <div className="flex-1 min-w-0">
              <MinecraftColoredText
                text={displayName}
                className="text-sm font-medium text-foreground block truncate"
                title={plainDisplayName}
              />
              <div className="text-[10px] text-muted-foreground font-mono">
                {row.name}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => onAddToInventory(row.name, row.net)}
              className="opacity-0 group-hover:opacity-100 flex-shrink-0"
              title="Add to inventory"
              aria-label={`Add ${row.net} ${plainDisplayName} to inventory`}
            >
              <PackagePlus />
            </Button>
            <span className="font-mono text-sm font-semibold text-primary flex-shrink-0">
              {row.net.toLocaleString()}
            </span>
          </div>
        );
      })}

      <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between px-3">
        <span className="text-xs text-muted-foreground">Total types</span>
        <span className="font-mono text-sm font-bold text-primary">
          {items.length}
        </span>
      </div>
    </div>
  );
}

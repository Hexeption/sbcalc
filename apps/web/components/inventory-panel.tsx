"use client";

import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Boxes, X } from "lucide-react";
import { ItemSearch } from "@/components/item-search";
import { MinecraftColoredText } from "@/components/minecraft-colored-text";
import { useRecipeData } from "@/lib/recipe-data-context";
import { getDisplayName } from "@/lib/utils";
import { ItemImage } from "./item-image";

export function InventoryPanel(props: {
  inventory: Map<string, number>;
  onAddItem: (name: string) => void;
  onSetItem: (name: string, qty: number) => void;
  onClear: () => void;
}) {
  const { inventory, onAddItem, onSetItem, onClear } = props;
  const { recipes, itemsData } = useRecipeData();
  const entries = Array.from(inventory.entries());

  return (
    <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-border/40">
        <div className="flex items-center gap-2">
          <Boxes className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">My Inventory</h3>
          {entries.length > 0 && (
            <span className="text-xs text-muted-foreground">
              ({entries.length})
            </span>
          )}
        </div>
        {entries.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
          >
            <X className="w-3.5 h-3.5 mr-1" />
            Clear
          </Button>
        )}
      </div>
      <div className="p-4 space-y-3">
        <ItemSearch onSelect={(item) => onAddItem(item)} />

        {entries.length === 0 ? (
          <p className="text-xs text-muted-foreground px-1">
            Add items you already have — the tree and list below update to show
            only what you still need.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
            {entries.map(([name, qty]) => {
              const entry = recipes[name] ?? itemsData[name];
              const displayName = getDisplayName(entry, name, itemsData);
              const plainDisplayName = displayName.replace(/§./g, "");

              return (
                <div
                  key={name}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg border border-border/40 bg-muted/20"
                >
                  <ItemImage
                    entry={entry}
                    internalname={name}
                    alt={plainDisplayName}
                    width={20}
                    height={20}
                    style={{ flexShrink: 0 }}
                  />
                  <MinecraftColoredText
                    text={displayName}
                    className="text-xs font-medium truncate flex-1 min-w-0"
                    title={plainDisplayName}
                  />
                  <Input
                    type="number"
                    min={1}
                    value={qty}
                    onChange={(e) =>
                      onSetItem(name, Math.max(0, Number(e.target.value)))
                    }
                    className="h-7 w-16 text-xs px-2 flex-shrink-0"
                    aria-label={`${plainDisplayName} quantity`}
                  />
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => onSetItem(name, 0)}
                    className="flex-shrink-0 text-muted-foreground hover:text-destructive"
                    aria-label={`Remove ${plainDisplayName} from inventory`}
                  >
                    <X />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

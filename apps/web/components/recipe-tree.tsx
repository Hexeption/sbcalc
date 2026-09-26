"use client";

import { Button } from "@workspace/ui/components/button";
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  PackagePlus,
} from "lucide-react";
import type React from "react";
import { MinecraftColoredText } from "@/components/minecraft-colored-text";
import { trackRecipeTreeItemClick } from "@/lib/analytics";
import { formatForgeTime } from "@/lib/forge-time-utils";
import type { NetTreeNode } from "@/lib/net-requirements";
import { useRecipeData } from "@/lib/recipe-data-context";
import type { ForgeSettings } from "@/lib/types";
import { getDisplayName } from "@/lib/utils";
import { ItemImage } from "./item-image";

interface RecipeTreeProps {
  node: NetTreeNode;
  depth?: number;
  expandedItems: Set<string>;
  onToggleExpanded: (itemName: string) => void;
  forgeSettings: ForgeSettings;
  onAddToInventory: (name: string, qty: number) => void;
  isLastChild?: boolean;
  ancestorLines?: boolean[];
}

export function RecipeTree({
  node,
  depth = 0,
  expandedItems,
  onToggleExpanded,
  forgeSettings,
  onAddToInventory,
  isLastChild = true,
  ancestorLines = [],
}: RecipeTreeProps): React.ReactElement | null {
  const { recipes, itemsData } = useRecipeData();

  const { internalname, net, isBase, isForge, children } = node;
  const entry = recipes[internalname] ?? itemsData[internalname];
  if (!entry) return null;

  const hasIngredients = children.length > 0;
  const isExpanded = expandedItems.has(internalname);

  const displayName = getDisplayName(entry, internalname, itemsData);
  const plainDisplayName = displayName.replace(/§./g, "");

  const forgeTime =
    isForge && node.forgeTimeSeconds > 0
      ? formatForgeTime(node.forgeTimeSeconds)
      : undefined;

  const wikiUrl =
    entry.infoType === "WIKI_URL" && entry.info?.length
      ? (entry.info.find((u) => u.includes("wiki.hypixel.net")) ??
        entry.info[0])
      : undefined;

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
          className={`group flex items-center gap-3 px-3 py-2 my-0.5 rounded-lg transition-all flex-1 min-w-0 ${
            hasIngredients ? "cursor-pointer hover:bg-accent/30" : ""
          } ${isBase ? "bg-emerald-500/5 border border-emerald-500/15" : "hover:bg-muted/50"}`}
          onClick={() => {
            if (hasIngredients) {
              onToggleExpanded(internalname);
              trackRecipeTreeItemClick(
                internalname,
                displayName,
                depth,
                net,
                isForge,
                isExpanded,
              );
            }
          }}
        >
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

          <div className="ml-auto flex items-center gap-2 flex-shrink-0">
            {isForge && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                FORGE
              </span>
            )}
            {isForge && forgeTime && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/15 font-mono">
                {forgeTime}
                {forgeSettings.useMultipleSlots && net > 1 && (
                  <span className="ml-1 opacity-70">
                    ({Math.min(net, forgeSettings.forgeSlots)}s)
                  </span>
                )}
              </span>
            )}
            {isBase && (
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
                className="p-1 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors opacity-0 group-hover:opacity-100"
                title="Open wiki page"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={(e) => {
                e.stopPropagation();
                onAddToInventory(internalname, net);
              }}
              className="opacity-0 group-hover:opacity-100"
              title="Add to inventory"
              aria-label={`Add ${net} ${plainDisplayName} to inventory`}
            >
              <PackagePlus />
            </Button>
            <span className="font-mono text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
              {net.toLocaleString()}x
            </span>
          </div>
        </div>
      </div>

      {isExpanded && hasIngredients && (
        <div>
          {children.map((child, index, arr) => (
            <RecipeTree
              key={child.path}
              node={child}
              depth={depth + 1}
              expandedItems={expandedItems}
              onToggleExpanded={onToggleExpanded}
              forgeSettings={forgeSettings}
              onAddToInventory={onAddToInventory}
              isLastChild={index === arr.length - 1}
              ancestorLines={
                depth === 0 ? [] : [...ancestorLines, !isLastChild]
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

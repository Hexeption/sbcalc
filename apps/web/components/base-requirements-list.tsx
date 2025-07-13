"use client";

import React from "react";
import type { RecipesData } from "@/lib/types";
import { getDisplayName } from "@/lib/utils";
import { getBaseRequirements } from "@/lib/recipe-utils";
import { ItemImage } from "./item-image";

interface BaseRequirementsListProps {
  internalname: string;
  recipes: RecipesData;
  multiplier: number;
  itemsData?: RecipesData;
}

export function BaseRequirementsList({
  internalname,
  recipes,
  multiplier,
  itemsData,
}: BaseRequirementsListProps) {
  const baseRequirements = getBaseRequirements(
    internalname,
    recipes,
    multiplier,
  );

  // Sort by quantity descending
  const sortedRequirements = Object.entries(baseRequirements).sort(
    ([, a], [, b]) => b - a,
  );

  if (sortedRequirements.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <div className="text-4xl mb-2">📦</div>
        <p>No base materials required</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sortedRequirements.map(([name, count]) => {
        const entry = recipes[name];
        const displayName = getDisplayName(entry, name, itemsData);

        return (
          <div
            key={name}
            className="flex items-center justify-between p-4 bg-card rounded-lg border border-border hover:border-border/80 transition-colors"
          >
            <div className="flex items-center gap-3">
              <ItemImage
                entry={entry}
                internalname={name}
                alt={displayName}
                width={32}
                height={32}
                style={{ verticalAlign: "middle" }}
                itemsData={itemsData}
              />
              <div>
                <div className="font-medium text-foreground">{displayName}</div>
                <div className="text-xs text-muted-foreground">{name}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-primary">
                ×{count.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">needed</div>
            </div>
          </div>
        );
      })}

      <div className="mt-6 p-4 bg-muted rounded-lg border border-border">
        <div className="text-center">
          <div className="text-sm text-muted-foreground mb-1">
            Total Materials
          </div>
          <div className="text-2xl font-bold text-primary">
            {sortedRequirements.length} types
          </div>
        </div>
      </div>
    </div>
  );
}

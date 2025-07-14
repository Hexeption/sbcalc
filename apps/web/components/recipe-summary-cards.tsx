"use client";

import React, { useEffect } from "react";
import type { RecipesData } from "@/lib/types";
import { getDisplayName } from "@/lib/utils";
import { formatForgeTime } from "@/lib/forge-time-utils";
import { trackRecipeSummaryView } from "@/lib/analytics";

interface RecipeSummaryCardsProps {
  selectedItem: string;
  multiplier: number;
  totalMaterials: number;
  totalForgeTime: number;
  forgeSlots: number;
  useMultipleSlots: boolean;
  recipes: RecipesData;
  items: RecipesData;
}

interface SummaryCardProps {
  label: string;
  value: string;
  subtitle?: string;
}

function SummaryCard({ label, value, subtitle }: SummaryCardProps) {
  return (
    <div className="bg-muted/80 rounded-lg p-3 border border-border/50">
      <div className="text-muted-foreground text-xs mb-1">{label}</div>
      <div className="text-sm font-bold text-primary truncate">
        {value}
        {subtitle && (
          <span className="text-xs text-muted-foreground ml-1">{subtitle}</span>
        )}
      </div>
    </div>
  );
}

export function RecipeSummaryCards({
  selectedItem,
  multiplier,
  totalMaterials,
  totalForgeTime,
  forgeSlots,
  useMultipleSlots,
  recipes,
  items,
}: RecipeSummaryCardsProps) {
  const displayName = getDisplayName(
    recipes[selectedItem],
    selectedItem,
    items,
  );
  const forgeSlotText = useMultipleSlots ? "(parallel)" : "";
  const forgeTimeSubtitle = useMultipleSlots
    ? `(optimized for ${forgeSlots} slots)`
    : "";

  // Track recipe summary view
  useEffect(() => {
    trackRecipeSummaryView(
      selectedItem,
      displayName,
      multiplier,
      totalMaterials,
      totalForgeTime,
      forgeSlots,
      useMultipleSlots,
    );
  }, [
    selectedItem,
    multiplier,
    totalMaterials,
    totalForgeTime,
    forgeSlots,
    useMultipleSlots,
    displayName,
  ]);

  return (
    <div
      className={`grid gap-3 ${
        totalForgeTime > 0
          ? "grid-cols-2 md:grid-cols-5"
          : "grid-cols-2 md:grid-cols-4"
      }`}
    >
      <SummaryCard label="Target Item" value={displayName} />
      <SummaryCard label="Quantity" value={multiplier.toString()} />
      <SummaryCard label="Total Materials" value={totalMaterials.toString()} />
      <SummaryCard
        label="Forge Slots"
        value={forgeSlots.toString()}
        subtitle={forgeSlotText}
      />
      {totalForgeTime > 0 && (
        <SummaryCard
          label={`Total Forge Time${forgeTimeSubtitle ? ` ${forgeTimeSubtitle}` : ""}`}
          value={formatForgeTime(totalForgeTime)}
        />
      )}
    </div>
  );
}

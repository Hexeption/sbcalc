"use client";

import React from "react";
import type { RecipeEntry, RecipesData } from "@/lib/types";
import { extractFromSNBT } from "@/lib/utils";
import { getMappedItemId } from "@/lib/item-id-mappings";

interface ItemImageProps {
  entry: RecipeEntry | undefined;
  internalname: string;
  alt: string;
  width?: number;
  height?: number;
  style?: React.CSSProperties;
  itemsData?: RecipesData;
}

export function ItemImage({
  entry,
  internalname,
  alt,
  width = 24,
  height = 24,
  style,
  itemsData,
}: ItemImageProps) {
  const [src, setSrc] = React.useState<string | null>(null);

  React.useEffect(() => {
    let currentEntry = entry;

    // If no entry in recipes, try to get from items data
    if (!currentEntry && itemsData) {
      currentEntry = itemsData[internalname];
    }

    if (!currentEntry) {
      // No entry exists in either data source
      setSrc(null);
      return;
    }

    // Player head logic
    if (currentEntry.itemid === "minecraft:skull" && currentEntry.nbttag) {
      const { textureUrl } = extractFromSNBT(currentEntry.nbttag);
      setSrc(textureUrl || "https://mc-heads.net/head/Steve");
      return;
    }

    // Use ItemModel from nbttag if present, otherwise fallback to itemid
    let modelId: string | null = null;
    if (currentEntry.nbttag) {
      const { itemModel } = extractFromSNBT(currentEntry.nbttag);
      if (itemModel) modelId = itemModel;
    }

    // Fallback to itemid
    if (!modelId && currentEntry.itemid) {
      modelId = currentEntry.itemid.replace("minecraft:", "");
    }

    if (modelId) {
      // Apply old-to-new item ID mapping
      const mappedId = getMappedItemId(
        modelId,
        currentEntry.damage,
        currentEntry.nbttag,
      );
      setSrc(`https://minecraftitemids.com/item/32/${mappedId}.png`);
    } else {
      setSrc(null);
    }
  }, [entry, internalname, itemsData]);

  if (!src) {
    // Show a fallback icon when no image is found
    return (
      <div
        className="rounded-md border border-border bg-muted flex items-center justify-center text-muted-foreground text-xs"
        style={{
          width: width,
          height: height,
          fontSize: Math.min(width, height) * 0.4,
        }}
      >
        ?
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className="rounded-md bg-muted object-contain max-h-fit"
      style={{
        imageRendering: "pixelated",
        ...style,
      }}
    />
  );
}

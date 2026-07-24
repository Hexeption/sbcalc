"use client";

import React from "react";
import { getMappingInfo } from "@/lib/item-id-mappings";
import { useRecipeData } from "@/lib/recipe-data-context";
import {
  type TextureInfo,
  useTexturePackStore,
} from "@/lib/texture-pack-store";
import type { RecipeEntry } from "@/lib/types";
import { extractFromSNBT } from "@/lib/utils";

interface ItemImageProps {
  entry: RecipeEntry | undefined;
  internalname: string;
  alt: string;
  width?: number;
  height?: number;
  style?: React.CSSProperties;
}

// Animated spritesheet rendered via CSS steps() animation
function AnimatedTexture({
  texture,
  alt,
  width,
  height,
  style,
}: {
  texture: TextureInfo;
  alt: string;
  width: number;
  height: number;
  style?: React.CSSProperties;
}) {
  // Each frame is a square region in a vertical spritesheet.
  // frametime is in Minecraft ticks (1 tick = 50ms).
  const durationMs = texture.frameCount * texture.frametime * 50;
  const animName = `sprite-${React.useId().replace(/:/g, "")}`;

  return (
    <div
      role="img"
      aria-label={alt}
      className="rounded-md bg-muted shrink-0"
      style={{
        width,
        height,
        overflow: "hidden",
        ...style,
      }}
    >
      <style>{`
        @keyframes ${animName} {
          from { transform: translateY(0); }
          to { transform: translateY(-${(texture.frameCount - 1) * height}px); }
        }
      `}</style>
      <img
        src={texture.url}
        alt=""
        draggable={false}
        style={{
          width,
          height: height * texture.frameCount,
          imageRendering: "pixelated",
          animation: `${animName} ${durationMs}ms steps(${texture.frameCount - 1}) infinite`,
        }}
      />
    </div>
  );
}

// Build candidate texture paths for a given model ID.
// All vanilla textures live flat in public/vanilla/.
function getVanillaPaths(id: string, isEnchanted: boolean): string[] {
  const paths: string[] = [];
  if (isEnchanted) {
    paths.push(`/vanilla/enchanted_${id}.gif`);
  }
  paths.push(`/vanilla/${id}.png`);
  return paths;
}

export function ItemImage({
  entry,
  internalname,
  alt,
  width = 32,
  height = 32,
  style,
}: ItemImageProps) {
  const { itemsData } = useRecipeData();
  const getTexture = useTexturePackStore((s) => s.getTexture);
  const init = useTexturePackStore((s) => s.init);
  const packs = useTexturePackStore((s) => s.packs);
  const [src, setSrc] = React.useState<string | null>(null);
  const [texture, setTexture] = React.useState<TextureInfo | null>(null);
  const fallbackPaths = React.useRef<string[]>([]);
  const fallbackIndex = React.useRef(0);

  React.useEffect(() => {
    init();
  }, [init]);

  React.useEffect(() => {
    let currentEntry = entry;

    // If no entry in recipes, try to get from items data
    if (!currentEntry && itemsData) {
      currentEntry = itemsData[internalname];
    }

    // NEU's ItemModel is also the official pack's item-definition resource
    // location, and can alias multiple internal IDs to one texture.
    let itemModel: string | null = null;
    if (currentEntry?.nbttag) {
      itemModel = extractFromSNBT(currentEntry.nbttag).itemModel;
    }

    // Check texture pack first
    const tex =
      getTexture(internalname) ?? (itemModel ? getTexture(itemModel) : null);
    if (tex) {
      setTexture(tex);
      setSrc(tex.url);
      return;
    }
    setTexture(null);

    // Special handling for SKYBLOCK_COIN
    if (internalname === "SKYBLOCK_COIN") {
      const mappingInfo = getMappingInfo("SKYBLOCK_COIN");
      if (mappingInfo.textureHash) {
        setSrc(`/api/head/${mappingInfo.textureHash}`);
        return;
      }
    }

    if (!currentEntry) {
      setSrc(null);
      return;
    }

    // Player head logic
    if (currentEntry.itemid === "minecraft:skull" && currentEntry.nbttag) {
      const { textureUrl } = extractFromSNBT(currentEntry.nbttag);
      setSrc(textureUrl || null);
      return;
    }

    // Use vanilla ItemModel values when present. Custom namespaced model IDs
    // only exist in resource packs and must not be requested from /vanilla/.
    let modelId: string | null = null;
    if (itemModel?.startsWith("minecraft:")) {
      modelId = itemModel.substring("minecraft:".length);
    } else if (itemModel && !itemModel.includes(":")) {
      modelId = itemModel;
    }

    // Fallback to itemid
    if (!modelId && currentEntry.itemid) {
      modelId = currentEntry.itemid.replace("minecraft:", "");
    }

    if (modelId) {
      const mappingInfo = getMappingInfo(
        modelId,
        currentEntry.damage,
        currentEntry.nbttag,
      );

      if (mappingInfo.textureHash) {
        setSrc(`/api/head/${mappingInfo.textureHash}`);
        fallbackPaths.current = [];
      } else {
        const isEnchanted = internalname.startsWith("ENCHANTED_");
        const ids = [mappingInfo.mappedId, modelId].filter(Boolean);
        const uniqueIds = [...new Set(ids)];
        const paths: string[] = [];
        for (const id of uniqueIds) {
          paths.push(...getVanillaPaths(id, isEnchanted));
        }
        fallbackPaths.current = paths;
        fallbackIndex.current = 0;
        setSrc(paths[0] ?? null);
      }
    } else {
      setSrc(null);
    }
  }, [entry, internalname, itemsData, getTexture, packs]);

  const handleError = React.useCallback(() => {
    fallbackIndex.current++;
    if (fallbackIndex.current < fallbackPaths.current.length) {
      setSrc(fallbackPaths.current[fallbackIndex.current]!);
    } else {
      setSrc(null);
    }
  }, []);

  if (!src) {
    return (
      <div
        className="rounded-md border border-border bg-muted flex items-center justify-center text-muted-foreground text-xs shrink-0"
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

  if (texture && texture.frameCount > 1) {
    return (
      <AnimatedTexture
        texture={texture}
        alt={alt}
        width={width}
        height={height}
        style={style}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={handleError}
      className="rounded-md bg-muted shrink-0"
      style={{
        width,
        height,
        objectFit: "contain",
        imageRendering: "pixelated",
        ...style,
      }}
    />
  );
}

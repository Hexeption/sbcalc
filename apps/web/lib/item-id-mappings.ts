/**
 * Mapping of old Minecraft item IDs to their modern equivalents
 * Based on the flattening that occurred in Minecraft 1.13
 *
 * For items that had multiple variants (like dyes, wool, etc.),
 * we need to examine the NBT data or use heuristics to determine
 * the correct modern variant.
 */

export interface ItemIdMapping {
  /** The modern item ID to use */
  newId: string;
  /** Whether this mapping requires examining damage/metadata values */
  needsMetadata?: boolean;
  /** Metadata value to modern ID mapping */
  metadataMap?: Record<number, string>;
  /** Custom texture hash for special items (overrides URL generation) */
  textureHash?: string;
}

export const OLD_TO_NEW_ITEM_IDS: Record<string, ItemIdMapping> = {
  // Dyes - most common broken items (22 instances)
  dye: {
    newId: "black_dye", // Default fallback
    needsMetadata: true,
    metadataMap: {
      0: "black_dye",
      1: "red_dye",
      2: "green_dye",
      3: "brown_dye",
      4: "blue_dye",
      5: "purple_dye",
      6: "cyan_dye",
      7: "light_gray_dye",
      8: "gray_dye",
      9: "pink_dye",
      10: "lime_dye",
      11: "yellow_dye",
      12: "light_blue_dye",
      13: "magenta_dye",
      14: "orange_dye",
      15: "white_dye",
    },
  },

  // Fish items (19 instances)
  fish: {
    newId: "cod", // Default fallback
    needsMetadata: true,
    metadataMap: {
      0: "cod",
      1: "salmon",
      2: "tropical_fish",
      3: "pufferfish",
    },
  },

  // Cooked fish (7 instances)
  cooked_fish: {
    newId: "cooked_cod", // Default fallback
    needsMetadata: true,
    metadataMap: {
      0: "cooked_cod",
      1: "cooked_salmon",
    },
  },

  // Banners (16 instances)
  banner: {
    newId: "white_banner", // Default fallback
    needsMetadata: true,
    metadataMap: {
      0: "black_banner",
      1: "red_banner",
      2: "green_banner",
      3: "brown_banner",
      4: "blue_banner",
      5: "purple_banner",
      6: "cyan_banner",
      7: "light_gray_banner",
      8: "gray_banner",
      9: "pink_banner",
      10: "lime_banner",
      11: "yellow_banner",
      12: "light_blue_banner",
      13: "magenta_banner",
      14: "orange_banner",
      15: "white_banner",
    },
  },

  // Spawn eggs (7 instances)
  spawn_egg: {
    newId: "pig_spawn_egg", // Default fallback - examine NBT for entity type
    needsMetadata: false, // These usually need NBT examination
  },

  // Wither spawn eggs (3 instances)
  wither_spawn_egg: {
    newId: "wither_spawn_egg",
    needsMetadata: false,
  },

  // Double plants (5 instances)
  double_plant: {
    newId: "sunflower", // Default fallback
    needsMetadata: true,
    metadataMap: {
      0: "sunflower",
      1: "lilac",
      2: "rose_bush",
      3: "peony",
      4: "tall_grass",
      5: "large_fern",
    },
  },

  // Dead bush (5 instances)
  deadbush: {
    newId: "dead_bush",
    needsMetadata: false,
  },

  // Stained glass (4 instances)
  stained_glass: {
    newId: "white_stained_glass", // Default fallback
    needsMetadata: true,
    metadataMap: {
      0: "white_stained_glass",
      1: "orange_stained_glass",
      2: "magenta_stained_glass",
      3: "light_blue_stained_glass",
      4: "yellow_stained_glass",
      5: "lime_stained_glass",
      6: "pink_stained_glass",
      7: "gray_stained_glass",
      8: "light_gray_stained_glass",
      9: "cyan_stained_glass",
      10: "purple_stained_glass",
      11: "blue_stained_glass",
      12: "brown_stained_glass",
      13: "green_stained_glass",
      14: "red_stained_glass",
      15: "black_stained_glass",
    },
  },

  // Red flowers (3 instances)
  red_flower: {
    newId: "poppy", // Default fallback
    needsMetadata: true,
    metadataMap: {
      0: "poppy",
      1: "blue_orchid",
      2: "allium",
      3: "azure_bluet",
      4: "red_tulip",
      5: "orange_tulip",
      6: "white_tulip",
      7: "pink_tulip",
      8: "oxeye_daisy",
    },
  },

  // Wool (2 instances)
  wool: {
    newId: "white_wool", // Default fallback
    needsMetadata: true,
    metadataMap: {
      0: "white_wool",
      1: "orange_wool",
      2: "magenta_wool",
      3: "light_blue_wool",
      4: "yellow_wool",
      5: "lime_wool",
      6: "pink_wool",
      7: "gray_wool",
      8: "light_gray_wool",
      9: "cyan_wool",
      10: "purple_wool",
      11: "blue_wool",
      12: "brown_wool",
      13: "green_wool",
      14: "red_wool",
      15: "black_wool",
    },
  },

  // Stained hardened clay (2 instances)
  stained_hardened_clay: {
    newId: "white_terracotta", // Default fallback
    needsMetadata: true,
    metadataMap: {
      0: "white_terracotta",
      1: "orange_terracotta",
      2: "magenta_terracotta",
      3: "light_blue_terracotta",
      4: "yellow_terracotta",
      5: "lime_terracotta",
      6: "pink_terracotta",
      7: "gray_terracotta",
      8: "light_gray_terracotta",
      9: "cyan_terracotta",
      10: "purple_terracotta",
      11: "blue_terracotta",
      12: "brown_terracotta",
      13: "green_terracotta",
      14: "red_terracotta",
      15: "black_terracotta",
    },
  },

  // Planks (2 instances)
  planks: {
    newId: "oak_planks", // Default fallback
    needsMetadata: true,
    metadataMap: {
      0: "oak_planks",
      1: "spruce_planks",
      2: "birch_planks",
      3: "jungle_planks",
      4: "acacia_planks",
      5: "dark_oak_planks",
    },
  },

  // Single instances
  waterlily: { newId: "lily_pad" },
  tallgrass: { newId: "grass" },
  snow_layer: { newId: "snow" },
  short_grass: { newId: "grass" },
  quartz_ore: { newId: "nether_quartz_ore" },
  netherbrick: { newId: "nether_brick" },
  monster_egg: { newId: "infested_stone" },
  mob_spawner: { newId: "spawner" },
  golden_rail: { newId: "powered_rail" },
  fireworks: { newId: "firework_rocket" },
  firework_charge: { newId: "firework_star" },
  fence: { newId: "oak_fence" },
  carpet: { newId: "white_carpet" },
  bed: { newId: "red_bed" },
  slime: { newId: "slime_block" },
  noteblock: { newId: "note_block" },
  melon_block: { newId: "melon" },
  boat: { newId: "oak_boat" },

  // Logs and leaves
  log: {
    newId: "oak_log",
    needsMetadata: true,
    metadataMap: {
      0: "oak_log",
      1: "spruce_log",
      2: "birch_log",
      3: "jungle_log",
    },
  },
  leaves: {
    newId: "oak_leaves",
    needsMetadata: true,
    metadataMap: {
      0: "oak_leaves",
      1: "spruce_leaves",
      2: "birch_leaves",
      3: "jungle_leaves",
    },
  },

  // Music discs
  record_11: { newId: "music_disc_11" },
  record_13: { newId: "music_disc_13" },
  record_blocks: { newId: "music_disc_blocks" },
  record_cat: { newId: "music_disc_cat" },
  record_far: { newId: "music_disc_far" },
  record_mall: { newId: "music_disc_mall" },
  record_stal: { newId: "music_disc_stal" },
  record_strad: { newId: "music_disc_strad" },

  // Skyblock custom items
  SKYBLOCK_COIN: {
    newId: "gold_nugget", // Fallback item ID
    textureHash:
      "538071721cc5b4cd406ce431a13f86083a8973e1064d2f8897869930ee6e5237",
  },
};

/**
 * Get the modern item ID for an old item ID
 * @param oldId The old item ID
 * @param damage The damage/metadata value (if available)
 * @param nbtTag The NBT tag (for additional context)
 * @returns The modern item ID to use
 */
export function getMappedItemId(
  oldId: string,
  damage?: number,
  nbtTag?: string,
): string {
  const mapping = OLD_TO_NEW_ITEM_IDS[oldId];

  if (!mapping) {
    return oldId; // Return original if no mapping exists
  }

  // If the mapping doesn't need metadata, return the default
  if (!mapping.needsMetadata) {
    return mapping.newId;
  }

  // If we have a damage value and metadata mapping, use it
  if (
    damage !== undefined &&
    mapping.metadataMap &&
    mapping.metadataMap[damage]
  ) {
    return mapping.metadataMap[damage];
  }

  // Try to extract damage from NBT if available
  if (nbtTag && mapping.metadataMap) {
    const damageMatch = nbtTag.match(/damage:(\d+)/i);
    if (damageMatch && damageMatch[1]) {
      const nbtDamage = parseInt(damageMatch[1]);
      if (mapping.metadataMap[nbtDamage]) {
        return mapping.metadataMap[nbtDamage];
      }
    }
  }

  // Fallback to default
  return mapping.newId;
}

/**
 * Get mapping information for an item ID including texture hash if available
 * @param oldId The old item ID
 * @param damage The damage/metadata value (if available)
 * @param nbtTag The NBT tag (for additional context)
 * @returns Object with mapped ID and optional texture hash
 */
export function getMappingInfo(
  oldId: string,
  damage?: number,
  nbtTag?: string,
): { mappedId: string; textureHash?: string } {
  const mapping = OLD_TO_NEW_ITEM_IDS[oldId];

  if (!mapping) {
    return { mappedId: oldId }; // Return original if no mapping exists
  }

  let mappedId = mapping.newId;

  // If the mapping needs metadata, try to get the specific variant
  if (mapping.needsMetadata) {
    // If we have a damage value and metadata mapping, use it
    if (
      damage !== undefined &&
      mapping.metadataMap &&
      mapping.metadataMap[damage]
    ) {
      mappedId = mapping.metadataMap[damage];
    } else if (nbtTag && mapping.metadataMap) {
      // Try to extract damage from NBT if available
      const damageMatch = nbtTag.match(/damage:(\d+)/i);
      if (damageMatch && damageMatch[1]) {
        const nbtDamage = parseInt(damageMatch[1]);
        if (mapping.metadataMap[nbtDamage]) {
          mappedId = mapping.metadataMap[nbtDamage];
        }
      }
    }
  }

  return {
    mappedId,
    textureHash: mapping.textureHash,
  };
}

// Delimiter for building unique tree-path identifiers from internalnames.
// Internalnames contain "_", ":", ";" and "-" but never control chars, so the
// unit separator (U+001F) is a safe, collision-free join character.
export const PATH_DELIM = "";

// Items to always treat as base (never recurse into their recipes)
export const BASE_MATERIALS = new Set([
  "IRON_INGOT",
  "GOLD_INGOT",
  "DIAMOND",
  "COAL",
  "REDSTONE",
  "EMERALD",
  "INK_SACK-4",
  "SLIME_BALL",
  "MAGMA_CREAM",
  "STICK",
]);

// Default forge settings
export const DEFAULT_FORGE_SETTINGS = {
  forgeSlots: 2,
  useMultipleSlots: true,
  quickForgeLevel: 0,
} as const;

// Input validation limits
export const INPUT_LIMITS = {
  forgeSlots: { min: 1, max: 20 },
  quickForgeLevel: { min: 0, max: 20 },
  multiplier: { min: 1, max: 999999 },
} as const;

// Component configuration
export const UI_CONFIG = {
  maxSearchResults: 50,
  itemImageSize: { width: 32, height: 32 },
  debounceDelay: 300,
} as const;

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

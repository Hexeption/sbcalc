import { create } from "zustand";
import { DEFAULT_FORGE_SETTINGS } from "@/lib/constants";
import type { Settings } from "@/lib/types";

interface CalculatorState {
  // Single-item selection
  selectedItem: string | null;
  setSelectedItem: (item: string | null) => void;
  multiplier: number;
  setMultiplier: (n: number) => void;
  searchValue: string;
  setSearchValue: (v: string) => void;

  // Settings (forge)
  settings: Settings;
  updateSettings: (partial: Partial<Settings>) => void;

  // Inventory: items you already own, by internalname -> quantity. The net
  // requirements (tree + list + forge time) are computed after deducting these.
  inventory: Map<string, number>;
  // Set an item's owned quantity (qty <= 0 removes it).
  setInventoryItem: (name: string, qty: number) => void;
  // Add `qty` to an item's owned quantity (used by per-row "add to inventory").
  addToInventory: (name: string, qty: number) => void;
  // Empty the whole inventory.
  clearInventory: () => void;

  // Hydration
  hydrated: boolean;
  hydrate: () => void;

  // Helpers
  getRecipeState: () => Record<string, number>;
}

const LOCAL_KEYS = {
  selectedItem: "sbcalc_selectedItem",
  multiplier: "sbcalc_multiplier",
  settings: "sbcalc-settings",
  inventory: "sbcalc_inventory",
} as const;

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch {
    // ignore
  }
  return fallback;
}

function saveJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

export const useCalculatorStore = create<CalculatorState>((set, get) => ({
  // Defaults (pre-hydration)
  selectedItem: null,
  multiplier: 1,
  searchValue: "",
  settings: { ...DEFAULT_FORGE_SETTINGS },
  hydrated: false,
  inventory: new Map<string, number>(),

  // Single item
  setSelectedItem: (item) => {
    set({ selectedItem: item });
    saveJson(LOCAL_KEYS.selectedItem, item);
  },
  setMultiplier: (n) => {
    set({ multiplier: n });
    saveJson(LOCAL_KEYS.multiplier, n);
  },
  setSearchValue: (v) => set({ searchValue: v }),

  // Inventory
  setInventoryItem: (name, qty) => {
    const next = new Map(get().inventory);
    if (qty <= 0) next.delete(name);
    else next.set(name, Math.floor(qty));
    set({ inventory: next });
    saveJson(LOCAL_KEYS.inventory, Array.from(next.entries()));
  },
  addToInventory: (name, qty) => {
    const next = new Map(get().inventory);
    const total = (next.get(name) ?? 0) + Math.floor(qty);
    if (total <= 0) next.delete(name);
    else next.set(name, total);
    set({ inventory: next });
    saveJson(LOCAL_KEYS.inventory, Array.from(next.entries()));
  },
  clearInventory: () => {
    set({ inventory: new Map<string, number>() });
    saveJson(LOCAL_KEYS.inventory, []);
  },

  // Settings
  updateSettings: (partial) => {
    const next = { ...get().settings, ...partial };
    set({ settings: next });
    saveJson(LOCAL_KEYS.settings, next);
  },

  // Hydration from localStorage
  hydrate: () => {
    if (get().hydrated) return;

    const selectedItem = loadJson<string | null>(LOCAL_KEYS.selectedItem, null);
    const multiplier = loadJson<number>(LOCAL_KEYS.multiplier, 1);
    const settings = {
      ...DEFAULT_FORGE_SETTINGS,
      ...loadJson<Partial<Settings>>(LOCAL_KEYS.settings, {}),
    };
    const inventory = new Map(
      loadJson<Array<[string, number]>>(LOCAL_KEYS.inventory, []),
    );

    set({
      selectedItem,
      multiplier,
      settings,
      inventory,
      hydrated: true,
    });
  },

  // Helpers
  getRecipeState: () => {
    const { selectedItem, multiplier } = get();
    return selectedItem ? { [selectedItem]: multiplier } : {};
  },
}));

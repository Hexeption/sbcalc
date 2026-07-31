import { create } from "zustand";
import { DEFAULT_FORGE_SETTINGS } from "@/lib/constants";
import type {
  ActiveForgeJob,
  ForgePlanProgress,
  ItemListEntry,
  Settings,
} from "@/lib/types";

interface CalculatorState {
  // Mode
  mode: "single" | "multi";
  setMode: (mode: "single" | "multi") => void;
  handleModeSwitch: (mode: "single" | "multi") => void;

  // Single-item selection
  selectedItem: string | null;
  setSelectedItem: (item: string | null) => void;
  multiplier: number;
  setMultiplier: (n: number) => void;
  searchValue: string;
  setSearchValue: (v: string) => void;

  // Multi-item list
  itemList: ItemListEntry[];
  setItemList: (items: ItemListEntry[]) => void;
  multiTreeSelectedItem: string | null;
  setMultiTreeSelectedItem: (id: string | null) => void;

  // Material depth (Crafting vs Raw toggle)
  materialDepth: number;
  setMaterialDepth: (depth: number) => void;

  // Settings (forge)
  settings: Settings;
  updateSettings: (partial: Partial<Settings>) => void;

  // Todo mode
  todoMode: boolean;
  checkedItems: Set<string>;
  toggleTodoMode: () => void;
  toggleChecked: (itemName: string, descendants: string[]) => void;

  // Forge tracker
  forgeTrackerPlans: Record<string, ForgePlanProgress>;
  activeForgeJobs: ActiveForgeJob[];
  setForgeCompleted: (
    planTargetItemId: string,
    requirementId: string,
    quantity: number,
  ) => void;
  startForgeJob: (
    planTargetItemId: string,
    requirementId: string,
    itemId: string,
    totalDurationSeconds: number,
    remainingDurationSeconds: number,
    requiredQuantity: number,
  ) => boolean;
  collectForgeJob: (jobId: string) => boolean;
  cancelForgeJob: (jobId: string) => void;
  resetForgePlan: (planTargetItemId: string) => void;

  // Hydration
  hydrated: boolean;
  hydrate: () => void;

  // Helpers
  getRecipeState: () => Record<string, number>;
}

const LOCAL_KEYS = {
  mode: "sbcalc_mode",
  selectedItem: "sbcalc_selectedItem",
  multiplier: "sbcalc_multiplier",
  itemList: "sbcalc_itemList",
  lastMultiSelectedItem: "sbcalc_lastMultiSelectedItem",
  settings: "sbcalc-settings",
  checkedItems: "sbcalc_checkedItems",
  forgeTracker: "sbcalc_forgeTracker_v2",
  legacyForgeTracker: "sbcalc_forgeTracker_v1",
} as const;

const FORGE_TRACKER_STORAGE_VERSION = 2;

interface PersistedForgeTrackerState {
  version: typeof FORGE_TRACKER_STORAGE_VERSION;
  plans: Record<string, ForgePlanProgress>;
  activeJobs: ActiveForgeJob[];
}

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseForgeTrackerState(
  raw: unknown,
  version: 1 | typeof FORGE_TRACKER_STORAGE_VERSION,
): Omit<PersistedForgeTrackerState, "version"> | null {
  if (!isRecord(raw) || raw.version !== version) return null;
  const plans: Record<string, ForgePlanProgress> = {};
  if (isRecord(raw.plans)) {
    for (const [targetItemId, value] of Object.entries(raw.plans)) {
      if (!isRecord(value)) continue;
      const persistedCompleted =
        version === 1 ? value.completedByItem : value.completedByRequirement;
      if (!isRecord(persistedCompleted)) continue;

      const completedByRequirement: Record<string, number> = {};
      for (const [requirementId, quantity] of Object.entries(
        persistedCompleted,
      )) {
        if (typeof quantity !== "number" || !Number.isFinite(quantity))
          continue;
        completedByRequirement[requirementId] = Math.max(
          0,
          Math.floor(quantity),
        );
      }
      plans[targetItemId] = { targetItemId, completedByRequirement };
    }
  }

  const activeJobs = Array.isArray(raw.activeJobs)
    ? raw.activeJobs.flatMap((value): ActiveForgeJob[] => {
        if (
          !isRecord(value) ||
          typeof value.id !== "string" ||
          typeof value.planTargetItemId !== "string" ||
          typeof value.itemId !== "string" ||
          (version === FORGE_TRACKER_STORAGE_VERSION &&
            typeof value.requirementId !== "string") ||
          typeof value.startedAtMs !== "number" ||
          typeof value.endsAtMs !== "number" ||
          typeof value.totalDurationSeconds !== "number" ||
          !Number.isFinite(value.startedAtMs) ||
          !Number.isFinite(value.endsAtMs) ||
          !Number.isFinite(value.totalDurationSeconds)
        ) {
          return [];
        }
        return [
          {
            id: value.id,
            planTargetItemId: value.planTargetItemId,
            requirementId:
              version === 1 ? value.itemId : (value.requirementId as string),
            itemId: value.itemId,
            startedAtMs: value.startedAtMs,
            endsAtMs: value.endsAtMs,
            totalDurationSeconds: Math.max(
              0,
              Math.floor(value.totalDurationSeconds),
            ),
          },
        ];
      })
    : [];

  return { plans, activeJobs };
}

function loadForgeTrackerState(): Omit<PersistedForgeTrackerState, "version"> {
  const current = parseForgeTrackerState(
    loadJson<unknown>(LOCAL_KEYS.forgeTracker, null),
    FORGE_TRACKER_STORAGE_VERSION,
  );
  if (current) return current;

  const legacy = parseForgeTrackerState(
    loadJson<unknown>(LOCAL_KEYS.legacyForgeTracker, null),
    1,
  );
  if (legacy) {
    saveForgeTrackerState(legacy.plans, legacy.activeJobs);
    return legacy;
  }

  return { plans: {}, activeJobs: [] };
}

function saveForgeTrackerState(
  plans: Record<string, ForgePlanProgress>,
  activeJobs: ActiveForgeJob[],
) {
  const state: PersistedForgeTrackerState = {
    version: FORGE_TRACKER_STORAGE_VERSION,
    plans,
    activeJobs,
  };
  saveJson(LOCAL_KEYS.forgeTracker, state);
}

function createForgeJobId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `forge-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export const useCalculatorStore = create<CalculatorState>((set, get) => ({
  // Defaults (pre-hydration)
  mode: "single",
  selectedItem: null,
  multiplier: 1,
  searchValue: "",
  itemList: [],
  multiTreeSelectedItem: null,
  materialDepth: Number.POSITIVE_INFINITY,
  settings: { ...DEFAULT_FORGE_SETTINGS },
  hydrated: false,
  todoMode: false,
  checkedItems: new Set<string>(),
  forgeTrackerPlans: {},
  activeForgeJobs: [],

  // Mode
  setMode: (mode) => {
    set({ mode });
    saveJson(LOCAL_KEYS.mode, mode);
  },
  handleModeSwitch: (newMode) => {
    set({ mode: newMode });
    saveJson(LOCAL_KEYS.mode, newMode);
  },

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

  // Multi item
  setItemList: (items) => {
    set({ itemList: items });
    saveJson(LOCAL_KEYS.itemList, items);
  },
  setMultiTreeSelectedItem: (id) => {
    set({ multiTreeSelectedItem: id });
    if (id) saveJson(LOCAL_KEYS.lastMultiSelectedItem, id);
  },

  // Material depth
  setMaterialDepth: (depth) => set({ materialDepth: depth }),

  // Todo mode
  toggleTodoMode: () => {
    const { todoMode } = get();
    const clearing = todoMode;
    set({
      todoMode: !todoMode,
      checkedItems: clearing ? new Set<string>() : get().checkedItems,
    });
    if (clearing) saveJson(LOCAL_KEYS.checkedItems, []);
  },
  toggleChecked: (itemName, descendants) => {
    const prev = get().checkedItems;
    const next = new Set(prev);
    if (next.has(itemName)) {
      next.delete(itemName);
      for (const d of descendants) next.delete(d);
    } else {
      next.add(itemName);
      for (const d of descendants) next.add(d);
    }
    set({ checkedItems: next });
    saveJson(LOCAL_KEYS.checkedItems, Array.from(next));
  },

  // Forge tracker
  setForgeCompleted: (planTargetItemId, requirementId, quantity) => {
    const state = get();
    const normalizedQuantity = Number.isFinite(quantity)
      ? Math.max(0, Math.floor(quantity))
      : 0;
    const existingPlan = state.forgeTrackerPlans[planTargetItemId] ?? {
      targetItemId: planTargetItemId,
      completedByRequirement: {},
    };
    const completedByRequirement = {
      ...existingPlan.completedByRequirement,
    };
    if (normalizedQuantity === 0) {
      delete completedByRequirement[requirementId];
    } else {
      completedByRequirement[requirementId] = normalizedQuantity;
    }
    const forgeTrackerPlans = {
      ...state.forgeTrackerPlans,
      [planTargetItemId]: { ...existingPlan, completedByRequirement },
    };
    set({ forgeTrackerPlans });
    saveForgeTrackerState(forgeTrackerPlans, state.activeForgeJobs);
  },
  startForgeJob: (
    planTargetItemId,
    requirementId,
    itemId,
    totalDurationSeconds,
    remainingDurationSeconds,
    requiredQuantity,
  ) => {
    const state = get();
    if (state.activeForgeJobs.length >= state.settings.forgeSlots) return false;

    const completed =
      state.forgeTrackerPlans[planTargetItemId]?.completedByRequirement[
        requirementId
      ] ?? 0;
    const activeForRequirement = state.activeForgeJobs.filter(
      (job) =>
        job.planTargetItemId === planTargetItemId &&
        job.requirementId === requirementId,
    ).length;
    if (completed + activeForRequirement >= Math.max(0, requiredQuantity)) {
      return false;
    }

    const totalSeconds = Number.isFinite(totalDurationSeconds)
      ? Math.max(0, Math.floor(totalDurationSeconds))
      : 0;
    const remainingSeconds = Number.isFinite(remainingDurationSeconds)
      ? Math.min(
          totalSeconds,
          Math.max(0, Math.floor(remainingDurationSeconds)),
        )
      : totalSeconds;
    const nowMs = Date.now();
    const job: ActiveForgeJob = {
      id: createForgeJobId(),
      planTargetItemId,
      requirementId,
      itemId,
      startedAtMs: nowMs - (totalSeconds - remainingSeconds) * 1000,
      endsAtMs: nowMs + remainingSeconds * 1000,
      totalDurationSeconds: totalSeconds,
    };
    const existingPlan = state.forgeTrackerPlans[planTargetItemId] ?? {
      targetItemId: planTargetItemId,
      completedByRequirement: {},
    };
    const forgeTrackerPlans = {
      ...state.forgeTrackerPlans,
      [planTargetItemId]: existingPlan,
    };
    const activeForgeJobs = [...state.activeForgeJobs, job];
    set({ forgeTrackerPlans, activeForgeJobs });
    saveForgeTrackerState(forgeTrackerPlans, activeForgeJobs);
    return true;
  },
  collectForgeJob: (jobId) => {
    const state = get();
    const job = state.activeForgeJobs.find((entry) => entry.id === jobId);
    if (!job || job.endsAtMs > Date.now()) return false;

    const existingPlan = state.forgeTrackerPlans[job.planTargetItemId] ?? {
      targetItemId: job.planTargetItemId,
      completedByRequirement: {},
    };
    const completedByRequirement = {
      ...existingPlan.completedByRequirement,
      [job.requirementId]:
        (existingPlan.completedByRequirement[job.requirementId] ?? 0) + 1,
    };
    const forgeTrackerPlans = {
      ...state.forgeTrackerPlans,
      [job.planTargetItemId]: { ...existingPlan, completedByRequirement },
    };
    const activeForgeJobs = state.activeForgeJobs.filter(
      (entry) => entry.id !== jobId,
    );
    set({ forgeTrackerPlans, activeForgeJobs });
    saveForgeTrackerState(forgeTrackerPlans, activeForgeJobs);
    return true;
  },
  cancelForgeJob: (jobId) => {
    const state = get();
    const activeForgeJobs = state.activeForgeJobs.filter(
      (entry) => entry.id !== jobId,
    );
    if (activeForgeJobs.length === state.activeForgeJobs.length) return;
    set({ activeForgeJobs });
    saveForgeTrackerState(state.forgeTrackerPlans, activeForgeJobs);
  },
  resetForgePlan: (planTargetItemId) => {
    const state = get();
    const forgeTrackerPlans = { ...state.forgeTrackerPlans };
    delete forgeTrackerPlans[planTargetItemId];
    const activeForgeJobs = state.activeForgeJobs.filter(
      (job) => job.planTargetItemId !== planTargetItemId,
    );
    set({ forgeTrackerPlans, activeForgeJobs });
    saveForgeTrackerState(forgeTrackerPlans, activeForgeJobs);
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

    const mode = loadJson<"single" | "multi">(LOCAL_KEYS.mode, "single");
    const selectedItem = loadJson<string | null>(LOCAL_KEYS.selectedItem, null);
    const multiplier = loadJson<number>(LOCAL_KEYS.multiplier, 1);
    const itemList = loadJson<ItemListEntry[]>(LOCAL_KEYS.itemList, []);
    const settings = {
      ...DEFAULT_FORGE_SETTINGS,
      ...loadJson<Partial<Settings>>(LOCAL_KEYS.settings, {}),
    };

    // Restore multi-tree selection
    const lastMulti = loadJson<string | null>(
      LOCAL_KEYS.lastMultiSelectedItem,
      null,
    );
    const multiTreeSelectedItem =
      lastMulti && itemList.some((i) => i.itemId === lastMulti)
        ? lastMulti
        : null;
    const checkedItems = new Set(
      loadJson<string[]>(LOCAL_KEYS.checkedItems, []),
    );
    const todoMode = checkedItems.size > 0;
    const forgeTracker = loadForgeTrackerState();

    set({
      mode,
      selectedItem,
      multiplier,
      itemList,
      settings,
      multiTreeSelectedItem,
      checkedItems,
      todoMode,
      forgeTrackerPlans: forgeTracker.plans,
      activeForgeJobs: forgeTracker.activeJobs,
      hydrated: true,
    });
  },

  // Helpers
  getRecipeState: () => {
    const { mode, selectedItem, multiplier, itemList } = get();
    if (mode === "single" && selectedItem)
      return { [selectedItem]: multiplier };
    if (mode === "multi")
      return Object.fromEntries(
        itemList.map((item) => [item.itemId, item.quantity]),
      );
    return {};
  },
}));

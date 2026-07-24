import { create } from "zustand";
import {
  type CatsArchive,
  extractFile,
  extractFileAsObjectURL,
  extractFileAsText,
  listFiles,
  parseCats,
} from "@/lib/cats-parser";

export interface TextureInfo {
  url: string;
  frameCount: number;
  // Ticks per frame (20 ticks = 1 second). 0 for static textures.
  frametime: number;
}

export interface TexturePackEntry {
  id: string;
  name: string;
  url: string; // path to .cats file in public/
  enabled: boolean;
  loaded: boolean;
  loading: boolean;
  error: string | null;
  textures: Map<string, TextureInfo>;
}

interface TexturePackState {
  packs: TexturePackEntry[];
  initialized: boolean;

  init: () => Promise<void>;
  selectPack: (id: string | null) => void;
  getTexture: (itemId: string) => TextureInfo | null;
}

const STORAGE_KEY = "sbcalc-texture-pack";
const DEFAULT_PACK_ID = "hypixel";

const PACK_REGISTRY: Omit<
  TexturePackEntry,
  "enabled" | "loaded" | "loading" | "error" | "textures"
>[] = [
  {
    id: "hypixel",
    name: "Hypixel Official",
    url: "/hypixel.cats",
  },
  { id: "fursky", name: "FurfSky Reborn", url: "/fursky.cats" },
  { id: "packshq", name: "PacksHQ", url: "/packshq.cats" },
];

function loadSelectedPack(): string | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return raw;
  } catch {}
  return DEFAULT_PACK_ID;
}

function saveSelectedPack(id: string | null) {
  try {
    if (id) {
      localStorage.setItem(STORAGE_KEY, id);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {}
}

// Resolve a model reference like "item_item:item/rough_amber_gem" to a texture path
// Model JSON: {"parent":"item/generated","textures":{"layer0":"item_item:item/rough_amber_gemstone"}}
// Texture ref "item_item:item/rough_amber_gemstone" -> find PNG at /<pack>/assets/item_item/textures/item/rough_amber_gemstone.png
function resolveTextureRef(ref: string): { namespace: string; path: string } {
  const colonIdx = ref.indexOf(":");
  if (colonIdx === -1) return { namespace: "", path: ref };
  return {
    namespace: ref.substring(0, colonIdx),
    path: ref.substring(colonIdx + 1),
  };
}

// Strip the "minecraft:" prefix from type strings so both
// "model" and "minecraft:model" are handled uniformly.
function stripNs(type: string | undefined): string {
  if (!type) return "";
  const idx = type.indexOf(":");
  return idx === -1 ? type : type.substring(idx + 1);
}

// Walk a model JSON tree and return the first concrete model reference.
// Handles: model, composite, condition, select, range_dispatch.
function extractFirstModelRef(obj: unknown): string | null {
  if (!obj || typeof obj !== "object") return null;
  const o = obj as Record<string, unknown>;
  const t = stripNs(o.type as string | undefined);

  if (t === "model" && typeof o.model === "string") {
    return o.model;
  }
  if (t === "composite") {
    const models = o.models;
    if (Array.isArray(models)) {
      for (const model of models) {
        const modelRef = extractFirstModelRef(model);
        if (modelRef) return modelRef;
      }
    }
  }
  if (t === "condition") {
    return extractFirstModelRef(o.on_false) ?? extractFirstModelRef(o.on_true);
  }
  if (t === "select") {
    const cases = o.cases;
    if (Array.isArray(cases) && cases.length > 0) {
      return extractFirstModelRef(cases[0].model ?? cases[0]);
    }
  }
  if (t === "range_dispatch") {
    const entries = o.entries;
    if (Array.isArray(entries) && entries.length > 0) {
      const fromEntry = extractFirstModelRef(entries[0].model ?? entries[0]);
      if (fromEntry) return fromEntry;
    }
    return extractFirstModelRef(o.fallback);
  }
  return null;
}

async function indexTextures(
  archive: CatsArchive,
): Promise<Map<string, TextureInfo>> {
  const files = listFiles(archive);

  // Step 1: Find all SkyBlock item definition files.
  // Supports both the older assets/skyblock/items layout and Hypixel's
  // official assets/hypixel_skyblock/items layout.
  const sbItemFiles = files.filter((f) => {
    const parts = f.split("/");
    const assetsIndex = parts.indexOf("assets");
    if (assetsIndex === -1) return false;
    const namespace = parts[assetsIndex + 1];
    return (
      (namespace === "skyblock" || namespace === "hypixel_skyblock") &&
      parts[assetsIndex + 2] === "items" &&
      parts.at(-1)?.endsWith(".json")
    );
  });

  // Step 2: Build model reference index from item files
  // item_id -> model reference string (e.g., "item_item:item/essence_wither")
  const itemModelRefs = new Map<string, string>();
  // item_id -> item definition resource location. NEU can have multiple
  // internal IDs that point at this same location, so it is also a lookup key.
  const itemAliases = new Map<string, string>();

  await Promise.all(
    sbItemFiles.map(async (filePath) => {
      const text = await extractFileAsText(archive, filePath);
      if (!text) return;

      try {
        const json = JSON.parse(text);
        const model = json?.model;
        if (!model) return;

        const modelRef = extractFirstModelRef(model);
        if (!modelRef) return;

        const fileName = filePath.split("/").pop()!;
        const itemId = fileName.replace(".json", "").toUpperCase();
        itemModelRefs.set(itemId, modelRef);

        const assetsIndex = filePath.indexOf("/assets/");
        const itemsMarker = "/items/";
        const itemsIndex = filePath.indexOf(itemsMarker, assetsIndex);
        if (assetsIndex !== -1 && itemsIndex !== -1) {
          const namespaceStart = assetsIndex + "/assets/".length;
          const namespace = filePath.substring(namespaceStart, itemsIndex);
          const itemPath = filePath
            .substring(itemsIndex + itemsMarker.length)
            .replace(/\.json$/, "");
          itemAliases.set(itemId, `${namespace}:${itemPath}`.toUpperCase());
        }
      } catch {
        // skip unparseable files
      }
    }),
  );

  // Step 3: Resolve model refs to texture refs by reading model JSONs
  // Model ref "item_item:item/essence_wither" -> file /*/assets/item_item/models/item/essence_wither.json
  // Build a file lookup for faster resolution
  const fileLookup = new Map<string, string>();
  for (const f of files) {
    // Key by the portion after /assets/ for model lookups
    const assetsIdx = f.indexOf("/assets/");
    if (assetsIdx !== -1) {
      const relative = f.substring(assetsIdx + "/assets/".length);
      fileLookup.set(relative, f);
    }
  }

  // item_id -> texture namespace:path
  const itemTextureRefs = new Map<string, string>();

  await Promise.all(
    Array.from(itemModelRefs.entries()).map(async ([itemId, modelRef]) => {
      const { namespace, path } = resolveTextureRef(modelRef);
      // Model file is at <namespace>/models/<path>.json
      const modelPath = `${namespace}/models/${path}.json`;
      const fullPath = fileLookup.get(modelPath);
      if (!fullPath) return;

      const text = await extractFileAsText(archive, fullPath);
      if (!text) return;

      try {
        const json = JSON.parse(text);
        // Get layer0 texture (the main item texture)
        const layer0 = json?.textures?.layer0;
        if (layer0) {
          itemTextureRefs.set(itemId, layer0);
        }
      } catch {
        // skip
      }
    }),
  );

  // Step 4: Resolve texture refs to PNG files, detect animations, and create object URLs
  const textures = new Map<string, TextureInfo>();

  await Promise.all(
    Array.from(itemTextureRefs.entries()).map(async ([itemId, textureRef]) => {
      const { namespace, path } = resolveTextureRef(textureRef);
      const texturePath = `${namespace}/textures/${path}.png`;
      const fullPath = fileLookup.get(texturePath);
      if (!fullPath) return;

      const url = await extractFileAsObjectURL(archive, fullPath, "image/png");
      if (!url) return;

      // Check for animation: read PNG dimensions and .mcmeta
      let frameCount = 1;
      let frametime = 0;

      const pngBytes = await extractFile(archive, fullPath);
      if (pngBytes && pngBytes.length >= 24) {
        const view = new DataView(
          pngBytes.buffer,
          pngBytes.byteOffset,
          pngBytes.length,
        );
        const w = view.getUint32(16, false);
        const h = view.getUint32(20, false);
        if (h > w && w > 0) {
          // Vertical spritesheet — check for .mcmeta
          const mcmetaPath = fullPath + ".mcmeta";
          const mcmetaText = await extractFileAsText(archive, mcmetaPath);
          if (mcmetaText) {
            try {
              const mcmeta = JSON.parse(mcmetaText);
              if (mcmeta.animation) {
                frameCount = Math.floor(h / w);
                frametime = mcmeta.animation.frametime ?? 1;
              }
            } catch {
              // not valid mcmeta, treat as static
            }
          }
        }
      }

      const texture = { url, frameCount, frametime };
      textures.set(itemId, texture);

      const alias = itemAliases.get(itemId);
      if (alias) textures.set(alias, texture);
    }),
  );

  return textures;
}

async function loadPack(
  pack: TexturePackEntry,
): Promise<Map<string, TextureInfo>> {
  const response = await fetch(pack.url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const buffer = await response.arrayBuffer();
  const archive = parseCats(buffer);
  return indexTextures(archive);
}

function updatePack(
  set: (fn: (s: TexturePackState) => Partial<TexturePackState>) => void,
  id: string,
  patch: Partial<TexturePackEntry>,
) {
  set((s) => ({
    packs: s.packs.map((p) => (p.id === id ? { ...p, ...patch } : p)),
  }));
}

async function loadAndApplyPack(
  set: (fn: (s: TexturePackState) => Partial<TexturePackState>) => void,
  pack: TexturePackEntry,
) {
  updatePack(set, pack.id, { loading: true });
  try {
    const textures = await loadPack(pack);
    updatePack(set, pack.id, { textures, loaded: true, loading: false });
  } catch (err) {
    updatePack(set, pack.id, {
      loading: false,
      error: err instanceof Error ? err.message : "Failed to load",
    });
  }
}

export const useTexturePackStore = create<TexturePackState>((set, get) => ({
  packs: [],
  initialized: false,

  init: async () => {
    if (get().initialized) return;

    const selectedId = loadSelectedPack();
    const packs: TexturePackEntry[] = PACK_REGISTRY.map((reg) => ({
      ...reg,
      enabled: reg.id === selectedId,
      loaded: false,
      loading: false,
      error: null,
      textures: new Map(),
    }));
    set({ packs, initialized: true });

    const selected = packs.find((p) => p.enabled);
    if (selected) await loadAndApplyPack(set, selected);
  },

  selectPack: (id) => {
    const { packs } = get();
    const updated = packs.map((p) => ({ ...p, enabled: p.id === id }));
    set({ packs: updated });
    saveSelectedPack(id);

    if (!id) return;

    const pack = updated.find((p) => p.id === id);
    if (!pack || pack.loaded || pack.loading) return;

    loadAndApplyPack(set, pack);
  },

  getTexture: (itemId) => {
    const key = itemId.toUpperCase();
    for (const pack of get().packs) {
      if (pack.enabled && pack.loaded) {
        const tex = pack.textures.get(key);
        if (tex) return tex;
      }
    }
    return null;
  },
}));

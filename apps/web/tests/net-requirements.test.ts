import { describe, expect, it } from "vitest";
import { getNetTree, summarizeNetTree } from "@/lib/net-requirements";
import type { ForgeSettings, RecipesData } from "@/lib/types";

const SETTINGS: ForgeSettings = {
  forgeSlots: 1,
  useMultipleSlots: false,
  quickForgeLevel: 0,
};

// SUPER -> 2 ENCHANTED_DIAMOND -> 160 DIAMOND (DIAMOND is a base material)
const craftRecipes: RecipesData = {
  SUPER: {
    internalname: "SUPER",
    recipe: { A1: "ENCHANTED_DIAMOND:2", count: "1" },
  },
  ENCHANTED_DIAMOND: {
    internalname: "ENCHANTED_DIAMOND",
    recipe: { A1: "DIAMOND:160", count: "1" },
  },
  DIAMOND: { internalname: "DIAMOND" },
};

const summary = (root: ReturnType<typeof getNetTree>) => {
  const s = summarizeNetTree(root);
  return Object.fromEntries(Array.from(s.byName, ([name, v]) => [name, v.net]));
};

describe("getNetTree", () => {
  it("computes full requirements with an empty inventory", () => {
    const tree = getNetTree("SUPER", craftRecipes, 1, new Map(), SETTINGS);
    expect(tree.net).toBe(1);
    expect(summary(tree)).toEqual({ ENCHANTED_DIAMOND: 2, DIAMOND: 320 });
  });

  it("subtracts owned base materials from the net", () => {
    const tree = getNetTree(
      "SUPER",
      craftRecipes,
      1,
      new Map([["DIAMOND", 100]]),
      SETTINGS,
    );
    expect(summary(tree)).toEqual({ ENCHANTED_DIAMOND: 2, DIAMOND: 220 });
  });

  it("drops a fully-owned intermediate AND its sub-tree", () => {
    const tree = getNetTree(
      "SUPER",
      craftRecipes,
      1,
      new Map([["ENCHANTED_DIAMOND", 2]]),
      SETTINGS,
    );
    // ENCHANTED_DIAMOND is owned -> no diamonds needed either.
    expect(tree.children).toHaveLength(0);
    expect(summary(tree)).toEqual({});
  });

  it("scales the sub-tree by the remaining net of a partially-owned parent", () => {
    const tree = getNetTree(
      "SUPER",
      craftRecipes,
      1,
      new Map([["ENCHANTED_DIAMOND", 1]]),
      SETTINGS,
    );
    // 1 of 2 ED owned -> craft 1 ED -> 160 diamonds (not 320).
    expect(summary(tree)).toEqual({ ENCHANTED_DIAMOND: 1, DIAMOND: 160 });
  });

  it("consumes a shared item once across branches", () => {
    const recipes: RecipesData = {
      GADGET: {
        internalname: "GADGET",
        recipe: { A1: "WIDGET:1", B1: "BOLT:1", count: "1" },
      },
      WIDGET: { internalname: "WIDGET", recipe: { A1: "SCREW:2", count: "1" } },
      BOLT: { internalname: "BOLT", recipe: { A1: "SCREW:3", count: "1" } },
      SCREW: { internalname: "SCREW" },
    };
    // Need 5 screws total; own 4 -> 1 still needed (pool consumed once).
    const tree = getNetTree(
      "GADGET",
      recipes,
      1,
      new Map([["SCREW", 4]]),
      SETTINGS,
    );
    expect(summary(tree).SCREW).toBe(1);
  });

  it("terminates on cycles", () => {
    const recipes: RecipesData = {
      A: { internalname: "A", recipe: { A1: "B:1", count: "1" } },
      B: { internalname: "B", recipe: { A1: "A:1", count: "1" } },
    };
    const tree = getNetTree("A", recipes, 1, new Map(), SETTINGS);
    expect(tree.internalname).toBe("A");
    // B appears once; the cycle back to A is cut.
    expect(tree.children.map((c) => c.internalname)).toEqual(["B"]);
  });
});

describe("summarizeNetTree", () => {
  it("sums forge time over net nodes and counts base types", () => {
    const recipes: RecipesData = {
      PLATE: {
        internalname: "PLATE",
        recipes: [{ type: "forge", duration: 600, inputs: ["BASE:1"] }],
      },
      BASE: { internalname: "BASE" },
    };
    const tree = getNetTree("PLATE", recipes, 2, new Map(), SETTINGS);
    const s = summarizeNetTree(tree);
    expect(s.totalForgeSeconds).toBe(1200); // 600 * 2, single slot
    expect(s.baseMaterialTypes).toBe(1); // BASE
    expect(s.byName.get("BASE")?.net).toBe(2);
    expect(s.byName.has("PLATE")).toBe(false); // root excluded
  });
});

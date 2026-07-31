import { describe, expect, it } from "vitest";
import {
  getForgeJobProgress,
  getForgeJobRemainingSeconds,
  getForgeRequirements,
  isForgeJobReady,
} from "@/lib/forge-tracker-utils";
import type { ActiveForgeJob, RecipesData } from "@/lib/types";

function forgeEntry(
  itemId: string,
  duration: number,
  ingredients: Array<{ item: string; count: number }> = [],
) {
  return {
    internalname: itemId,
    type: "forge",
    forge: {
      type: "forge" as const,
      forge_time: duration,
      forge_ingredients: ingredients,
    },
  };
}

describe("getForgeRequirements", () => {
  it("collects nested forge items in prerequisite-first order", () => {
    const recipes: RecipesData = {
      TARGET: forgeEntry("TARGET", 300, [{ item: "PART", count: 2 }]),
      PART: forgeEntry("PART", 60, [{ item: "RAW", count: 4 }]),
    };

    expect(getForgeRequirements("TARGET", 3, recipes)).toEqual([
      {
        requirementId: "PART",
        treePathId: '["TARGET","PART"]',
        itemId: "PART",
        requiredQuantity: 6,
        forgeTimeSeconds: 60,
      },
      {
        requirementId: "TARGET",
        treePathId: '["TARGET"]',
        itemId: "TARGET",
        requiredQuantity: 3,
        forgeTimeSeconds: 300,
      },
    ]);
  });

  it("keeps duplicate forge items separate across crafting branches", () => {
    const recipes: RecipesData = {
      TARGET: forgeEntry("TARGET", 300, [
        { item: "CRAFT_A", count: 1 },
        { item: "CRAFT_B", count: 1 },
        { item: "CRAFT_C", count: 1 },
      ]),
      CRAFT_A: {
        internalname: "CRAFT_A",
        recipe: { A1: "PART:10", count: 1 },
      },
      CRAFT_B: {
        internalname: "CRAFT_B",
        recipe: { A1: "PART:4", count: 1 },
      },
      CRAFT_C: {
        internalname: "CRAFT_C",
        recipe: { A1: "PART:8", count: 1 },
      },
      PART: forgeEntry("PART", 60),
    };

    const requirements = getForgeRequirements("TARGET", 1, recipes);
    expect(requirements).toHaveLength(4);
    expect(requirements.slice(0, 3)).toEqual([
      {
        requirementId: "PART",
        treePathId: '["TARGET","CRAFT_A","PART"]',
        itemId: "PART",
        requiredQuantity: 10,
        forgeTimeSeconds: 60,
      },
      {
        requirementId: 'PART::["TARGET","CRAFT_B","PART"]',
        treePathId: '["TARGET","CRAFT_B","PART"]',
        itemId: "PART",
        requiredQuantity: 4,
        forgeTimeSeconds: 60,
      },
      {
        requirementId: 'PART::["TARGET","CRAFT_C","PART"]',
        treePathId: '["TARGET","CRAFT_C","PART"]',
        itemId: "PART",
        requiredQuantity: 8,
        forgeTimeSeconds: 60,
      },
    ]);
    expect(requirements[3]?.itemId).toBe("TARGET");
  });

  it("respects crafting output counts", () => {
    const recipes: RecipesData = {
      TARGET: forgeEntry("TARGET", 300, [{ item: "CRAFTED", count: 3 }]),
      CRAFTED: {
        internalname: "CRAFTED",
        recipe: { A1: "PART:1", count: 2 },
      },
      PART: forgeEntry("PART", 60),
    };

    expect(getForgeRequirements("TARGET", 1, recipes)[0]).toEqual({
      requirementId: "PART",
      treePathId: '["TARGET","CRAFTED","PART"]',
      itemId: "PART",
      requiredQuantity: 2,
      forgeTimeSeconds: 60,
    });
  });

  it("protects against cycles", () => {
    const recipes: RecipesData = {
      TARGET: forgeEntry("TARGET", 300, [{ item: "PART", count: 1 }]),
      PART: forgeEntry("PART", 60, [{ item: "TARGET", count: 1 }]),
    };

    expect(getForgeRequirements("TARGET", 1, recipes)).toHaveLength(2);
  });

  it("does not create a tracker for a non-forge target", () => {
    const recipes: RecipesData = {
      TARGET: { internalname: "TARGET", recipe: { A1: "PART:1" } },
      PART: forgeEntry("PART", 60),
    };

    expect(getForgeRequirements("TARGET", 1, recipes)).toEqual([]);
  });
});

describe("forge job timers", () => {
  const job: ActiveForgeJob = {
    id: "job-1",
    planTargetItemId: "TARGET",
    requirementId: "PART",
    itemId: "PART",
    startedAtMs: 1_000,
    endsAtMs: 11_000,
    totalDurationSeconds: 10,
  };

  it("derives remaining time and progress from absolute timestamps", () => {
    expect(getForgeJobRemainingSeconds(job, 6_000)).toBe(5);
    expect(getForgeJobProgress(job, 6_000)).toBe(50);
    expect(isForgeJobReady(job, 6_000)).toBe(false);
  });

  it("clamps overdue jobs to ready and 100 percent", () => {
    expect(getForgeJobRemainingSeconds(job, 12_000)).toBe(0);
    expect(getForgeJobProgress(job, 12_000)).toBe(100);
    expect(isForgeJobReady(job, 12_000)).toBe(true);
  });
});

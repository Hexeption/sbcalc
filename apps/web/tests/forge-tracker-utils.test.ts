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
      { itemId: "PART", requiredQuantity: 6, forgeTimeSeconds: 60 },
      { itemId: "TARGET", requiredQuantity: 3, forgeTimeSeconds: 300 },
    ]);
  });

  it("aggregates duplicate forge items from separate crafting branches", () => {
    const recipes: RecipesData = {
      TARGET: forgeEntry("TARGET", 300, [
        { item: "CRAFT_A", count: 1 },
        { item: "CRAFT_B", count: 1 },
      ]),
      CRAFT_A: {
        internalname: "CRAFT_A",
        recipe: { A1: "PART:2", count: 1 },
      },
      CRAFT_B: {
        internalname: "CRAFT_B",
        recipe: { A1: "PART:3", count: 1 },
      },
      PART: forgeEntry("PART", 60),
    };

    expect(getForgeRequirements("TARGET", 1, recipes)).toEqual([
      { itemId: "PART", requiredQuantity: 5, forgeTimeSeconds: 60 },
      { itemId: "TARGET", requiredQuantity: 1, forgeTimeSeconds: 300 },
    ]);
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

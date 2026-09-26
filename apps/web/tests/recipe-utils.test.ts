import { describe, expect, it } from "vitest";
import {
  aggregateIngredients,
  getIngredientsFromRecipe,
  getRecipe,
} from "@/lib/recipe-utils";
import type { ForgeRecipe, RecipeEntry } from "@/lib/types";

describe("aggregateIngredients", () => {
  it("should aggregate ingredient counts correctly", () => {
    const ingredients = ["IRON_INGOT:10", "DIAMOND:5", "IRON_INGOT:20"];

    const result = aggregateIngredients(ingredients);

    expect(result).toEqual({
      IRON_INGOT: 30,
      DIAMOND: 5,
    });
  });

  it("should handle ingredients without count", () => {
    const ingredients = ["IRON_INGOT", "DIAMOND:5"];

    const result = aggregateIngredients(ingredients);

    expect(result).toEqual({
      IRON_INGOT: 1,
      DIAMOND: 5,
    });
  });

  it("should handle empty array", () => {
    const result = aggregateIngredients([]);
    expect(result).toEqual({});
  });

  it("should handle invalid ingredient strings", () => {
    const ingredients = ["", "IRON_INGOT:10", ":5"];

    const result = aggregateIngredients(ingredients);

    expect(result).toEqual({
      IRON_INGOT: 10,
    });
  });
});

describe("getRecipe", () => {
  it("should return recipe object when present", () => {
    const entry: RecipeEntry = {
      internalname: "TEST_ITEM",
      recipe: {
        A1: "IRON_INGOT:10",
        count: "1",
      },
    };

    const result = getRecipe(entry);

    expect(result).toEqual({
      A1: "IRON_INGOT:10",
      count: "1",
    });
  });

  it("should return forge recipe when present in recipes array", () => {
    const entry: RecipeEntry = {
      internalname: "TEST_ITEM",
      recipes: [
        {
          type: "forge" as const,
          duration: 300,
          inputs: ["IRON_INGOT:10", "DIAMOND:5"],
        },
      ],
    };

    const result = getRecipe(entry) as ForgeRecipe;

    expect(result.type).toBe("forge");
    expect(result.forge_time).toBe(300);
    expect(result.forge_ingredients).toEqual([
      { item: "IRON_INGOT", count: 10 },
      { item: "DIAMOND", count: 5 },
    ]);
  });

  it("should return undefined when no recipe present", () => {
    const entry: RecipeEntry = {
      internalname: "TEST_ITEM",
    };

    const result = getRecipe(entry);
    expect(result).toBeUndefined();
  });
});

describe("getIngredientsFromRecipe", () => {
  it("should extract ingredients from regular recipe", () => {
    const recipe = {
      A1: "IRON_INGOT:10",
      B2: "DIAMOND:5",
      count: "1",
    };

    const result = getIngredientsFromRecipe(recipe);

    expect(result).toEqual(["IRON_INGOT:10", "DIAMOND:5"]);
  });

  it("should extract ingredients from forge recipe", () => {
    const recipe: ForgeRecipe = {
      type: "forge",
      forge_time: 300,
      forge_ingredients: [
        { item: "IRON_INGOT", count: 10 },
        { item: "DIAMOND", count: 5 },
      ],
    };

    const result = getIngredientsFromRecipe(recipe);

    expect(result).toEqual(["IRON_INGOT:10", "DIAMOND:5"]);
  });

  it("should filter out non-ingredient entries", () => {
    const recipe = {
      A1: "IRON_INGOT:10",
      count: "1",
      invalid: "no_colon",
      empty: "",
    };

    const result = getIngredientsFromRecipe(recipe);

    expect(result).toEqual(["IRON_INGOT:10"]);
  });
});

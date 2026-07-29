import { act, fireEvent, render, screen } from "@testing-library/react";
// biome-ignore lint/correctness/noUnusedImports: React must be in scope for JSX in Vitest
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ForgeTracker } from "@/components/forge-tracker";
import { useCalculatorStore } from "@/lib/calculator-store";

const recipeData = vi.hoisted(() => ({
  recipes: {
    TARGET: {
      internalname: "TARGET",
      displayname: "Target Item",
      type: "forge",
      forge: {
        type: "forge" as const,
        forge_time: 10,
        forge_ingredients: [{ item: "PART", count: 2 }],
      },
    },
    PART: {
      internalname: "PART",
      displayname: "Nested Part",
      type: "forge",
      forge: {
        type: "forge" as const,
        forge_time: 20,
        forge_ingredients: [{ item: "RAW", count: 1 }],
      },
    },
    OTHER: {
      internalname: "OTHER",
      displayname: "Other Target",
      type: "forge",
      forge: {
        type: "forge" as const,
        forge_time: 30,
        forge_ingredients: [],
      },
    },
    NON_FORGE: {
      internalname: "NON_FORGE",
      displayname: "Crafted Item",
      recipe: { A1: "PART:1" },
    },
  },
  itemsData: {},
}));

vi.mock("@/lib/recipe-data-context", () => ({
  useRecipeData: () => recipeData,
}));

vi.mock("@/components/item-image", () => ({
  ItemImage: ({ alt }: { alt: string }) => <span>{alt} icon</span>,
}));

vi.mock("@/components/minecraft-colored-text", () => ({
  MinecraftColoredText: ({ text }: { text: string }) => <span>{text}</span>,
}));

const forgeSettings = {
  forgeSlots: 2,
  useMultipleSlots: true,
  quickForgeLevel: 0,
};

describe("ForgeTracker", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-29T12:00:00Z"));
    useCalculatorStore.setState({
      settings: forgeSettings,
      forgeTrackerPlans: {},
      activeForgeJobs: [],
      hydrated: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders nested requirements only for a forge target", () => {
    const { rerender } = render(
      <ForgeTracker
        targetItemId="TARGET"
        targetQuantity={2}
        forgeSettings={forgeSettings}
      />,
    );

    expect(screen.getByText("Forge Tracker")).toBeInTheDocument();
    expect(screen.getByText("Nested Part")).toBeInTheDocument();
    expect(screen.getByText("Target Item")).toBeInTheDocument();

    rerender(
      <ForgeTracker
        targetItemId="NON_FORGE"
        targetQuantity={1}
        forgeSettings={forgeSettings}
      />,
    );
    expect(screen.queryByText("Forge Tracker")).not.toBeInTheDocument();
  });

  it("shows globally occupied slots from another plan", () => {
    useCalculatorStore.setState({
      activeForgeJobs: [
        {
          id: "other-job",
          planTargetItemId: "OTHER",
          itemId: "OTHER",
          startedAtMs: Date.now(),
          endsAtMs: Date.now() + 30_000,
          totalDurationSeconds: 30,
        },
      ],
    });

    render(
      <ForgeTracker
        targetItemId="TARGET"
        targetQuantity={1}
        forgeSettings={forgeSettings}
      />,
    );

    expect(screen.getByText("Other plan")).toBeInTheDocument();
    expect(screen.getByText("1 / 2 occupied")).toBeInTheDocument();
  });

  it("starts with restored remaining time, becomes ready, and collects", () => {
    render(
      <ForgeTracker
        targetItemId="TARGET"
        targetQuantity={1}
        forgeSettings={forgeSettings}
      />,
    );

    const firstStartButton = screen.getAllByRole("button", {
      name: "Start",
    })[0];
    expect(firstStartButton).toBeDefined();
    if (!firstStartButton) return;
    fireEvent.click(firstStartButton);
    fireEvent.click(
      screen.getByLabelText("This job is already running in-game"),
    );
    fireEvent.change(screen.getByLabelText("Seconds"), {
      target: { value: "5" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Start job" }));

    expect(screen.getByText("5s")).toBeInTheDocument();
    expect(
      screen.getByRole("progressbar", { name: "Nested Part forge progress" }),
    ).toHaveAttribute("aria-valuenow", "75");

    act(() => vi.advanceTimersByTime(5_000));
    expect(screen.getByText("Ready")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Collect" }));

    expect(
      useCalculatorStore.getState().forgeTrackerPlans.TARGET?.completedByItem
        .PART,
    ).toBe(1);
  });
});

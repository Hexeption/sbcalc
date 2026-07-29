import { act, fireEvent, render, screen } from "@testing-library/react";
// biome-ignore lint/correctness/noUnusedImports: React must be in scope for JSX in Vitest
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ForgeTracker } from "@/components/forge-tracker";
import { ForgeTreeTrackerControls } from "@/components/forge-tree-tracker-controls";
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

  it("renders the compact tracker only for a forge target", () => {
    const { rerender } = render(
      <ForgeTracker
        targetItemId="TARGET"
        targetQuantity={2}
        forgeSettings={forgeSettings}
      />,
    );

    expect(screen.getByText("Forge Tracker")).toBeInTheDocument();
    expect(screen.queryByText("Required forge items")).not.toBeInTheDocument();
    expect(screen.getAllByText("Available")).toHaveLength(2);

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
    expect(screen.getByText("1 / 2 slots")).toBeInTheDocument();
  });

  it("shows restored progress, becomes ready, and collects", () => {
    act(() => {
      useCalculatorStore.getState().startForgeJob("TARGET", "PART", 20, 5, 2);
    });

    render(
      <ForgeTracker
        targetItemId="TARGET"
        targetQuantity={1}
        forgeSettings={forgeSettings}
      />,
    );

    expect(screen.getByText("5s")).toBeInTheDocument();
    expect(
      screen.getByRole("progressbar", { name: "Nested Part forge progress" }),
    ).toHaveAttribute("aria-valuenow", "75");

    act(() => vi.advanceTimersByTime(5_000));
    expect(screen.getByText("Ready")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Collect Nested Part" }),
    );

    expect(
      useCalculatorStore.getState().forgeTrackerPlans.TARGET?.completedByItem
        .PART,
    ).toBe(1);
  });

  it("edits completed quantity and starts jobs from a tree control", () => {
    render(
      <ForgeTreeTrackerControls
        planTargetItemId="TARGET"
        itemName="Nested Part"
        requirement={{
          itemId: "PART",
          requiredQuantity: 2,
          forgeTimeSeconds: 20,
        }}
        forgeSettings={forgeSettings}
      />,
    );

    fireEvent.change(screen.getByLabelText("Nested Part completed"), {
      target: { value: "1" },
    });
    expect(
      useCalculatorStore.getState().forgeTrackerPlans.TARGET?.completedByItem
        .PART,
    ).toBe(1);

    fireEvent.click(
      screen.getByRole("button", { name: "Start forging Nested Part" }),
    );
    fireEvent.click(
      screen.getByLabelText("This job is already running in-game"),
    );
    fireEvent.change(screen.getByLabelText("Seconds"), {
      target: { value: "5" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Start job" }));

    expect(useCalculatorStore.getState().activeForgeJobs).toHaveLength(1);
    expect(useCalculatorStore.getState().activeForgeJobs[0]?.endsAtMs).toBe(
      Date.now() + 5_000,
    );
  });
});

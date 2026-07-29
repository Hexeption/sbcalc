import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCalculatorStore } from "@/lib/calculator-store";

describe("calculator store forge tracker", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-29T12:00:00Z"));
    vi.mocked(localStorage.getItem).mockReset();
    vi.mocked(localStorage.setItem).mockReset();
    useCalculatorStore.setState({
      settings: {
        forgeSlots: 1,
        useMultipleSlots: true,
        quickForgeLevel: 0,
      },
      forgeTrackerPlans: {},
      activeForgeJobs: [],
      hydrated: false,
    });
  });

  it("starts a partially elapsed job and enforces global slot capacity", () => {
    const store = useCalculatorStore.getState();

    expect(store.startForgeJob("TARGET", "PART", "PART", 100, 40, 2)).toBe(
      true,
    );
    expect(
      store.startForgeJob("OTHER", "OTHER_PART", "OTHER_PART", 100, 100, 2),
    ).toBe(false);

    const job = useCalculatorStore.getState().activeForgeJobs[0];
    expect(job?.startedAtMs).toBe(Date.now() - 60_000);
    expect(job?.endsAtMs).toBe(Date.now() + 40_000);
  });

  it("keeps a completed job ready until it is collected", () => {
    const store = useCalculatorStore.getState();
    expect(store.startForgeJob("TARGET", "PART", "PART", 10, 10, 1)).toBe(true);
    const jobId = useCalculatorStore.getState().activeForgeJobs[0]?.id;
    expect(jobId).toBeDefined();
    if (!jobId) return;

    expect(useCalculatorStore.getState().collectForgeJob(jobId)).toBe(false);
    vi.advanceTimersByTime(10_000);
    expect(useCalculatorStore.getState().activeForgeJobs).toHaveLength(1);
    expect(useCalculatorStore.getState().collectForgeJob(jobId)).toBe(true);
    expect(
      useCalculatorStore.getState().forgeTrackerPlans.TARGET
        ?.completedByRequirement.PART,
    ).toBe(1);
    expect(useCalculatorStore.getState().activeForgeJobs).toHaveLength(0);
  });

  it("cancels without increasing completed quantity", () => {
    const store = useCalculatorStore.getState();
    store.startForgeJob("TARGET", "PART", "PART", 10, 10, 1);
    const jobId = useCalculatorStore.getState().activeForgeJobs[0]?.id;
    if (!jobId) return;

    useCalculatorStore.getState().cancelForgeJob(jobId);

    expect(useCalculatorStore.getState().activeForgeJobs).toHaveLength(0);
    expect(
      useCalculatorStore.getState().forgeTrackerPlans.TARGET
        ?.completedByRequirement.PART,
    ).toBeUndefined();
  });

  it("preserves surplus completed quantities", () => {
    useCalculatorStore.getState().setForgeCompleted("TARGET", "PART", 7);

    expect(
      useCalculatorStore.getState().forgeTrackerPlans.TARGET
        ?.completedByRequirement.PART,
    ).toBe(7);
  });

  it("tracks separate requirements for the same forged item", () => {
    useCalculatorStore.setState({
      settings: {
        forgeSlots: 2,
        useMultipleSlots: true,
        quickForgeLevel: 0,
      },
    });
    const store = useCalculatorStore.getState();
    const secondRequirement = 'PART::["TARGET","BRANCH_B","PART"]';

    store.setForgeCompleted("TARGET", "PART", 3);
    store.setForgeCompleted("TARGET", secondRequirement, 1);
    expect(
      useCalculatorStore.getState().forgeTrackerPlans.TARGET
        ?.completedByRequirement,
    ).toEqual({ PART: 3, [secondRequirement]: 1 });

    expect(store.startForgeJob("TARGET", "PART", "PART", 10, 10, 4)).toBe(true);
    expect(
      store.startForgeJob("TARGET", secondRequirement, "PART", 10, 10, 2),
    ).toBe(true);

    vi.advanceTimersByTime(10_000);
    const secondJobId = useCalculatorStore.getState().activeForgeJobs[1]?.id;
    expect(secondJobId).toBeDefined();
    if (!secondJobId) return;
    expect(useCalculatorStore.getState().collectForgeJob(secondJobId)).toBe(
      true,
    );
    expect(
      useCalculatorStore.getState().forgeTrackerPlans.TARGET
        ?.completedByRequirement,
    ).toEqual({ PART: 3, [secondRequirement]: 2 });
  });

  it("resets only the selected plan and its jobs", () => {
    useCalculatorStore.setState({
      settings: {
        forgeSlots: 2,
        useMultipleSlots: true,
        quickForgeLevel: 0,
      },
    });
    const store = useCalculatorStore.getState();
    store.setForgeCompleted("TARGET", "PART", 2);
    store.setForgeCompleted("OTHER", "OTHER_PART", 3);
    store.startForgeJob("TARGET", "PART", "PART", 10, 10, 5);
    store.startForgeJob("OTHER", "OTHER_PART", "OTHER_PART", 10, 10, 5);

    useCalculatorStore.getState().resetForgePlan("TARGET");

    expect(
      useCalculatorStore.getState().forgeTrackerPlans.TARGET,
    ).toBeUndefined();
    expect(useCalculatorStore.getState().forgeTrackerPlans.OTHER).toBeDefined();
    expect(useCalculatorStore.getState().activeForgeJobs).toHaveLength(1);
    expect(
      useCalculatorStore.getState().activeForgeJobs[0]?.planTargetItemId,
    ).toBe("OTHER");
  });

  it("hydrates valid tracker state and ignores malformed entries", () => {
    vi.mocked(localStorage.getItem).mockImplementation((key) => {
      if (key !== "sbcalc_forgeTracker_v2") return null;
      return JSON.stringify({
        version: 2,
        plans: {
          TARGET: {
            targetItemId: "WRONG_VALUE_IS_NORMALIZED",
            completedByRequirement: { PART: 2.8, INVALID: "3" },
          },
        },
        activeJobs: [
          {
            id: "job-1",
            planTargetItemId: "TARGET",
            requirementId: "PART",
            itemId: "PART",
            startedAtMs: Date.now(),
            endsAtMs: Date.now() + 10_000,
            totalDurationSeconds: 10,
          },
          { id: "invalid" },
        ],
      });
    });

    useCalculatorStore.getState().hydrate();

    expect(
      useCalculatorStore.getState().forgeTrackerPlans.TARGET
        ?.completedByRequirement,
    ).toEqual({ PART: 2 });
    expect(useCalculatorStore.getState().activeForgeJobs).toHaveLength(1);
  });

  it("migrates persisted v1 progress and jobs to v2", () => {
    vi.mocked(localStorage.getItem).mockImplementation((key) => {
      if (key === "sbcalc_forgeTracker_v2") return null;
      if (key !== "sbcalc_forgeTracker_v1") return null;
      return JSON.stringify({
        version: 1,
        plans: {
          TARGET: {
            targetItemId: "TARGET",
            completedByItem: { PART: 4 },
          },
        },
        activeJobs: [
          {
            id: "legacy-job",
            planTargetItemId: "TARGET",
            itemId: "PART",
            startedAtMs: Date.now(),
            endsAtMs: Date.now() + 10_000,
            totalDurationSeconds: 10,
          },
        ],
      });
    });

    useCalculatorStore.getState().hydrate();

    expect(
      useCalculatorStore.getState().forgeTrackerPlans.TARGET
        ?.completedByRequirement,
    ).toEqual({ PART: 4 });
    expect(
      useCalculatorStore.getState().activeForgeJobs[0]?.requirementId,
    ).toBe("PART");
    expect(localStorage.setItem).toHaveBeenCalledWith(
      "sbcalc_forgeTracker_v2",
      expect.stringContaining('"version":2'),
    );
  });
});

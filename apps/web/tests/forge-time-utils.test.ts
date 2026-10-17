import { describe, expect, it } from "vitest";
import {
  applyQuickForgeReduction,
  calculateOptimalForgeTime,
  calculateQuickForgeReduction,
  formatForgeTime,
} from "@/lib/forge-time-utils";
import type { ForgeSettings } from "@/lib/types";

describe("formatForgeTime", () => {
  it("should format seconds correctly", () => {
    expect(formatForgeTime(30)).toBe("30s");
    expect(formatForgeTime(59)).toBe("59s");
  });

  it("should format minutes correctly", () => {
    expect(formatForgeTime(60)).toBe("1m 0s");
    expect(formatForgeTime(90)).toBe("1m 30s");
    expect(formatForgeTime(3599)).toBe("59m 59s");
  });

  it("should format hours correctly", () => {
    expect(formatForgeTime(3600)).toBe("1h 0m");
    expect(formatForgeTime(3660)).toBe("1h 1m");
    expect(formatForgeTime(3690)).toBe("1h 1m 30s");
  });

  it("should handle zero time", () => {
    expect(formatForgeTime(0)).toBe("0s");
  });

  it("should handle large times", () => {
    expect(formatForgeTime(7200)).toBe("2h 0m");
    expect(formatForgeTime(86400)).toBe("1d 0h");
  });
});

describe("calculateOptimalForgeTime", () => {
  const mockSettings: ForgeSettings = {
    forgeSlots: 2,
    useMultipleSlots: true,
    quickForgeLevel: 0,
  };

  it("should calculate basic forge time correctly", () => {
    const result = calculateOptimalForgeTime(600, 5, mockSettings);

    // 5 items with 2 slots: ceil(5/2) = 3 batches
    // 3 batches * 600 seconds = 1800 seconds
    expect(result).toBe(1800);
  });

  it("should handle single slot mode", () => {
    const singleSlotSettings: ForgeSettings = {
      forgeSlots: 1,
      useMultipleSlots: false,
      quickForgeLevel: 0,
    };

    const result = calculateOptimalForgeTime(600, 5, singleSlotSettings);

    // 5 items * 600 seconds each = 3000 seconds total
    expect(result).toBe(3000);
  });

  it("should apply quick forge reduction", () => {
    const quickForgeSettings: ForgeSettings = {
      forgeSlots: 1,
      useMultipleSlots: false,
      quickForgeLevel: 10, // Should give some reduction
    };

    const result = calculateOptimalForgeTime(600, 1, quickForgeSettings);

    // Should be less than 600 due to quick forge reduction
    expect(result).toBeLessThan(600);
  });

  it("should handle zero items", () => {
    const result = calculateOptimalForgeTime(600, 0, mockSettings);

    // The function returns base forge time when quantity is 0
    expect(result).toBe(600);
  });

  it("should handle parallel processing when items <= slots", () => {
    const result = calculateOptimalForgeTime(600, 2, mockSettings);

    // 2 items with 2 slots = all parallel, so just 600 seconds
    expect(result).toBe(600);
  });
});

describe("calculateQuickForgeReduction", () => {
  it("should return 0 for level 0", () => {
    expect(calculateQuickForgeReduction(0)).toBe(0);
  });

  it("should calculate reduction correctly for various levels", () => {
    expect(calculateQuickForgeReduction(10)).toBe(15); // 10 + (10 * 0.5) + 0
    expect(calculateQuickForgeReduction(20)).toBe(30); // 10 + (20 * 0.5) + 10, capped at 30
    expect(calculateQuickForgeReduction(40)).toBe(30); // Should be capped at 30%
  });

  it("should handle negative levels", () => {
    expect(calculateQuickForgeReduction(-5)).toBe(0);
  });
});

describe("applyQuickForgeReduction", () => {
  it("should apply reduction correctly", () => {
    const result = applyQuickForgeReduction(1000, 10);

    // 10% base + 5% from level = 15% reduction
    // 1000 * 0.85 = 850
    expect(result).toBe(850);
  });

  it("should return original time for level 0", () => {
    expect(applyQuickForgeReduction(1000, 0)).toBe(1000);
  });

  it("should floor the result", () => {
    const result = applyQuickForgeReduction(333, 10);

    // Should floor the result
    expect(result).toBe(Math.floor(333 * 0.85));
  });
});

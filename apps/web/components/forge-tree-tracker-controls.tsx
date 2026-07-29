"use client";

import { Input } from "@workspace/ui/components/input";
import { Clock3 } from "lucide-react";
import { useId } from "react";
import { ForgeStartDialog } from "@/components/forge-start-dialog";
import { useCalculatorStore } from "@/lib/calculator-store";
import { applyQuickForgeReduction } from "@/lib/forge-time-utils";
import type { ForgeRequirement, ForgeSettings } from "@/lib/types";

export function ForgeTreeTrackerControls({
  planTargetItemId,
  itemName,
  requirement,
  forgeSettings,
}: {
  planTargetItemId: string;
  itemName: string;
  requirement: ForgeRequirement;
  forgeSettings: ForgeSettings;
}) {
  const completedInputId = useId();
  const completed = useCalculatorStore(
    (state) =>
      state.forgeTrackerPlans[planTargetItemId]?.completedByItem[
        requirement.itemId
      ] ?? 0,
  );
  const activeJobs = useCalculatorStore((state) => state.activeForgeJobs);
  const setForgeCompleted = useCalculatorStore(
    (state) => state.setForgeCompleted,
  );
  const startForgeJob = useCalculatorStore((state) => state.startForgeJob);

  const activeCount = activeJobs.filter(
    (job) =>
      job.planTargetItemId === planTargetItemId &&
      job.itemId === requirement.itemId,
  ).length;
  const configuredSlots = Math.max(1, forgeSettings.forgeSlots);
  const slotsFull = activeJobs.length >= configuredSlots;
  const amountCovered = completed + activeCount >= requirement.requiredQuantity;
  const effectiveDuration = applyQuickForgeReduction(
    requirement.forgeTimeSeconds,
    forgeSettings.quickForgeLevel ?? 0,
  );
  const surplus = Math.max(0, completed - requirement.requiredQuantity);

  return (
    <fieldset
      aria-label={`${itemName} forge tracker`}
      className="flex shrink-0 items-center gap-1 rounded-md border border-border/50 bg-background/60 px-0.5 py-0.5 sm:px-1"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <label htmlFor={completedInputId} className="sr-only">
        {itemName} completed
      </label>
      <span className="hidden text-[9px] text-muted-foreground sm:inline">
        Done
      </span>
      <Input
        id={completedInputId}
        type="number"
        inputMode="numeric"
        min={0}
        value={completed}
        onChange={(event) =>
          setForgeCompleted(
            planTargetItemId,
            requirement.itemId,
            Number(event.target.value),
          )
        }
        className="h-6 w-12 px-1 text-center font-mono text-[10px]"
      />
      <span className="whitespace-nowrap font-mono text-[10px] text-muted-foreground">
        / {requirement.requiredQuantity.toLocaleString()}
      </span>
      {activeCount > 0 && (
        <span
          className="flex items-center gap-0.5 text-[9px] text-blue-600 dark:text-blue-400"
          title={`${activeCount} active`}
        >
          <Clock3 className="h-3 w-3" />
          {activeCount}
        </span>
      )}
      {surplus > 0 && (
        <span className="text-[9px] text-amber-600 dark:text-amber-400">
          +{surplus}
        </span>
      )}
      <ForgeStartDialog
        itemName={itemName}
        durationSeconds={effectiveDuration}
        disabled={slotsFull || amountCovered}
        onStart={(remainingSeconds) =>
          startForgeJob(
            planTargetItemId,
            requirement.itemId,
            effectiveDuration,
            remainingSeconds,
            requirement.requiredQuantity,
          )
        }
      />
    </fieldset>
  );
}

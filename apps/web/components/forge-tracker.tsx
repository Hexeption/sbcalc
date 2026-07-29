"use client";

import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import { Progress } from "@workspace/ui/components/progress";
import { Anvil, Check, RotateCcw, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ItemImage } from "@/components/item-image";
import { MinecraftColoredText } from "@/components/minecraft-colored-text";
import { useCalculatorStore } from "@/lib/calculator-store";
import { formatForgeTime } from "@/lib/forge-time-utils";
import {
  getForgeJobProgress,
  getForgeJobRemainingSeconds,
  getForgeRequirements,
  isForgeJobReady,
} from "@/lib/forge-tracker-utils";
import { useRecipeData } from "@/lib/recipe-data-context";
import type { ActiveForgeJob, ForgeSettings } from "@/lib/types";
import { getDisplayName } from "@/lib/utils";

interface ForgeTrackerProps {
  targetItemId: string;
  targetQuantity: number;
  forgeSettings: ForgeSettings;
}

function stripMinecraftFormatting(value: string): string {
  return value.replace(/(?:\u00c2)?\u00a7./g, "");
}

function ForgeSlot({
  job,
  index,
  currentTargetItemId,
  nowMs,
  onCollect,
  onCancel,
}: {
  job?: ActiveForgeJob;
  index: number;
  currentTargetItemId: string;
  nowMs: number;
  onCollect: (jobId: string) => void;
  onCancel: (jobId: string) => void;
}) {
  const { recipes, itemsData } = useRecipeData();

  if (!job) {
    return (
      <div className="flex h-20 min-w-36 flex-col items-center justify-center rounded-md border border-dashed border-border/60 bg-muted/10 px-2">
        <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
          Slot {index + 1}
        </span>
        <span className="mt-1 text-[10px] text-muted-foreground/70">
          Available
        </span>
      </div>
    );
  }

  const entry = recipes[job.itemId] || itemsData[job.itemId];
  const displayName = getDisplayName(entry, job.itemId, itemsData);
  const plainDisplayName = stripMinecraftFormatting(displayName);
  const ready = isForgeJobReady(job, nowMs);
  const remainingSeconds = getForgeJobRemainingSeconds(job, nowMs);
  const progress = getForgeJobProgress(job, nowMs);
  const belongsToCurrentPlan = job.planTargetItemId === currentTargetItemId;
  const targetEntry =
    recipes[job.planTargetItemId] || itemsData[job.planTargetItemId];
  const targetName = stripMinecraftFormatting(
    getDisplayName(targetEntry, job.planTargetItemId, itemsData),
  );

  return (
    <div
      className={`h-20 min-w-36 rounded-md border px-2 py-1.5 ${
        ready
          ? "border-emerald-500/40 bg-emerald-500/5"
          : "border-border/60 bg-muted/15"
      }`}
    >
      <div className="flex items-center gap-1.5">
        <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
          Slot {index + 1}
        </span>
        {!belongsToCurrentPlan && (
          <span
            className="ml-auto truncate rounded bg-blue-500/10 px-1 py-0.5 text-[8px] text-blue-600 dark:text-blue-400"
            title={`For ${targetName}`}
          >
            Other plan
          </span>
        )}
      </div>

      <div className="mt-1 flex min-w-0 items-center gap-1.5">
        <ItemImage
          entry={entry}
          internalname={job.itemId}
          alt={plainDisplayName}
          width={18}
          height={18}
        />
        <MinecraftColoredText
          text={displayName}
          className="min-w-0 flex-1 truncate text-[10px] font-medium"
          title={plainDisplayName}
        />
      </div>

      <div className="mt-1 flex items-center gap-1.5">
        <Progress
          value={progress}
          aria-label={`${plainDisplayName} forge progress`}
          className="h-1 flex-1"
        />
        <span
          className={`whitespace-nowrap font-mono text-[9px] ${
            ready ? "text-emerald-600 dark:text-emerald-400" : ""
          }`}
        >
          {ready ? "Ready" : formatForgeTime(remainingSeconds)}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 shrink-0 text-muted-foreground hover:text-destructive"
          onClick={() => onCancel(job.id)}
          aria-label={`Cancel ${plainDisplayName}`}
          title="Cancel job"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
        {ready && (
          <Button
            size="icon"
            className="h-5 w-5 shrink-0"
            onClick={() => onCollect(job.id)}
            aria-label={`Collect ${plainDisplayName}`}
            title="Collect item"
          >
            <Check className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}

function ResetPlanDialog({
  disabled,
  onReset,
}: {
  disabled: boolean;
  onReset: () => void;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          disabled={disabled}
          className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
          aria-label="Reset forge plan"
          title="Reset plan"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset forge plan?</DialogTitle>
          <DialogDescription>
            This removes all completed quantities and cancels every active job
            assigned to this target. Jobs from other plans are not affected.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Keep plan</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button variant="destructive" onClick={onReset}>
              Reset plan
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ForgeTracker({
  targetItemId,
  targetQuantity,
  forgeSettings,
}: ForgeTrackerProps) {
  const { recipes } = useRecipeData();
  const forgeTrackerPlans = useCalculatorStore((s) => s.forgeTrackerPlans);
  const activeForgeJobs = useCalculatorStore((s) => s.activeForgeJobs);
  const collectForgeJob = useCalculatorStore((s) => s.collectForgeJob);
  const cancelForgeJob = useCalculatorStore((s) => s.cancelForgeJob);
  const resetForgePlan = useCalculatorStore((s) => s.resetForgePlan);
  const [nowMs, setNowMs] = useState(() => Date.now());

  const requirements = useMemo(
    () => getForgeRequirements(targetItemId, targetQuantity, recipes),
    [targetItemId, targetQuantity, recipes],
  );

  useEffect(() => {
    setNowMs(Date.now());
    if (activeForgeJobs.length === 0) return;
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [activeForgeJobs.length]);

  if (requirements.length === 0) return null;

  const completedByItem =
    forgeTrackerPlans[targetItemId]?.completedByItem ?? {};
  const configuredSlots = Math.max(1, forgeSettings.forgeSlots);
  const renderedSlotCount = Math.max(configuredSlots, activeForgeJobs.length);
  const currentPlanJobs = activeForgeJobs.filter(
    (job) => job.planTargetItemId === targetItemId,
  );
  const totalRequired = requirements.reduce(
    (sum, requirement) => sum + requirement.requiredQuantity,
    0,
  );
  const completedTowardPlan = requirements.reduce(
    (sum, requirement) =>
      sum +
      Math.min(
        requirement.requiredQuantity,
        completedByItem[requirement.itemId] ?? 0,
      ),
    0,
  );
  const overallProgress =
    totalRequired > 0 ? (completedTowardPlan / totalRequired) * 100 : 0;
  const hasPlanData =
    currentPlanJobs.length > 0 ||
    Object.values(completedByItem).some((quantity) => quantity > 0);

  return (
    <section className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm">
      <div className="flex flex-wrap items-center gap-2 border-b border-border/40 px-3 py-2">
        <div className="flex shrink-0 items-center gap-1.5">
          <Anvil className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
          <h3 className="text-xs font-semibold">Forge Tracker</h3>
        </div>

        <div className="flex min-w-44 flex-1 items-center gap-2 sm:max-w-sm">
          <Progress
            value={overallProgress}
            aria-label="Forge plan progress"
            className="h-1.5 flex-1"
          />
          <span className="whitespace-nowrap font-mono text-[10px] text-muted-foreground">
            {completedTowardPlan.toLocaleString()} /{" "}
            {totalRequired.toLocaleString()}
          </span>
        </div>

        <span className="ml-auto whitespace-nowrap font-mono text-[10px] text-muted-foreground">
          {activeForgeJobs.length} / {configuredSlots} slots
        </span>
        <ResetPlanDialog
          disabled={!hasPlanData}
          onReset={() => resetForgePlan(targetItemId)}
        />
      </div>

      <div className="p-2.5">
        {activeForgeJobs.length > configuredSlots && (
          <p className="mb-2 rounded-md border border-amber-500/25 bg-amber-500/10 px-2 py-1 text-[10px] text-amber-700 dark:text-amber-300">
            Active jobs exceed the configured slots. New jobs stay disabled
            until a slot is free.
          </p>
        )}
        <div className="grid grid-flow-col auto-cols-[minmax(9rem,1fr)] gap-2 overflow-x-auto pb-0.5">
          {Array.from({ length: renderedSlotCount }, (_, index) => (
            <ForgeSlot
              key={activeForgeJobs[index]?.id ?? `empty-${index}`}
              job={activeForgeJobs[index]}
              index={index}
              currentTargetItemId={targetItemId}
              nowMs={nowMs}
              onCollect={collectForgeJob}
              onCancel={cancelForgeJob}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

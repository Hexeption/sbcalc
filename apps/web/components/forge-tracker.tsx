"use client";

import { Button } from "@workspace/ui/components/button";
import { Checkbox } from "@workspace/ui/components/checkbox";
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
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Progress } from "@workspace/ui/components/progress";
import { Anvil, Check, Clock3, Play, RotateCcw, Trash2 } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
import { ItemImage } from "@/components/item-image";
import { MinecraftColoredText } from "@/components/minecraft-colored-text";
import { useCalculatorStore } from "@/lib/calculator-store";
import {
  applyQuickForgeReduction,
  formatForgeTime,
} from "@/lib/forge-time-utils";
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

interface TimeParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function splitDuration(totalSeconds: number): TimeParts {
  const normalized = Math.max(0, Math.floor(totalSeconds));
  return {
    days: Math.floor(normalized / 86400),
    hours: Math.floor((normalized % 86400) / 3600),
    minutes: Math.floor((normalized % 3600) / 60),
    seconds: normalized % 60,
  };
}

function combineDuration(parts: TimeParts): number {
  return (
    Math.max(0, parts.days) * 86400 +
    Math.max(0, parts.hours) * 3600 +
    Math.max(0, parts.minutes) * 60 +
    Math.max(0, parts.seconds)
  );
}

function stripMinecraftFormatting(value: string): string {
  return value.replace(/(?:Â)?§./g, "");
}

function ForgeStartDialog({
  durationSeconds,
  disabled,
  onStart,
}: {
  durationSeconds: number;
  disabled: boolean;
  onStart: (remainingSeconds: number) => boolean;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [alreadyRunning, setAlreadyRunning] = useState(false);
  const [timeParts, setTimeParts] = useState<TimeParts>(() =>
    splitDuration(durationSeconds),
  );

  useEffect(() => {
    if (!open) return;
    setAlreadyRunning(false);
    setTimeParts(splitDuration(durationSeconds));
  }, [open, durationSeconds]);

  const enteredRemainingSeconds = combineDuration(timeParts);
  const remainingSeconds = alreadyRunning
    ? enteredRemainingSeconds
    : durationSeconds;
  const invalidRemaining =
    alreadyRunning && enteredRemainingSeconds > durationSeconds;

  const updatePart = (part: keyof TimeParts, rawValue: string) => {
    const parsed = Number(rawValue);
    const maximum = part === "days" ? Number.MAX_SAFE_INTEGER : 59;
    setTimeParts((current) => ({
      ...current,
      [part]: Number.isFinite(parsed)
        ? Math.min(maximum, Math.max(0, Math.floor(parsed)))
        : 0,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8 text-xs" disabled={disabled}>
          <Play className="mr-1.5 h-3.5 w-3.5" />
          Start
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start forge job</DialogTitle>
          <DialogDescription>
            The calculated duration is {formatForgeTime(durationSeconds)}. One
            global forge slot will be occupied.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-start gap-2.5 rounded-lg border border-border/50 p-3">
            <Checkbox
              id={`${id}-already-running`}
              checked={alreadyRunning}
              onCheckedChange={(checked) => setAlreadyRunning(checked === true)}
              className="mt-0.5"
            />
            <div className="space-y-1">
              <Label
                htmlFor={`${id}-already-running`}
                className="cursor-pointer text-sm"
              >
                This job is already running in-game
              </Label>
              <p className="text-xs text-muted-foreground">
                Enter its remaining time to restore the correct progress.
              </p>
            </div>
          </div>

          {alreadyRunning && (
            <div className="space-y-2">
              <Label>Remaining time</Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(
                  [
                    ["days", "Days"],
                    ["hours", "Hours"],
                    ["minutes", "Minutes"],
                    ["seconds", "Seconds"],
                  ] as const
                ).map(([part, label]) => (
                  <div key={part} className="space-y-1">
                    <Label
                      htmlFor={`${id}-${part}`}
                      className="text-[11px] text-muted-foreground"
                    >
                      {label}
                    </Label>
                    <Input
                      id={`${id}-${part}`}
                      type="number"
                      min={0}
                      max={part === "days" ? undefined : 59}
                      value={timeParts[part]}
                      onChange={(event) => updatePart(part, event.target.value)}
                    />
                  </div>
                ))}
              </div>
              {invalidRemaining && (
                <p className="text-xs text-destructive">
                  Remaining time cannot exceed the calculated forge duration.
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            disabled={invalidRemaining}
            onClick={() => {
              if (onStart(remainingSeconds)) setOpen(false);
            }}
          >
            <Play className="mr-1.5 h-4 w-4" />
            Start job
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
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
      <div className="flex min-h-28 flex-col items-center justify-center rounded-lg border border-dashed border-border/60 bg-muted/10 p-3 text-center">
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Slot {index + 1}
        </span>
        <span className="mt-2 text-xs text-muted-foreground/70">Available</span>
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
      className={`min-h-28 rounded-lg border p-3 ${
        ready
          ? "border-emerald-500/40 bg-emerald-500/5"
          : "border-border/60 bg-muted/15"
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Slot {index + 1}
        </span>
        {!belongsToCurrentPlan && (
          <span
            className="ml-auto max-w-28 truncate rounded bg-blue-500/10 px-1.5 py-0.5 text-[9px] text-blue-600 dark:text-blue-400"
            title={`For ${targetName}`}
          >
            Other plan
          </span>
        )}
      </div>

      <div className="mt-2 flex items-center gap-2">
        <ItemImage
          entry={entry}
          internalname={job.itemId}
          alt={plainDisplayName}
          width={24}
          height={24}
        />
        <MinecraftColoredText
          text={displayName}
          className="min-w-0 flex-1 truncate text-xs font-medium"
          title={plainDisplayName}
        />
      </div>

      <div className="mt-2 flex items-center justify-between gap-2 font-mono text-xs">
        <span className={ready ? "text-emerald-600 dark:text-emerald-400" : ""}>
          {ready ? "Ready" : formatForgeTime(remainingSeconds)}
        </span>
        <span className="text-[10px] text-muted-foreground">
          {Math.round(progress)}%
        </span>
      </div>
      <Progress
        value={progress}
        aria-label={`${plainDisplayName} forge progress`}
        className="mt-1.5 h-1.5"
      />

      <div className="mt-2 flex justify-end gap-1.5">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-[10px] text-muted-foreground hover:text-destructive"
          onClick={() => onCancel(job.id)}
        >
          <Trash2 className="mr-1 h-3 w-3" />
          Cancel
        </Button>
        {ready && (
          <Button
            size="sm"
            className="h-7 px-2 text-[10px]"
            onClick={() => onCollect(job.id)}
          >
            <Check className="mr-1 h-3 w-3" />
            Collect
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
          size="sm"
          disabled={disabled}
          className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
        >
          <RotateCcw className="mr-1 h-3.5 w-3.5" />
          Reset plan
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
  const { recipes, itemsData } = useRecipeData();
  const forgeTrackerPlans = useCalculatorStore((s) => s.forgeTrackerPlans);
  const activeForgeJobs = useCalculatorStore((s) => s.activeForgeJobs);
  const setForgeCompleted = useCalculatorStore((s) => s.setForgeCompleted);
  const startForgeJob = useCalculatorStore((s) => s.startForgeJob);
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
  const slotsFull = activeForgeJobs.length >= configuredSlots;
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
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 px-5 py-3">
        <div className="flex items-center gap-2">
          <Anvil className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <h3 className="text-sm font-semibold">Forge Tracker</h3>
        </div>
        <ResetPlanDialog
          disabled={!hasPlanData}
          onReset={() => resetForgePlan(targetItemId)}
        />
      </div>

      <div className="space-y-5 p-4 sm:p-5">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="font-medium">Plan progress</span>
            <span className="font-mono text-muted-foreground">
              {completedTowardPlan.toLocaleString()} /{" "}
              {totalRequired.toLocaleString()} operations
            </span>
          </div>
          <Progress value={overallProgress} aria-label="Forge plan progress" />
        </div>

        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Clock3 className="h-3.5 w-3.5 text-primary" />
              <h4 className="text-xs font-semibold uppercase tracking-wider">
                Active forge slots
              </h4>
            </div>
            <span className="font-mono text-xs text-muted-foreground">
              {activeForgeJobs.length} / {configuredSlots} occupied
            </span>
          </div>
          {activeForgeJobs.length > configuredSlots && (
            <p className="rounded-md border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
              More jobs are active than the configured slot count. They keep
              running, but no new job can start until capacity is available.
            </p>
          )}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
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

        <div className="space-y-2.5">
          <h4 className="text-xs font-semibold uppercase tracking-wider">
            Required forge items
          </h4>
          <div className="space-y-2">
            {requirements.map((requirement) => {
              const entry =
                recipes[requirement.itemId] || itemsData[requirement.itemId];
              const displayName = getDisplayName(
                entry,
                requirement.itemId,
                itemsData,
              );
              const plainDisplayName = stripMinecraftFormatting(displayName);
              const completed = completedByItem[requirement.itemId] ?? 0;
              const activeCount = activeForgeJobs.filter(
                (job) =>
                  job.planTargetItemId === targetItemId &&
                  job.itemId === requirement.itemId,
              ).length;
              const accountedFor = completed + activeCount;
              const itemProgress =
                requirement.requiredQuantity > 0
                  ? (Math.min(completed, requirement.requiredQuantity) /
                      requirement.requiredQuantity) *
                    100
                  : 0;
              const surplus = Math.max(
                0,
                completed - requirement.requiredQuantity,
              );
              const effectiveDuration = applyQuickForgeReduction(
                requirement.forgeTimeSeconds,
                forgeSettings.quickForgeLevel ?? 0,
              );

              return (
                <div
                  key={requirement.itemId}
                  className="rounded-lg border border-border/50 bg-muted/10 p-3"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="flex min-w-0 flex-1 items-center gap-2.5">
                      <ItemImage
                        entry={entry}
                        internalname={requirement.itemId}
                        alt={plainDisplayName}
                        width={28}
                        height={28}
                      />
                      <div className="min-w-0 flex-1">
                        <MinecraftColoredText
                          text={displayName}
                          className="block truncate text-sm font-medium"
                          title={plainDisplayName}
                        />
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[10px] text-muted-foreground">
                          <span>{formatForgeTime(effectiveDuration)} each</span>
                          {activeCount > 0 && (
                            <span className="text-blue-600 dark:text-blue-400">
                              {activeCount} active
                            </span>
                          )}
                          {surplus > 0 && (
                            <span className="text-amber-600 dark:text-amber-400">
                              +{surplus} extra
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-end gap-2 sm:items-center">
                      <div className="space-y-1">
                        <Label
                          htmlFor={`forge-completed-${targetItemId}-${requirement.itemId}`}
                          className="text-[10px] text-muted-foreground"
                        >
                          Completed
                        </Label>
                        <Input
                          id={`forge-completed-${targetItemId}-${requirement.itemId}`}
                          type="number"
                          min={0}
                          value={completed}
                          onChange={(event) =>
                            setForgeCompleted(
                              targetItemId,
                              requirement.itemId,
                              Number(event.target.value),
                            )
                          }
                          className="h-8 w-24 font-mono text-xs"
                        />
                      </div>
                      <span className="mb-2 font-mono text-xs text-muted-foreground">
                        / {requirement.requiredQuantity.toLocaleString()}
                      </span>
                      <ForgeStartDialog
                        durationSeconds={effectiveDuration}
                        disabled={
                          slotsFull ||
                          accountedFor >= requirement.requiredQuantity
                        }
                        onStart={(remainingSeconds) =>
                          startForgeJob(
                            targetItemId,
                            requirement.itemId,
                            effectiveDuration,
                            remainingSeconds,
                            requirement.requiredQuantity,
                          )
                        }
                      />
                    </div>
                  </div>
                  <Progress
                    value={itemProgress}
                    aria-label={`${plainDisplayName} completed quantity`}
                    className="mt-3 h-1.5"
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

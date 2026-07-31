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
import { Play } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { formatForgeTime } from "@/lib/forge-time-utils";

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

export function ForgeStartDialog({
  itemName,
  durationSeconds,
  disabled,
  onStart,
}: {
  itemName: string;
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
        <Button
          size="icon"
          className="h-7 w-7 shrink-0"
          disabled={disabled}
          aria-label={`Start forging ${itemName}`}
          title={
            disabled
              ? "No forge slot available or amount complete"
              : `Forge ${itemName}`
          }
        >
          <Play className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start forge job</DialogTitle>
          <DialogDescription>
            Forge {itemName} in {formatForgeTime(durationSeconds)}. One global
            forge slot will be occupied.
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

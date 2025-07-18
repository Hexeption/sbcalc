"use client";

import React from "react";
import { useSettings } from "@/lib/settings-context";
import { calculateQuickForgeReduction } from "@/lib/forge-time-utils";
import { parseAndClampNumber } from "@/lib/input-utils";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { trackForgeSettingChange } from "@/lib/analytics";

export function ForgeSettings() {
  const { settings, updateSettings } = useSettings();

  const quickForgeReduction = calculateQuickForgeReduction(
    settings.quickForgeLevel,
  );

  const handleForgeSlotChange = (value: string) => {
    const newValue = parseAndClampNumber(value, 1, 20);
    updateSettings({ forgeSlots: newValue });

    // Track forge slot change
    trackForgeSettingChange("forge_slots", newValue);
  };

  const handleQuickForgeLevelChange = (value: string) => {
    const newValue = parseAndClampNumber(value, 0, 20);
    updateSettings({ quickForgeLevel: newValue });

    // Track quick forge level change
    trackForgeSettingChange("quick_forge_level", newValue);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label
          htmlFor="forge-slots"
          className="text-muted-foreground mb-2 block"
        >
          Number of Forge Slots
        </Label>
        <Input
          id="forge-slots"
          type="number"
          min={2}
          max={7}
          value={settings.forgeSlots}
          onChange={(e) => handleForgeSlotChange(e.target.value)}
        />
        <p className="text-xs text-muted-foreground mt-1">
          How many forge slots you have available (2-7)
        </p>
      </div>

      <div>
        <Label
          htmlFor="quick-forge-level"
          className="text-muted-foreground mb-2 block"
        >
          Quick Forge Level
        </Label>
        <Input
          id="quick-forge-level"
          type="number"
          min={0}
          max={20}
          value={settings.quickForgeLevel}
          onChange={(e) => handleQuickForgeLevelChange(e.target.value)}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Level 0-20, reduces forge time by {quickForgeReduction}%
        </p>
      </div>

      <div className="flex items-start space-x-3">
        <Checkbox
          id="use-multiple-slots"
          checked={settings.useMultipleSlots}
          onCheckedChange={(checked) => {
            const newValue = checked === true;
            updateSettings({ useMultipleSlots: newValue });

            // Track multiple slots setting change
            trackForgeSettingChange("use_multiple_slots", newValue);
          }}
        />
        <div className="grid gap-1.5 leading-none">
          <Label
            htmlFor="use-multiple-slots"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
          >
            Use Multiple Slots for Parallel Forging
          </Label>
          <p className="text-xs text-muted-foreground">
            When enabled, multiple items of the same recipe can be forged
            simultaneously to reduce total time
          </p>
        </div>
      </div>
    </div>
  );
}

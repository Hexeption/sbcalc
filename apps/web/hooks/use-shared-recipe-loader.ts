"use client";

import { useEffect, useState } from "react";
import type { ShareableRecipeState } from "@/lib/share-utils";
import type { Settings } from "@/lib/types";

/**
 * Loads a shared recipe from URL state into the recipe state hooks. The app is
 * single-item, so the first shared item becomes the selection.
 */
export function useSharedRecipeLoader(
  sharedState: ShareableRecipeState | null,
  actions: {
    setSelectedItem: (item: string) => void;
    setMultiplier: (n: number) => void;
    updateSettings: (settings: Partial<Settings>) => void;
  },
) {
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    if (sharedState && !hasLoaded) {
      const firstEntry = Object.entries(sharedState.recipes)[0];
      if (firstEntry) {
        const [itemName, quantity] = firstEntry;
        actions.setSelectedItem(itemName);
        actions.setMultiplier(quantity);
      }
      actions.updateSettings(sharedState.forgeSettings);
      setHasLoaded(true);
    }
  }, [sharedState, hasLoaded, actions]);
}

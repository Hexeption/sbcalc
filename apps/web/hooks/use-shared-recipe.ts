"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  getSharedRecipeState,
  type ShareableRecipeState,
} from "@/lib/share-utils";

export function useSharedRecipe() {
  const [sharedState, setSharedState] = useState<ShareableRecipeState | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [hasProcessedUrl, setHasProcessedUrl] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (hasProcessedUrl) return;

    const loadSharedRecipe = () => {
      try {
        const shared = getSharedRecipeState();
        if (shared) {
          setSharedState(shared);
          toast.success("Shared recipe loaded successfully!");
        }
      } catch (error) {
        console.error("Failed to load shared recipe:", error);
        toast.error("Failed to load shared recipe. Invalid share link.");
      } finally {
        setIsLoading(false);
        setHasProcessedUrl(true);
      }
    };

    loadSharedRecipe();
  }, [hasProcessedUrl]);

  const clearSharedState = () => {
    setSharedState(null);
    // Remove the shared parameter from URL
    const url = new URL(window.location.href);
    url.searchParams.delete("shared");
    router.replace(url.pathname + (url.search ? url.search : ""));
  };

  return {
    sharedState,
    isLoading,
    clearSharedState,
    hasSharedRecipe: sharedState !== null,
  };
}

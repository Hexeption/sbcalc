"use client";

import { useState } from "react";
import { Share2, Copy, Check } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { toast } from "sonner";
import {
  generateShareableUrl,
  createRecipeDescription,
  type ShareableRecipeState,
} from "@/lib/share-utils";

interface ShareRecipeDialogProps {
  recipeState: ShareableRecipeState;
  disabled?: boolean;
}

export function ShareRecipeDialog({
  recipeState,
  disabled = false,
}: ShareRecipeDialogProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = generateShareableUrl(recipeState);
  const description = createRecipeDescription(recipeState);
  const hasRecipes = Object.keys(recipeState.recipes).length > 0;

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Share link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      toast.error("Failed to copy link. Please copy manually.");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "SkyBlock Calculator Recipe",
          text: `Check out this recipe: ${description}`,
          url: shareUrl,
        });
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("Failed to share:", error);
          // Fallback to copy
          handleCopyUrl();
        }
      }
    } else {
      // Fallback to copy
      handleCopyUrl();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || !hasRecipes}
          className="gap-2"
        >
          <Share2 className="h-4 w-4" />
          Share Recipe
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Recipe</DialogTitle>
          <DialogDescription>
            Share this recipe configuration with others. The link includes all
            recipe quantities and forge settings.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Recipe Description</Label>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>

          <div>
            <Label className="text-sm font-medium">Forge Settings</Label>
            <div className="text-sm text-muted-foreground mt-1 space-y-1">
              <div>Slots: {recipeState.forgeSettings.forgeSlots}</div>
              <div>
                Multiple Slots:{" "}
                {recipeState.forgeSettings.useMultipleSlots ? "Yes" : "No"}
              </div>
              <div>
                Quick Forge Level: {recipeState.forgeSettings.quickForgeLevel}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="share-url" className="text-sm font-medium">
              Share Link
            </Label>
            <div className="flex gap-2">
              <Input
                id="share-url"
                value={shareUrl}
                readOnly
                className="flex-1"
                onClick={(e) => e.currentTarget.select()}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyUrl}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
            <Button onClick={handleShare} className="gap-2">
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

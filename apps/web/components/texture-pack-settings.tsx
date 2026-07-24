"use client";

import { Label } from "@workspace/ui/components/label";
import { ExternalLink } from "lucide-react";
import { useTexturePackStore } from "@/lib/texture-pack-store";

const packLinks: Record<string, string> = {
  hypixel: "https://github.com/meowdding/hypixel-pack/tree/26.2",
  fursky: "https://modrinth.com/resourcepack/furfsky-reborn",
  packshq: "https://modrinth.com/resourcepack/packshq",
};

export function TexturePackSettings({ inline }: { inline?: boolean }) {
  const packs = useTexturePackStore((s) => s.packs);
  const selectPack = useTexturePackStore((s) => s.selectPack);

  if (packs.length === 0) return null;

  const anyEnabled = packs.some((p) => p.enabled);

  return (
    <div className={inline ? "flex items-center gap-4" : "space-y-3"}>
      <div className="flex items-center space-x-2">
        <input
          type="radio"
          name="texture-pack"
          id="pack-none"
          checked={!anyEnabled}
          onChange={() => selectPack(null)}
          className="accent-primary"
        />
        <Label htmlFor="pack-none" className="cursor-pointer text-sm">
          None
        </Label>
      </div>
      {packs.map((pack) => (
        <div key={pack.id} className="flex items-center space-x-2">
          <input
            type="radio"
            name="texture-pack"
            id={`pack-${pack.id}`}
            checked={pack.enabled}
            onChange={() => selectPack(pack.id)}
            disabled={pack.loading}
            className="accent-primary"
          />
          <div className="flex items-center gap-0.5 leading-none">
            <Label
              htmlFor={`pack-${pack.id}`}
              className="cursor-pointer text-sm"
            >
              {pack.name}
              {packLinks[pack.id] && (
                <a
                  href={packLinks[pack.id]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex ml-1.5 text-muted-foreground hover:text-foreground align-middle"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="size-3" />
                </a>
              )}
              {pack.loading && (
                <span className="text-muted-foreground ml-2 text-xs">
                  Loading...
                </span>
              )}
            </Label>
            {pack.error && (
              <p className="text-xs text-destructive">{pack.error}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

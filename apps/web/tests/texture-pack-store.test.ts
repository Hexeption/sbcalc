import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useTexturePackStore } from "@/lib/texture-pack-store";

const PACK_PATH = resolve(import.meta.dirname, "../public/hypixel.cats");

describe("official Hypixel texture pack", () => {
  beforeEach(() => {
    useTexturePackStore.setState({ packs: [], initialized: false });
    vi.mocked(localStorage.getItem).mockReturnValue(null);

    const pack = readFileSync(PACK_PATH);
    const body = pack.buffer.slice(
      pack.byteOffset,
      pack.byteOffset + pack.byteLength,
    ) as ArrayBuffer;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(body, { status: 200 })),
    );
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:test-texture");
  });

  it("loads as the default and resolves official item textures", async () => {
    await useTexturePackStore.getState().init();

    const { packs, getTexture } = useTexturePackStore.getState();
    expect(packs.find((pack) => pack.enabled)?.id).toBe("hypixel");
    expect(packs[0]?.textures.size).toBeGreaterThan(900);
    expect(getTexture("TERMINATOR")).toEqual({
      url: "blob:test-texture",
      frameCount: 1,
      frametime: 0,
    });
    expect(getTexture("AMBER_POLISHED_DRILL_ENGINE")).not.toBeNull();
    expect(getTexture("DIVANS_DRILL")).not.toBeNull();
    expect(
      getTexture(
        "hypixel_skyblock:item/slayer/blaze/tokens/amalgamated_crimsonite",
      ),
    ).not.toBeNull();
  });
});

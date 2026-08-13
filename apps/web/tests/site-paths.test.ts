import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getHeadTextureUrl,
  getSiteBasePath,
  withBasePath,
} from "@/lib/site-paths";

describe("site paths", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("keeps root paths unchanged for the regular deployment", () => {
    vi.stubEnv("NEXT_PUBLIC_BASE_PATH", "");

    expect(getSiteBasePath()).toBe("");
    expect(withBasePath("/vanilla/stone.png")).toBe("/vanilla/stone.png");
  });

  it("prefixes public assets for GitHub Pages", () => {
    vi.stubEnv("NEXT_PUBLIC_BASE_PATH", "/sbcalc/");

    expect(getSiteBasePath()).toBe("/sbcalc");
    expect(withBasePath("/hypixel.cats")).toBe("/sbcalc/hypixel.cats");
    expect(withBasePath("/")).toBe("/sbcalc/");
  });

  it("uses the static MCHeads endpoint for texture IDs", () => {
    expect(getHeadTextureUrl("abc123")).toBe(
      "https://mc-heads.net/head/abc123",
    );
  });
});

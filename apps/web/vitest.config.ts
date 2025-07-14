/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "tests/",
        "**/*.d.ts",
        "**/*.config.*",
        "data/",
        "next-env.d.ts",
        ".next/",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      "@workspace/ui": path.resolve(__dirname, "../../packages/ui"),
      "@workspace/snbt-parser": path.resolve(
        __dirname,
        "../../packages/snbt-parser",
      ),
    },
  },
});

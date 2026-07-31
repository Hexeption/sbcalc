/// <reference types="vitest" />

import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "react",
  },
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
      "@": resolve(import.meta.dirname, "."),
      "@workspace/ui": resolve(import.meta.dirname, "../../packages/ui/src"),
      "@workspace/snbt-parser": resolve(
        import.meta.dirname,
        "../../packages/snbt-parser",
      ),
    },
  },
});

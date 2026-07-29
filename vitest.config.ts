import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      // Next's build-time server guard has no runtime module for Vitest to load.
      "server-only": path.resolve(__dirname, "src/test/serverOnlyStub.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // Integration tests share one SQLite file, so they must not run in parallel.
    fileParallelism: false,
    globalSetup: ["./src/test/globalSetup.ts"],
  },
});

import { defineConfig } from "vitest/config";

export default defineConfig({
  server: {
    port: 4000,
  },

  test: {
    globals: true,
    environment: "node",
    fileParallelism: false,
    testTimeout: 120_000,
    hookTimeout: 120_000,
    setupFiles: ["./tests/setup-env.ts"],
  },
});

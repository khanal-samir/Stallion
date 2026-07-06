import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      provider: "v8",
      include: [
        "src/config/**/*.ts",
        "src/constants/**/*.ts",
        "src/controllers/health.controller.ts",
        "src/lib/{api-response,app-error,cors,date,email,get-token-from-url,http-handlers,workspace}.ts",
        "src/middlewares/**/*.ts",
        "src/routes/**/*.ts",
        "src/server.ts",
      ],
      exclude: ["test/**"],
      reporter: ["text", "json-summary", "html", "lcov"],
      reportsDirectory: "coverage",
      thresholds: {
        branches: 100,
        functions: 100,
        lines: 100,
        statements: 100,
      },
    },
  },
});

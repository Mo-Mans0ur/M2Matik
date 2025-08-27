import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.{ts,tsx}", "src/**/__tests__/**/*.{ts,tsx}"],
    exclude: ["tests-e2e/**", "node_modules/**", "dist/**"],
  },
});

import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests-e2e",
  timeout: 60_000,
  expect: { timeout: 5000 },
  retries: 0,
  use: {
    baseURL: "http://localhost:4173",
    trace: "retain-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run preview:test",
    url: "http://localhost:4173",
    reuseExistingServer: !process.env.CI,
    stdout: "ignore",
    stderr: "pipe",
  },
});

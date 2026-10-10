import { defineConfig, devices } from "@playwright/test";

// Browser tests for the Operations console.
//   npm run test:e2e         — recorded-fixture suite (no backend needed)
//   E2E_LIVE=1 … npm run test:e2e — also runs tests/e2e/live.spec.ts against a real API
// PW_CHROMIUM_PATH points at a preinstalled Chromium when downloads are unavailable.
const PORT = 5175;
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 45_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: "retain-on-failure",
    launchOptions: process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npx vite --host 127.0.0.1 --port ${PORT} --strictPort`,
    url: `http://127.0.0.1:${PORT}/console`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});

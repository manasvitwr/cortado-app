import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:22694";
const storageState = process.env.E2E_STORAGE_STATE;

export default defineConfig({
  testDir: "./artifacts/tutord/e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["line"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    storageState,
    trace: "retain-on-failure",
    launchOptions: {
      executablePath:
        process.env.PLAYWRIGHT_CHROMIUM_PATH ?? "/repl/tools/bin/chromium",
    },
    ...devices["Desktop Chrome"],
  },
});

import { defineConfig, devices } from "@playwright/test";

const port = 3100;

// End-to-end tests drive a real browser against the production build
// (`next build` + `next start`), which is what visitors get. Run them with
// `pnpm test:e2e`. Locally an already running server on this port is reused,
// so repeated runs skip the build.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: /\.mobile\.spec\.ts$/,
    },
    {
      // Only the specs that are about the small-screen layout
      name: "mobile",
      use: { ...devices["Pixel 5"] },
      testMatch: /\.mobile\.spec\.ts$/,
    },
  ],
  webServer: {
    command: `pnpm exec next build && pnpm exec next start --port ${port}`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    env: {
      // The real Gmail credentials live in .env.local. Variables set here win
      // over .env files, so even a form submitted by mistake cannot send a
      // real email: it just fails, and the form shows its "send failed" state.
      GMAIL_USER: "e2e@example.invalid",
      GMAIL_APP_PASSWORD: "not-a-real-password",
      MAIL_TO: "e2e@example.invalid",
      // Not a production deployment: robots.txt disallows everything
      VERCEL_ENV: "",
    },
  },
});

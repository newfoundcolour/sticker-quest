import { defineConfig, devices } from "@playwright/test";
import { BASE_URL, TEST_PORT, loadTestEnv } from "./tests/e2e/env";

/**
 * End-to-end tests. They run the app on port 3100 against a SEPARATE test
 * Supabase project (.env.test) — never the live one; loadTestEnv() refuses
 * if .env.test matches .env. One-off setup: `npm run test:e2e:db`.
 */
const env = loadTestEnv();

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  // Tests share one database, and each creates its own users — keep it simple and serial.
  workers: 1,
  fullyParallel: false,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npx next dev -p ${TEST_PORT}`,
    url: `${BASE_URL}/login`,
    reuseExistingServer: false,
    timeout: 180_000,
    // Process env beats .env, so the app talks to the test project only.
    env: {
      NEXT_DIST_DIR: ".next-test",
      NEXT_PUBLIC_SUPABASE_URL: env.TEST_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: env.TEST_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: env.TEST_SUPABASE_SERVICE_ROLE_KEY,
      DATABASE_URL: env.TEST_DATABASE_URL,
      NEXT_PUBLIC_SITE_URL: BASE_URL,
      CLOUDINARY_CLOUD_NAME: env.TEST_CLOUDINARY_CLOUD_NAME,
      CLOUDINARY_API_KEY: "e2e-not-used",
      CLOUDINARY_API_SECRET: "e2e-not-used",
    },
  },
});

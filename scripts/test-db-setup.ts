/**
 * One-off (and after every new migration): bring the TEST Supabase project's
 * database up to date and seed the pricing tables, so the e2e tests run
 * against the same schema as live. Uses .env.test; refuses to touch the live
 * database (same guard as the tests).
 *
 *   npm run test:e2e:db
 */
import { spawnSync } from "node:child_process";
import { loadTestEnv } from "../tests/e2e/env";

const env = loadTestEnv();
const url = new URL(env.TEST_DATABASE_URL);
// Supabase's pooler sometimes needs longer than Prisma's default to connect.
if (!url.searchParams.has("connect_timeout")) url.searchParams.set("connect_timeout", "60");
const childEnv = { ...process.env, DATABASE_URL: url.toString() };

for (const args of [["prisma", "migrate", "deploy"], ["prisma", "db", "seed"]]) {
  console.log(`\n> npx ${args.join(" ")}  (TEST database)`);
  const result = spawnSync("npx", args, { stdio: "inherit", env: childEnv, shell: process.platform === "win32" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
console.log("\nTest database is ready.");

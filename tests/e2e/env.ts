import fs from "node:fs";
import path from "node:path";
import { parse } from "dotenv";

/**
 * The e2e tests run against a SEPARATE Supabase project, configured in
 * .env.test (never committed). This module loads it and refuses to continue
 * if it looks like the live project from .env — the tests create and delete
 * users, orders, proofs and messages.
 */

const root = path.resolve(__dirname, "../..");

function readEnvFile(name: string): Record<string, string> {
  const file = path.join(root, name);
  return fs.existsSync(file) ? parse(fs.readFileSync(file)) : {};
}

const REQUIRED = [
  "TEST_SUPABASE_URL",
  "TEST_SUPABASE_ANON_KEY",
  "TEST_SUPABASE_SERVICE_ROLE_KEY",
  "TEST_DATABASE_URL",
] as const;

export type TestEnv = Record<(typeof REQUIRED)[number], string> & {
  TEST_CLOUDINARY_CLOUD_NAME: string;
  TEST_EMAIL_DOMAIN?: string;
};

export function loadTestEnv(): TestEnv {
  const test = { ...readEnvFile(".env.test"), ...pickTestVars(process.env) };
  const missing = REQUIRED.filter((k) => !test[k]);
  if (missing.length) {
    throw new Error(
      `Missing ${missing.join(", ")}. Create .env.test with your separate TEST Supabase project's values (see CLAUDE.md → Testing).`,
    );
  }

  // Guard: never point the tests at the live project.
  const live = readEnvFile(".env");
  const sameProject = live.NEXT_PUBLIC_SUPABASE_URL && sameHost(live.NEXT_PUBLIC_SUPABASE_URL, test.TEST_SUPABASE_URL);
  const sameDb = live.DATABASE_URL && sameDatabase(live.DATABASE_URL, test.TEST_DATABASE_URL);
  if (sameProject || sameDb) {
    throw new Error("Refusing to run: .env.test points at the same Supabase project or database as .env (live).");
  }

  return { ...(test as TestEnv), TEST_CLOUDINARY_CLOUD_NAME: test.TEST_CLOUDINARY_CLOUD_NAME || "sq-e2e-test" };
}

function pickTestVars(env: NodeJS.ProcessEnv): Record<string, string> {
  return Object.fromEntries(Object.entries(env).filter(([k, v]) => k.startsWith("TEST_") && v)) as Record<string, string>;
}

function sameHost(a: string, b: string): boolean {
  try {
    return new URL(a).host === new URL(b).host;
  } catch {
    return false;
  }
}

/** Same database if the user (Supabase pooler user = postgres.<project-ref>) and host match. */
function sameDatabase(a: string, b: string): boolean {
  try {
    const ua = new URL(a);
    const ub = new URL(b);
    return ua.username === ub.username && ua.hostname === ub.hostname && ua.pathname === ub.pathname;
  } catch {
    return false;
  }
}

export const TEST_PORT = 3100;
export const BASE_URL = `http://localhost:${TEST_PORT}`;

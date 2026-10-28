import "server-only";
import { createHash } from "crypto";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

/**
 * Limits for our own server actions and routes. Supabase rate-limits its
 * Auth API too, but our server calls it from one IP for every visitor, so
 * per-visitor limits have to live here.
 */
export const RATE_LIMITS = {
  loginPerIp: { limit: 30, windowSeconds: 15 * 60 },
  loginPerEmail: { limit: 10, windowSeconds: 15 * 60 },
  signupPerIp: { limit: 5, windowSeconds: 60 * 60 },
  emailPerIp: { limit: 6, windowSeconds: 60 * 60 },
  emailPerAddress: { limit: 3, windowSeconds: 60 * 60 },
  passwordChangePerUser: { limit: 10, windowSeconds: 60 * 60 },
  artworkUploadPerIp: { limit: 30, windowSeconds: 10 * 60 },
} as const;

type Rule = { limit: number; windowSeconds: number };

/** Hashes identifiers (emails, IPs) so the RateLimit table holds no raw PII. */
function hashKey(parts: string[]): string {
  return createHash("sha256").update(parts.join("|").toLowerCase()).digest("hex").slice(0, 40);
}

/**
 * Counts one hit against `name` + `identity` in the current fixed window and
 * returns whether it's still within the limit. Fails open (allows the
 * request) if the counter can't be written, so a database hiccup never locks
 * everyone out of logging in.
 */
export async function rateLimit(name: string, identity: string, rule: Rule): Promise<boolean> {
  const windowMs = rule.windowSeconds * 1000;
  const windowStart = new Date(Math.floor(Date.now() / windowMs) * windowMs);
  const key = `${name}:${hashKey([identity])}`;

  try {
    const rows = await prisma.$queryRaw<{ count: number }[]>`
      INSERT INTO "RateLimit" ("key", "windowStart", "count")
      VALUES (${key}, ${windowStart}, 1)
      ON CONFLICT ("key", "windowStart")
      DO UPDATE SET "count" = "RateLimit"."count" + 1
      RETURNING "count"`;

    // Occasionally sweep windows older than a day.
    if (Math.random() < 0.01) {
      void prisma.rateLimit
        .deleteMany({ where: { windowStart: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } } })
        .catch(() => {});
    }

    return (rows[0]?.count ?? 0) <= rule.limit;
  } catch (error) {
    console.error("Rate limit check failed:", error);
    return true;
  }
}

/** The visitor's IP as reported by Vercel's edge (first x-forwarded-for hop). */
export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

export const TOO_MANY_ATTEMPTS = "Too many attempts. Take a short break and try again in a few minutes.";

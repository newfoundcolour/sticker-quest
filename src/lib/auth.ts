import "server-only";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/generated/prisma/client";

/**
 * The signed-in Supabase user, verified with the Auth server via getUser()
 * (never trust a user id sent from the browser). Cached per request so the
 * layout, nav and page share one lookup.
 */
export const getSessionUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/**
 * Resolves the signed-in user to their app Profile row, which carries the
 * role. Returns null if there's no session or no matching Profile.
 * The role lives only in this server-side table, never in user_metadata.
 */
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const user = await getSessionUser();
  if (!user) return null;
  return prisma.profile.findUnique({ where: { id: user.id } });
});

export function isStaffRole(profile: Profile | null): boolean {
  return profile?.role === "ADMIN" || profile?.role === "STAFF";
}

/**
 * Gate for every admin page, server action and route handler. Layouts alone
 * don't protect server actions — they're public POST endpoints — so each one
 * must call this itself.
 */
export async function requireStaff(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/admin/login");
  // A signed-in customer gets a plain 404 — /admin doesn't exist for them.
  if (!isStaffRole(profile)) notFound();
  return profile;
}

export function isEmailVerified(user: User): boolean {
  return Boolean(user.email_confirmed_at);
}

/**
 * Gate for every /account page and customer server action. Returns the
 * verified session user — the only source of the user id for scoping
 * customer data. Never accept a user id from the browser.
 */
export async function requireVerifiedUser(nextPath = "/account"): Promise<User> {
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  if (!isEmailVerified(user)) redirect("/login?unverified=1");
  return user;
}

/**
 * Attaches past guest orders to this account by matching the order email to
 * the account's email — only once Supabase has verified that email, so
 * nobody can claim orders by signing up with someone else's address.
 */
export async function linkGuestOrders(user: User): Promise<number> {
  if (!user.email || !isEmailVerified(user)) return 0;

  // The auth.users trigger normally creates the Profile; cover accounts made before it existed.
  const profile = await prisma.profile.findUnique({ where: { id: user.id }, select: { id: true } });
  if (!profile) return 0;

  const { count } = await prisma.order.updateMany({
    where: { userId: null, email: { equals: user.email, mode: "insensitive" } },
    data: { userId: user.id },
  });
  return count;
}

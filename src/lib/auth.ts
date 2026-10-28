import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
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
  if (!profile || !isStaffRole(profile)) redirect("/admin/login");
  return profile;
}

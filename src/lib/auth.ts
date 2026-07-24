import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/generated/prisma/client";

/**
 * Resolves the signed-in Supabase user (if any) to their app Profile row,
 * which carries the role. Returns null if there's no session or no
 * matching Profile.
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  return prisma.profile.findUnique({ where: { id: user.id } });
}

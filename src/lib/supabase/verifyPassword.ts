import "server-only";
import { createClient } from "@supabase/supabase-js";
import { isRateLimited } from "@/lib/authForms";

export type PasswordCheck = "ok" | "wrong" | "rate_limited";

/**
 * Checks a user's password server-side by signing in on a throwaway client
 * that never touches the browser's session cookies, then immediately
 * revoking that throwaway session. Used before sensitive changes (e.g. a
 * new password) so a hijacked session alone isn't enough.
 */
export async function verifyPassword(email: string, password: string): Promise<PasswordCheck> {
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } },
  );

  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) return isRateLimited(error) ? "rate_limited" : "wrong";

  if (data.session) await client.auth.signOut({ scope: "local" });
  return "ok";
}

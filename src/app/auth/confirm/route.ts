import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { linkGuestOrders } from "@/lib/auth";
import { safeRedirectPath } from "@/lib/safeRedirect";

/**
 * Landing point for every Supabase auth email: signup confirmation, password
 * recovery and email change. Follows Supabase's SSR guidance — the email
 * templates link here with ?token_hash=…&type=…, which works even if the
 * link is opened on a different device. Links from the default templates
 * (?code=…, PKCE) are handled too, but only work in the browser that asked.
 */
const ALLOWED_TYPES: readonly EmailOtpType[] = ["email", "signup", "recovery", "email_change"];

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const tokenHash = params.get("token_hash");
  const type = params.get("type") as EmailOtpType | null;
  const code = params.get("code");
  // Only same-site paths — `next` comes straight from the URL.
  const next = safeRedirectPath(params.get("next"), "/account");

  const supabase = await createClient();
  let verified = false;

  if (tokenHash && type && ALLOWED_TYPES.includes(type)) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    verified = !error;
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    verified = !error;
  }

  if (!verified) redirect("/login?error=link");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) await linkGuestOrders(user);

  if (type === "recovery" || next.startsWith("/reset-password")) redirect("/reset-password");
  if (type === "email_change") {
    // With "Secure email change", both addresses must confirm; new_email stays set until they have.
    redirect(user?.new_email ? "/account/settings?email=half" : "/account/settings?email=updated");
  }
  redirect(next);
}

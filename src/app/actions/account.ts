"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { requireVerifiedUser } from "@/lib/auth";
import { verifyPassword } from "@/lib/supabase/verifyPassword";
import { RATE_LIMITS, TOO_MANY_ATTEMPTS, clientIp, rateLimit } from "@/lib/rateLimit";
import {
  confirmUrl,
  isRateLimited,
  keepValues,
  weakPasswordMessage,
  type AuthFormState,
} from "@/lib/authForms";
import { fieldErrors, formObject } from "@/lib/validation/auth";
import { changeEmailSchema, changePasswordSchema, profileSchema } from "@/lib/validation/account";

/**
 * /account/settings actions. Each one takes the user id from the verified
 * Supabase session (requireVerifiedUser) — never from the submitted form.
 */

export async function updateProfileAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const user = await requireVerifiedUser("/account/settings");

  const parsed = profileSchema.safeParse(formObject(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: fieldErrors(parsed.error), values: keepValues(formData) };
  }

  await prisma.profile.update({ where: { id: user.id }, data: parsed.data });

  // The account menu greets the customer by first name.
  revalidatePath("/", "layout");
  return { ok: true, message: "Saved. Looking good!" };
}

export async function changeEmailAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const user = await requireVerifiedUser("/account/settings");

  const parsed = changeEmailSchema.safeParse(formObject(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: fieldErrors(parsed.error), values: keepValues(formData) };
  }
  const { email } = parsed.data;

  if (email === user.email?.toLowerCase()) {
    return { ok: false, fieldErrors: { email: "That's already your email." }, values: keepValues(formData) };
  }

  const allowed =
    (await rateLimit("email-ip", await clientIp(), RATE_LIMITS.emailPerIp)) &&
    (await rateLimit("email-change", user.id, RATE_LIMITS.emailPerAddress));
  if (!allowed) return { ok: false, message: TOO_MANY_ATTEMPTS, values: keepValues(formData) };

  // Supabase emails a confirmation link (to both addresses with "Secure email
  // change" on). The current email keeps working until the change is confirmed.
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser(
    { email },
    { emailRedirectTo: confirmUrl("/account/settings") },
  );

  if (error) {
    if (isRateLimited(error)) {
      return { ok: false, message: "We're sending a lot of emails right now. Try again in a few minutes." };
    }
    // e.g. the address belongs to another account — answer the same as success
    // so this form can't be used to discover who has an account.
    console.warn("Email change error:", error.code ?? error.message);
  }

  revalidatePath("/account/settings");
  return {
    ok: true,
    email,
    message: `We've sent confirmation links to ${email} and your current address. Click both to switch. Until then, your current email keeps working.`,
  };
}

export async function changePasswordAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const user = await requireVerifiedUser("/account/settings");

  const parsed = changePasswordSchema.safeParse(formObject(formData));
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };
  const { currentPassword, password } = parsed.data;

  // Also caps guesses at the current password.
  if (!(await rateLimit("password-change", user.id, RATE_LIMITS.passwordChangePerUser))) {
    return { ok: false, message: TOO_MANY_ATTEMPTS };
  }

  const check = await verifyPassword(user.email ?? "", currentPassword);
  if (check === "rate_limited") return { ok: false, message: TOO_MANY_ATTEMPTS };
  if (check === "wrong") {
    return { ok: false, fieldErrors: { currentPassword: "That doesn't match your current password." } };
  }

  const supabase = await createClient();
  // current_password lets Supabase double-check too, if "Require current password" is switched on.
  const { error } = await supabase.auth.updateUser({ password, current_password: currentPassword });

  if (error) {
    if (error.code === "same_password") {
      return { ok: false, fieldErrors: { password: "Your new password needs to be different from your current one." } };
    }
    const weak = weakPasswordMessage(error);
    if (weak) return { ok: false, fieldErrors: { password: weak } };
    if (isRateLimited(error)) return { ok: false, message: TOO_MANY_ATTEMPTS };
    if (error.code === "reauthentication_needed") {
      return { ok: false, message: "For your security, please log out and back in, then try again." };
    }
    console.error("Password change failed:", error.code ?? error.message);
    return { ok: false, message: "We couldn't update your password just now. Please try again." };
  }

  // Sign out every other device; this one stays logged in.
  await supabase.auth.signOut({ scope: "others" });
  return { ok: true, message: "Password updated. We've signed you out on your other devices." };
}

"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  confirmUrl,
  isRateLimited,
  keepValues,
  weakPasswordMessage,
  type AuthFormState,
} from "@/lib/authForms";
import { prisma } from "@/lib/prisma";
import { isStaffRole, linkGuestOrders } from "@/lib/auth";
import { safeRedirectPath } from "@/lib/safeRedirect";
import { RATE_LIMITS, TOO_MANY_ATTEMPTS, clientIp, rateLimit } from "@/lib/rateLimit";
import {
  emailOnlySchema,
  fieldErrors,
  formObject,
  loginSchema,
  resetPasswordSchema,
  signupSchema,
} from "@/lib/validation/auth";

const GENERIC_LOGIN_ERROR = "Email or password is incorrect.";
const CHECK_EMAIL = "Check your email";

// ─── Customer login ────────────────────────────────────────────────────────

export async function loginAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse(formObject(formData));
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error), values: keepValues(formData) };
  const { email, password, next } = parsed.data;

  const ip = await clientIp();
  const allowed =
    (await rateLimit("login-ip", ip, RATE_LIMITS.loginPerIp)) &&
    (await rateLimit("login-email", email, RATE_LIMITS.loginPerEmail));
  if (!allowed) return { ok: false, message: TOO_MANY_ATTEMPTS, values: keepValues(formData) };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const values = keepValues(formData);
    if (isRateLimited(error)) return { ok: false, message: TOO_MANY_ATTEMPTS, values };
    // Only someone with the right password gets here, so saying "confirm your
    // email" doesn't reveal anything to a stranger.
    if (error.code === "email_not_confirmed") {
      await supabase.auth.resend({ type: "signup", email, options: { emailRedirectTo: confirmUrl("/account") } });
      return {
        ok: false,
        message: "Please confirm your email first. We've just sent you a fresh link.",
        values,
      };
    }
    return { ok: false, message: GENERIC_LOGIN_ERROR, values };
  }

  await linkGuestOrders(data.user);
  redirect(safeRedirectPath(next, "/account"));
}

// ─── Sign up ───────────────────────────────────────────────────────────────

export async function signupAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = signupSchema.safeParse(formObject(formData));
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error), values: keepValues(formData) };
  const { firstName, lastName, email, password } = parsed.data;

  if (!(await rateLimit("signup-ip", await clientIp(), RATE_LIMITS.signupPerIp))) {
    return { ok: false, message: TOO_MANY_ATTEMPTS, values: keepValues(formData) };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: confirmUrl("/account"),
      // Display data only — copied into Profile by the auth.users trigger.
      // The role is never taken from here.
      data: { first_name: firstName, last_name: lastName },
    },
  });

  if (error) {
    const values = keepValues(formData);
    if (isRateLimited(error)) {
      return { ok: false, message: "We're sending a lot of emails right now. Try again in a few minutes.", values };
    }
    const weak = weakPasswordMessage(error);
    if (weak) return { ok: false, fieldErrors: { password: weak }, values };
    // Anything else (including "already registered") gets the same answer as success.
    console.warn("Sign up error:", error.code ?? error.message);
  }

  return { ok: true, message: CHECK_EMAIL, email };
}

/** "Didn't get it?" on the check-your-email screen. Always answers the same way. */
export async function resendConfirmationAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = emailOnlySchema.safeParse(formObject(formData));
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error), values: keepValues(formData) };
  const { email } = parsed.data;

  const allowed =
    (await rateLimit("email-ip", await clientIp(), RATE_LIMITS.emailPerIp)) &&
    (await rateLimit("email-address", email, RATE_LIMITS.emailPerAddress));
  if (!allowed) return { ok: false, message: TOO_MANY_ATTEMPTS };

  const supabase = await createClient();
  await supabase.auth.resend({ type: "signup", email, options: { emailRedirectTo: confirmUrl("/account") } });
  return { ok: true, message: "If that email needs confirming, a new link is on its way.", email };
}

// ─── Forgot / reset password ───────────────────────────────────────────────

export async function forgotPasswordAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = emailOnlySchema.safeParse(formObject(formData));
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error), values: keepValues(formData) };
  const { email } = parsed.data;

  const allowed =
    (await rateLimit("email-ip", await clientIp(), RATE_LIMITS.emailPerIp)) &&
    (await rateLimit("email-address", email, RATE_LIMITS.emailPerAddress));
  if (!allowed) return { ok: false, message: TOO_MANY_ATTEMPTS };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: confirmUrl("/reset-password"),
  });
  if (error) console.warn("Password reset email error:", error.code ?? error.message);

  return {
    ok: true,
    message: "If there's an account for that email, a reset link is on its way. It expires in an hour.",
    email,
  };
}

/** Runs inside the recovery session that /auth/confirm set up from the email link. */
export async function resetPasswordAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = resetPasswordSchema.safeParse(formObject(formData));
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error), values: keepValues(formData) };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "This reset link has expired. Request a new one below." };
  }

  if (!(await rateLimit("password-change", user.id, RATE_LIMITS.passwordChangePerUser))) {
    return { ok: false, message: TOO_MANY_ATTEMPTS };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    if (error.code === "same_password") {
      return { ok: false, fieldErrors: { password: "Choose a password you haven't used here before." } };
    }
    const weak = weakPasswordMessage(error);
    if (weak) return { ok: false, fieldErrors: { password: weak } };
    if (isRateLimited(error)) return { ok: false, message: TOO_MANY_ATTEMPTS };
    console.error("Password reset failed:", error.code ?? error.message);
    return { ok: false, message: "We couldn't update your password. Request a new link and try again." };
  }

  // Anyone else holding an old session (e.g. whoever knew the old password) is signed out.
  await supabase.auth.signOut({ scope: "others" });

  const profile = await prisma.profile.findUnique({ where: { id: user.id } });
  redirect(isStaffRole(profile) ? "/admin" : "/account?password=updated");
}

// ─── Admin login + sign out ────────────────────────────────────────────────

export type SignInResult = { ok: false; error: string };

/**
 * Called from the /admin/login form. Redirects to /admin on success, so a
 * non-redirect return always means the sign-in failed. Only staff/admin get
 * through; customers get the same generic error as a wrong password.
 */
export async function signInAction(formData: FormData): Promise<SignInResult> {
  const parsed = loginSchema.safeParse(formObject(formData));
  if (!parsed.success) return { ok: false, error: "Enter your email and password." };
  const { email, password } = parsed.data;

  const ip = await clientIp();
  const allowed =
    (await rateLimit("login-ip", ip, RATE_LIMITS.loginPerIp)) &&
    (await rateLimit("login-email", email, RATE_LIMITS.loginPerEmail));
  if (!allowed) return { ok: false, error: TOO_MANY_ATTEMPTS };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: "Incorrect email or password." };

  const profile = await prisma.profile.findUnique({ where: { id: data.user.id } });
  if (!isStaffRole(profile)) {
    await supabase.auth.signOut({ scope: "local" });
    return { ok: false, error: "Incorrect email or password." };
  }

  redirect("/admin");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  redirect("/admin/login");
}

/** Customer sign-out from the nav menu and footer — back to the home page. */
export async function signOutCustomerAction() {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  redirect("/");
}

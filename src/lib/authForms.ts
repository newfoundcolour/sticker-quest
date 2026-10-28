import { isAuthWeakPasswordError, type AuthError } from "@supabase/supabase-js";
import { siteUrl } from "@/lib/siteUrl";
import { formObject } from "@/lib/validation/auth";

/**
 * Shared result shape for auth and account forms. Messages are deliberately
 * generic wherever a specific one would reveal whether an email is registered.
 */
export type AuthFormState =
  | { ok: true; message: string; email?: string }
  | {
      ok: false;
      message?: string;
      fieldErrors?: Record<string, string>;
      /** What was typed (never passwords), so the form can refill after React resets it. */
      values?: Record<string, string>;
    }
  | undefined;

export function keepValues(formData: FormData): Record<string, string> {
  const values = formObject(formData);
  for (const key of Object.keys(values)) {
    if (/password/i.test(key)) delete values[key];
  }
  return values;
}

/** Where Supabase's default (non-token-hash) email links land; /auth/confirm handles both. */
export function confirmUrl(next: string): string {
  return `${siteUrl()}/auth/confirm?next=${encodeURIComponent(next)}`;
}

export function isRateLimited(error: AuthError): boolean {
  return error.status === 429 || Boolean(error.code?.startsWith("over_"));
}

/** Supabase's own password checks (e.g. leaked-password protection on Pro) — safe to show. */
export function weakPasswordMessage(error: AuthError): string | undefined {
  if (!isAuthWeakPasswordError(error)) return undefined;
  if (error.reasons.includes("pwned")) {
    return "That password has shown up in a data breach. Please choose a different one.";
  }
  return "That password doesn't meet our requirements. Try a longer one.";
}

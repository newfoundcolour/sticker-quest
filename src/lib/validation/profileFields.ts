import { z } from "zod";

/**
 * Optional profile details, shared by sign up and account settings. Empty
 * means "not given" and is stored as null. The profile trigger on
 * auth.users re-checks the same rules for sign up (see the
 * profile_phone_and_signup_details migration) — keep the two in step.
 */

/** Instagram handles: letters, numbers, periods and underscores, up to 30. */
export const INSTAGRAM_HANDLE_PATTERN = /^[A-Za-z0-9._]{1,30}$/;

/** Digits, spaces, brackets and dashes, with an optional leading +. */
export const PHONE_PATTERN = /^\+?[0-9][0-9 ()-]{6,19}$/;

/** Accepts "@sticker.quest" or "sticker.quest"; stores without the @. Empty means none. */
export function normaliseInstagramHandle(raw: string): string {
  return raw.trim().replace(/^@+/, "");
}

export const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `Keep ${label} under ${max} characters.`)
    .transform((v) => (v === "" ? null : v));

export const companySchema = optionalText(100, "your business name");

export const phoneSchema = z
  .string()
  .trim()
  .refine((v) => v === "" || PHONE_PATTERN.test(v), {
    message: "Enter a phone number, like 082 123 4567.",
  })
  .transform((v) => (v === "" ? null : v));

export const instagramHandleSchema = z
  .string()
  .transform(normaliseInstagramHandle)
  .refine((v) => v === "" || INSTAGRAM_HANDLE_PATTERN.test(v), {
    message: "Use up to 30 letters, numbers, periods or underscores.",
  })
  .transform((v) => (v === "" ? null : v));

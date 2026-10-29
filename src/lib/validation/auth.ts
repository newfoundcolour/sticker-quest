import { z } from "zod";
import {
  PASSWORD_MAX_BYTES,
  PASSWORD_MIN_LENGTH,
  isTriviallyWeak,
  passwordByteLength,
} from "@/lib/passwordPolicy";
import { companySchema, instagramHandleSchema, phoneSchema } from "@/lib/validation/profileFields";

/** Server-side schemas for the auth forms. The forms validate too, but only these count. */

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, "That email is too long.")
  .pipe(z.email("Enter a valid email address."));

export const newPasswordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Use at least ${PASSWORD_MIN_LENGTH} characters.`)
  .refine((pw) => passwordByteLength(pw) <= PASSWORD_MAX_BYTES, {
    message: `Keep it under ${PASSWORD_MAX_BYTES} characters.`,
  })
  .refine((pw) => !isTriviallyWeak(pw), {
    message: "That password is too easy to guess. Try a few random words strung together.",
  });

export const nameSchema = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `Enter your ${label}.`)
    .max(50, `Keep your ${label} under 50 characters.`)
    // Letters (any language), spaces, apostrophes, hyphens and full stops.
    .regex(/^[\p{L}\p{M}' .-]+$/u, `Use letters only in your ${label}.`);

export const signupSchema = z
  .object({
    firstName: nameSchema("first name"),
    lastName: nameSchema("surname"),
    // Optional; a missing field (older form, scripted request) counts as empty.
    company: companySchema.prefault(""),
    phone: phoneSchema.prefault(""),
    instagramHandle: instagramHandleSchema.prefault(""),
    email: emailSchema,
    password: newPasswordSchema,
    confirmPassword: z.string(),
    terms: z.literal("on", { message: "Please accept the Terms and Privacy Policy." }),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords don't match.",
  });

export const loginSchema = z.object({
  email: emailSchema,
  // No length rule on login: older accounts may predate the 12-character minimum.
  password: z.string().min(1, "Enter your password.").max(1024),
  next: z.string().optional(),
});

export const emailOnlySchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z
  .object({ password: newPasswordSchema, confirmPassword: z.string() })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords don't match.",
  });

/** Flattens zod issues to one message per field, for the forms. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}

export function formObject(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") out[key] = value;
  }
  return out;
}

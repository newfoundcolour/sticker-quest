import { z } from "zod";
import { emailSchema, nameSchema, newPasswordSchema } from "@/lib/validation/auth";

/** Instagram handles: letters, numbers, periods and underscores, up to 30. */
export const INSTAGRAM_HANDLE_PATTERN = /^[A-Za-z0-9._]{1,30}$/;

/** Accepts "@sticker.quest" or "sticker.quest"; stores without the @. Empty means none. */
export function normaliseInstagramHandle(raw: string): string {
  return raw.trim().replace(/^@+/, "");
}

const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `Keep ${label} under ${max} characters.`)
    .transform((v) => (v === "" ? null : v));

export const profileSchema = z.object({
  firstName: nameSchema("first name"),
  lastName: nameSchema("last name"),
  company: optionalText(100, "your company name"),
  instagramHandle: z
    .string()
    .transform(normaliseInstagramHandle)
    .refine((v) => v === "" || INSTAGRAM_HANDLE_PATTERN.test(v), {
      message: "Use up to 30 letters, numbers, periods or underscores.",
    })
    .transform((v) => (v === "" ? null : v)),
});

export const changeEmailSchema = z.object({ email: emailSchema });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password.").max(1024),
    password: newPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords don't match.",
  })
  .refine((v) => v.password !== v.currentPassword, {
    path: ["password"],
    message: "Your new password needs to be different from your current one.",
  });

import { z } from "zod";
import { emailSchema, nameSchema, newPasswordSchema } from "@/lib/validation/auth";
import { companySchema, instagramHandleSchema, phoneSchema } from "@/lib/validation/profileFields";

export { INSTAGRAM_HANDLE_PATTERN, normaliseInstagramHandle } from "@/lib/validation/profileFields";

export const profileSchema = z.object({
  firstName: nameSchema("first name"),
  lastName: nameSchema("last name"),
  company: companySchema,
  phone: phoneSchema,
  instagramHandle: instagramHandleSchema,
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

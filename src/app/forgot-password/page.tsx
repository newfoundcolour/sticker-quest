import type { Metadata } from "next";
import { NightAuthPage } from "@/components/auth/AuthShell";
import { ForgotPasswordForm } from "@/components/auth/AuthForms";

export const metadata: Metadata = { title: "Forgot password · Sticker Quest" };

/** Shared by customers and staff (linked from /admin/login too). */
export default function ForgotPasswordPage() {
  return (
    <NightAuthPage narrow>
      <ForgotPasswordForm />
    </NightAuthPage>
  );
}

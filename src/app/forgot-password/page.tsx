import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell, AUTH_LINK_ON_NIGHT_CLASSES } from "@/components/auth/AuthShell";
import { ForgotPasswordForm } from "@/components/auth/AuthForms";

export const metadata: Metadata = { title: "Forgot password · Sticker Quest" };

/** Shared by customers and staff (linked from /admin/login too). */
export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Forgot your password?"
      intro="No stress. Pop in your email and we'll send you a link to choose a new one."
      footer={
        <>
          Remembered it?{" "}
          <Link href="/login" className={AUTH_LINK_ON_NIGHT_CLASSES}>
            Back to log in
          </Link>
        </>
      }
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}

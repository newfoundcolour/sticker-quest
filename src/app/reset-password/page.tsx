import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell, AUTH_LINK_CLASSES } from "@/components/auth/AuthShell";
import { ResetPasswordForm } from "@/components/auth/AuthForms";
import { FormMessage } from "@/components/auth/fields";
import { getSessionUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Choose a new password · Sticker Quest" };

/**
 * Reached from the reset email via /auth/confirm, which signs the user in
 * with a short-lived recovery session. Without that session there's nothing
 * to reset.
 */
export default async function ResetPasswordPage() {
  const user = await getSessionUser();

  return (
    <AuthShell
      title="Choose a new password"
      intro={user ? "Pick something long and memorable. A few random words works great." : undefined}
    >
      {user ? (
        <ResetPasswordForm />
      ) : (
        <div className="flex flex-col gap-4">
          <FormMessage tone="error">This reset link has expired or was already used.</FormMessage>
          <Link href="/forgot-password" className={AUTH_LINK_CLASSES}>
            Send me a new link →
          </Link>
        </div>
      )}
    </AuthShell>
  );
}

import type { Metadata } from "next";
import { NightAuthPage } from "@/components/auth/AuthShell";
import { ResetLinkExpired, ResetPasswordForm } from "@/components/auth/AuthForms";
import { getSessionUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Choose a new password · Sticker Quest" };

/**
 * Reached from the reset email via /auth/confirm, which signs the user in
 * with a short-lived recovery session. Without that session there's nothing
 * to reset.
 */
export default async function ResetPasswordPage() {
  const user = await getSessionUser();

  return <NightAuthPage narrow>{user ? <ResetPasswordForm /> : <ResetLinkExpired />}</NightAuthPage>;
}

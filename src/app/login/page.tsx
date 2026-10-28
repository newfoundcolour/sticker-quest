import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell, AUTH_LINK_ON_NIGHT_CLASSES } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/AuthForms";
import { getSessionUser, isEmailVerified } from "@/lib/auth";
import { safeRedirectPath } from "@/lib/safeRedirect";

export const metadata: Metadata = { title: "Log in · Sticker Quest" };

const MESSAGES: Record<string, string> = {
  link: "That link has expired or was already used. Log in below, or ask for a new one.",
  unverified: "Confirm your email to use your account. Check your inbox for the link.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string; unverified?: string }>;
}) {
  const { next, error, unverified } = await searchParams;
  const nextPath = next ? safeRedirectPath(next, "/account") : undefined;

  const user = await getSessionUser();
  if (user && isEmailVerified(user)) redirect(nextPath ?? "/account");

  const initialMessage = error === "link" ? MESSAGES.link : unverified ? MESSAGES.unverified : undefined;

  return (
    <AuthShell
      title="Log in"
      intro="Welcome back, adventurer. Log in to track orders, approve proofs and reorder in a click."
      footer={
        <>
          New here?{" "}
          <Link href="/signup" className={AUTH_LINK_ON_NIGHT_CLASSES}>
            Create an account
          </Link>
        </>
      }
    >
      <LoginForm next={nextPath} initialMessage={initialMessage} />
    </AuthShell>
  );
}

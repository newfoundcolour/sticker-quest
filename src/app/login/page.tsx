import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { NightAuthPage } from "@/components/auth/AuthShell";
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
    <NightAuthPage narrow>
      <LoginForm next={nextPath} initialMessage={initialMessage} />
    </NightAuthPage>
  );
}

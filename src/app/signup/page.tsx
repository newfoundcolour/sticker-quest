import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell, AUTH_LINK_ON_NIGHT_CLASSES } from "@/components/auth/AuthShell";
import { SignupForm } from "@/components/auth/AuthForms";
import { getSessionUser, isEmailVerified } from "@/lib/auth";

export const metadata: Metadata = { title: "Sign up · Sticker Quest" };

export default async function SignupPage() {
  const user = await getSessionUser();
  if (user && isEmailVerified(user)) redirect("/account");

  return (
    <AuthShell
      title="Create your account"
      intro="Save your orders in one place, approve proofs online and reorder your favourites in a click."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className={AUTH_LINK_ON_NIGHT_CLASSES}>
            Log in
          </Link>
        </>
      }
    >
      <SignupForm />
    </AuthShell>
  );
}

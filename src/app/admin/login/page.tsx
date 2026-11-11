import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile, isStaffRole } from "@/lib/auth";
import { LoginForm } from "@/components/admin/LoginForm";
import { CARD_CLASSES } from "@/components/admin/ui";

export default async function AdminLoginPage() {
  const profile = await getCurrentProfile();
  if (isStaffRole(profile)) {
    redirect("/admin");
  }

  return (
    <main className="flex min-h-dvh flex-1 items-center justify-center bg-admin-canvas px-4 py-16">
      <div className="w-full max-w-sm">
        <div className={`${CARD_CLASSES} overflow-hidden`}>
          <div className="flex items-center gap-2.5 bg-night px-6 py-5">
            <Image src="/brand/logo-sticker-quest.png" alt="Sticker Quest" width={68} height={40} className="h-9 w-auto" priority />
            <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white/70">
              Admin
            </span>
          </div>
          <div className="flex flex-col gap-5 px-6 py-6">
            <div className="flex flex-col gap-1">
              <h1 className="text-xl font-bold tracking-tight text-admin-ink">Staff login</h1>
              <p className="text-sm text-admin-muted">For the Sticker Quest team only.</p>
            </div>
            <LoginForm />
          </div>
        </div>
        {/* Same reset flow as customers; after resetting, staff land back on /admin. */}
        <Link href="/forgot-password" className="mt-4 block text-center text-sm text-admin-muted hover:text-admin-ink">
          Forgot your password?
        </Link>
      </div>
    </main>
  );
}

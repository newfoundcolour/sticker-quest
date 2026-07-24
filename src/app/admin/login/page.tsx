import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { LoginForm } from "@/components/admin/LoginForm";

export default async function AdminLoginPage() {
  const profile = await getCurrentProfile();
  if (profile && (profile.role === "ADMIN" || profile.role === "STAFF")) {
    redirect("/admin");
  }

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-16">
      <h1 className="mb-6 font-display text-2xl font-semibold text-ink-navy">
        Admin login
      </h1>
      <div className="rounded-2xl border border-ink-navy/10 bg-white/70 p-6">
        <LoginForm />
      </div>
    </main>
  );
}

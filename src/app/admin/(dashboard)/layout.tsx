import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { signOutAction } from "@/app/actions/auth";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();

  if (!profile || (profile.role !== "ADMIN" && profile.role !== "STAFF")) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between gap-6 border-b border-ink-navy/10 px-6 py-4">
        <div className="flex items-center gap-6">
          <Link href="/admin" className="font-display text-lg font-semibold text-ink-navy">
            Sticker Quest Admin
          </Link>
          <nav className="flex gap-4 text-sm font-medium text-ink-navy/70">
            <Link href="/admin/orders" className="hover:text-ink-navy">
              Orders
            </Link>
          </nav>
        </div>
        <form action={signOutAction}>
          <button
            type="submit"
            className="rounded-lg border border-ink-navy/15 px-3 py-1.5 text-sm font-medium text-ink-navy hover:bg-ink-navy/5"
          >
            Log out
          </button>
        </form>
      </header>
      {children}
    </div>
  );
}

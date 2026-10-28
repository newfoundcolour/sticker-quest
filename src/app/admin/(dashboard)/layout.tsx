import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { getSupportCountsForStaff } from "@/lib/support";
import { signOutAction } from "@/app/actions/auth";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireStaff();
  const support = await getSupportCountsForStaff();

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
            <Link href="/admin/support" className="flex items-center gap-1.5 hover:text-ink-navy">
              Support
              {support.unreadConversations > 0 && (
                <span className="rounded-full bg-coral-signal px-1.5 font-mono text-[11px] leading-[18px] text-paper">
                  {support.unreadConversations}
                  <span className="sr-only"> unread</span>
                </span>
              )}
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

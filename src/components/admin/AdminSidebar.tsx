"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAction } from "@/app/actions/auth";
import { AdminIcon, Avatar, type AdminIconName } from "@/components/admin/ui";

const SECTIONS: { href: string; label: string; icon: AdminIconName; badge?: "orders" | "support" | "blog" }[] = [
  { href: "/admin/orders", label: "Orders", icon: "package", badge: "orders" },
  { href: "/admin/discounts", label: "Discounts", icon: "tag" },
  { href: "/admin/blog", label: "Blog", icon: "pen", badge: "blog" },
  { href: "/admin/support", label: "Support", icon: "message", badge: "support" },
];

/**
 * The admin's night sidebar (desktop) / top bar (phones): logo, sections with
 * counts that need attention, a link to the shop and the signed-in staff member.
 */
export function AdminSidebar({
  staffName,
  staffEmail,
  needsProof,
  unreadSupport,
  blogToReview,
}: {
  staffName: string;
  staffEmail: string;
  /** Orders waiting for a proof upload. */
  needsProof: number;
  /** Conversations with an unread customer message. */
  unreadSupport: number;
  /** Posts waiting for an admin to review (0 for staff who can't publish). */
  blogToReview: number;
}) {
  const pathname = usePathname();
  const counts = { orders: needsProof, support: unreadSupport, blog: blogToReview };
  const badgeHint = { orders: "awaiting proof", support: "unread", blog: "to review" };

  return (
    <aside className="flex shrink-0 flex-col bg-night text-sand lg:sticky lg:top-0 lg:h-dvh lg:w-60">
      <div className="flex items-center justify-between gap-4 px-5 py-4 lg:py-6">
        <Link href="/admin/orders" className="flex items-center gap-2.5" aria-label="Sticker Quest admin home">
          <Image src="/brand/logo-sticker-quest.png" alt="" width={68} height={40} className="h-9 w-auto" priority />
          <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white/70">
            Admin
          </span>
        </Link>
        <form action={signOutAction} className="lg:hidden">
          <button type="submit" className="flex items-center gap-1.5 text-sm font-medium text-white/60 hover:text-white">
            <AdminIcon name="logout" className="size-4" />
            Log out
          </button>
        </form>
      </div>

      <nav aria-label="Admin" className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-1 lg:flex-col lg:pb-0">
        {SECTIONS.map((s) => {
          const active = pathname === s.href || pathname.startsWith(`${s.href}/`);
          const count = s.badge ? counts[s.badge] : 0;
          return (
            <Link
              key={s.href}
              href={s.href}
              aria-current={active ? "page" : undefined}
              className={[
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors",
                active ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white",
              ].join(" ")}
            >
              <AdminIcon name={s.icon} className={`size-[18px] ${active ? "text-zap" : ""}`} />
              <span className="flex-1">{s.label}</span>
              {count > 0 && s.badge && (
                <span className="rounded-full bg-zap px-1.5 text-[11px] font-bold leading-[18px] text-night tabular-nums">
                  {count}
                  <span className="sr-only"> {badgeHint[s.badge]}</span>
                </span>
              )}
            </Link>
          );
        })}
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium whitespace-nowrap text-white/60 transition-colors hover:bg-white/5 hover:text-white lg:mt-auto"
        >
          <AdminIcon name="store" className="size-[18px]" />
          <span className="flex-1">View shop</span>
          <AdminIcon name="external" className="size-3.5 opacity-60" />
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      </nav>

      <div className="hidden items-center gap-3 border-t border-white/10 px-5 py-4 lg:flex">
        <Avatar name={staffName || staffEmail} dark />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{staffName || "Staff"}</p>
          <p className="truncate text-xs text-white/50">{staffEmail}</p>
        </div>
        <form action={signOutAction}>
          <button
            type="submit"
            aria-label="Log out"
            title="Log out"
            className="flex size-8 items-center justify-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white"
          >
            <AdminIcon name="logout" className="size-4" />
          </button>
        </form>
      </div>
    </aside>
  );
}

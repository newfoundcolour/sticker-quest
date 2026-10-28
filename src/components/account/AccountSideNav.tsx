"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId, useState } from "react";
import { signOutCustomerAction } from "@/app/actions/auth";

export const ACCOUNT_SECTIONS = [
  { label: "Dashboard", href: "/account", icon: "🏠" },
  { label: "Orders", href: "/account/orders", icon: "📦" },
  { label: "Reorder", href: "/account/reorder", icon: "🔁" },
  { label: "Proofs", href: "/account/proofs", icon: "🖼️", badge: "proofs" },
  { label: "Support", href: "/account/support", icon: "💬", badge: "support" },
  { label: "Settings", href: "/account/settings", icon: "⚙️" },
] as const;

function isCurrent(pathname: string, href: string): boolean {
  return href === "/account" ? pathname === "/account" : pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * The account area's section menu: a sticky column on desktop, a collapsible
 * "Menu" disclosure on mobile.
 */
export function AccountSideNav({ proofsAwaiting, unreadSupport }: { proofsAwaiting: number; unreadSupport: number }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const listId = useId();
  const current = ACCOUNT_SECTIONS.find((s) => isCurrent(pathname, s.href));

  // Collapse again after navigating on mobile.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  const counts = { proofs: proofsAwaiting, support: unreadSupport };

  return (
    <nav aria-label="Account" className="rounded-[20px] border-[1.5px] border-dusk-line bg-dusk p-2 lg:sticky lg:top-6">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={listId}
        className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-black text-white lg:hidden"
      >
        <span>
          <span className="text-white/60">Menu · </span>
          {current?.label ?? "Account"}
        </span>
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`size-5 text-white/70 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      <ul id={listId} className={`${open ? "flex" : "hidden"} flex-col gap-0.5 pt-1 lg:flex lg:pt-0`}>
        {ACCOUNT_SECTIONS.map((section) => {
          const active = isCurrent(pathname, section.href);
          const count = "badge" in section ? counts[section.badge] : 0;
          return (
            <li key={section.href}>
              <Link
                href={section.href}
                aria-current={active ? "page" : undefined}
                className={[
                  "flex items-center gap-3 rounded-xl border-l-4 px-3 py-2.5 text-sm font-bold transition-colors",
                  active
                    ? "border-blaze bg-white/[0.08] text-zap"
                    : "border-transparent text-white/80 hover:bg-white/[0.06] hover:text-white",
                ].join(" ")}
              >
                <span aria-hidden className="w-5 text-center">
                  {section.icon}
                </span>
                <span className="flex-1">{section.label}</span>
                {count > 0 && (
                  <span className="rounded-full bg-blaze px-2 py-0.5 text-[11px] font-black text-white">
                    {count}
                    <span className="sr-only"> new</span>
                  </span>
                )}
              </Link>
            </li>
          );
        })}
        <li className="mt-1 border-t border-white/[0.13] pt-1">
          <form action={signOutCustomerAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-xl border-l-4 border-transparent px-3 py-2.5 text-left text-sm font-bold text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              <span aria-hidden className="w-5 text-center">
                👋
              </span>
              Log out
            </button>
          </form>
        </li>
      </ul>
    </nav>
  );
}

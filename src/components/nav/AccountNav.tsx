"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { signOutCustomerAction } from "@/app/actions/auth";
import type { NavAccount } from "@/lib/navAccount";

const MENU_ITEMS: { label: string; href: string; badge?: "proofs" }[] = [
  { label: "Dashboard", href: "/account" },
  { label: "Orders", href: "/account/orders" },
  { label: "Reorder", href: "/account/reorder" },
  { label: "Proofs", href: "/account/proofs", badge: "proofs" },
  { label: "Support", href: "/account/support" },
  { label: "Settings", href: "/account/settings" },
];

function CountBadge({ count, className = "" }: { count: number; className?: string }) {
  if (count <= 0) return null;
  return (
    <span
      aria-hidden
      className={`flex min-w-[17px] items-center justify-center rounded-full bg-blaze px-1 text-[10px] font-black leading-[17px] text-white ${className}`}
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}

/** Sits between the type picker and the cart. */
export function AccountNav({ account }: { account: NavAccount | null }) {
  if (!account) {
    return (
      <div className="flex shrink-0 items-center gap-2">
        <Link
          href="/login"
          className="flex h-11 items-center rounded-full border-2 border-white/[0.19] px-3.5 text-sm font-black text-white transition-colors hover:border-white/50 sm:px-5"
        >
          Log in
        </Link>
        {/* Sign up stays reachable from the login page on very small screens. */}
        <Link
          href="/signup"
          className="hidden h-11 items-center rounded-full border-2 border-night bg-blaze px-5 text-sm font-black text-white shadow-pop-blaze transition-[translate] duration-150 motion-safe:hover:-translate-y-0.5 sm:flex"
        >
          Sign up
        </Link>
      </div>
    );
  }

  return (
    <div className="flex shrink-0 items-center gap-1 sm:gap-2">
      <Link
        href="/account/support"
        className="relative flex size-11 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10"
        aria-label={`Support messages${account.unreadSupport > 0 ? `, ${account.unreadSupport} unread` : ""}`}
      >
        <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className="size-[23px]">
          <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.6A8 8 0 1 1 21 12Z" />
        </svg>
        <CountBadge count={account.unreadSupport} className="absolute left-7 top-0.5" />
      </Link>
      <AvatarMenu account={account} />
    </div>
  );
}

function AvatarMenu({ account }: { account: NavAccount }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  // Close after navigating.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  // Close on a click or tap anywhere outside the menu.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // Move focus into the menu when it opens from the keyboard or a click.
  useEffect(() => {
    if (open) menuItems()[0]?.focus();
  }, [open]);

  function menuItems(): HTMLElement[] {
    return Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
  }

  function close(returnFocus: boolean) {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }

  function onMenuKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const items = menuItems();
    const index = items.indexOf(document.activeElement as HTMLElement);
    switch (e.key) {
      case "Escape":
        e.preventDefault();
        close(true);
        break;
      case "ArrowDown":
        e.preventDefault();
        items[(index + 1) % items.length]?.focus();
        break;
      case "ArrowUp":
        e.preventDefault();
        items[(index - 1 + items.length) % items.length]?.focus();
        break;
      case "Home":
        e.preventDefault();
        items[0]?.focus();
        break;
      case "End":
        e.preventDefault();
        items[items.length - 1]?.focus();
        break;
      case "Tab":
        close(false);
        break;
    }
  }

  const hasBadge = account.proofsAwaiting > 0;

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" && !open) {
            e.preventDefault();
            setOpen(true);
          }
          if (e.key === "Escape" && open) close(true);
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`Account menu${hasBadge ? `, ${account.proofsAwaiting} proof${account.proofsAwaiting === 1 ? "" : "s"} to approve` : ""}`}
        className="relative flex size-11 items-center justify-center rounded-full border-2 border-white/[0.19] bg-grape text-sm font-black text-white transition-colors hover:border-white/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zap"
      >
        {account.initials}
        {hasBadge && <span aria-hidden className="absolute -right-0.5 -top-0.5 size-3 rounded-full border-2 border-night bg-blaze" />}
      </button>

      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label="Account"
          onKeyDown={onMenuKeyDown}
          className="absolute right-0 top-full z-20 mt-2 w-56 overflow-hidden rounded-[20px] border-[1.5px] border-grape bg-night p-2 shadow-card"
        >
          {account.firstName && (
            <p className="px-3 pb-2 pt-1 text-xs font-black uppercase tracking-wide text-zap">
              Hey {account.firstName}
            </p>
          )}
          {MENU_ITEMS.map((item) => {
            const current = item.href === "/account" ? pathname === "/account" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                tabIndex={-1}
                aria-current={current ? "page" : undefined}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-bold text-white outline-none hover:bg-zap/20 focus-visible:bg-zap/20 aria-[current=page]:text-zap"
              >
                {item.label}
                {item.badge === "proofs" && <CountBadge count={account.proofsAwaiting} />}
              </Link>
            );
          })}
          <div className="my-1.5 border-t border-white/[0.13]" />
          <form action={signOutCustomerAction}>
            <button
              type="submit"
              role="menuitem"
              tabIndex={-1}
              className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-bold text-white/70 outline-none hover:bg-zap/20 hover:text-white focus-visible:bg-zap/20 focus-visible:text-white"
            >
              Log out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

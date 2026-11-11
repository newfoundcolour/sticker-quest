"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import { signOutCustomerAction } from "@/app/actions/auth";

type IconName = "plus" | "home" | "package" | "reorder" | "image" | "settings" | "help" | "logout";

type Section = {
  label: string;
  href: string;
  icon: IconName;
  /** Text-colour class for the row's icon — each row has its own, as in the Figma. */
  tint: string;
  badge?: "proofs" | "support";
};

/** Grouped like the Figma sidebar: account pages, then support. */
export const ACCOUNT_SECTION_GROUPS: { title: string; sections: Section[] }[] = [
  {
    title: "Account",
    sections: [
      { label: "Dashboard", href: "/account", icon: "home", tint: "text-icon-violet" },
      { label: "Orders", href: "/account/orders", icon: "package", tint: "text-mint" },
      { label: "Reorder", href: "/account/reorder", icon: "reorder", tint: "text-icon-sky" },
      { label: "Proofs", href: "/account/proofs", icon: "image", tint: "text-icon-amber", badge: "proofs" },
      { label: "Settings", href: "/account/settings", icon: "settings", tint: "text-icon-blue" },
    ],
  },
  {
    title: "Support",
    sections: [
      { label: "Support", href: "/account/support", icon: "help", tint: "text-icon-pink", badge: "support" },
    ],
  },
];

/** Shared shape of every sidebar row (links and the log-out button). */
const ROW =
  "flex h-[42px] min-h-[42px] w-full items-center lg:h-auto gap-3 rounded-xl border px-4 text-left text-sm font-semibold transition-colors";
const ROW_IDLE = "text-sand border-nav-tile-line bg-nav-tile hover:border-nav-active-line/50";
const ROW_ACTIVE = "text-sand border-nav-active-line bg-nav-active";

export const ACCOUNT_SECTIONS = ACCOUNT_SECTION_GROUPS.flatMap((g) => g.sections);

/**
 * Nudges each `[data-snap]` icon inside `root` onto whole screen pixels.
 * The stretched rows and the centred page put the icons on fractional pixel
 * positions, which blurs their thin strokes. Re-runs on resize and scroll
 * (sticky moves, and on scaled displays a scroll step isn't a whole pixel).
 */
function usePixelSnap(root: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    let frame = 0;
    const snap = () => {
      frame = 0;
      const dpr = window.devicePixelRatio || 1;
      for (const icon of el.querySelectorAll<SVGElement>("[data-snap]")) {
        icon.style.transform = "";
        const r = icon.getBoundingClientRect();
        const dx = Math.round(r.left * dpr) / dpr - r.left;
        const dy = Math.round(r.top * dpr) / dpr - r.top;
        if (dx || dy) icon.style.transform = `translate(${dx}px, ${dy}px)`;
      }
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(snap);
    };
    snap();
    const observer = new ResizeObserver(schedule);
    observer.observe(el);
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule);
    };
  }, [root]);
}

function isCurrent(pathname: string, href: string): boolean {
  return href === "/account" ? pathname === "/account" : pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * The account area's section menu, styled after the Figma account sidebar:
 * a full-height panel on desktop, a collapsible "Menu" disclosure on mobile.
 */
export function AccountSideNav({
  firstName,
  lastName,
  email,
  proofsAwaiting,
  unreadSupport,
}: {
  firstName: string;
  lastName: string;
  email: string;
  proofsAwaiting: number;
  unreadSupport: number;
}) {
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
  const fullName = [firstName, lastName].filter(Boolean).join(" ");
  const navRef = useRef<HTMLElement>(null);
  usePixelSnap(navRef);

  return (
    <nav
      ref={navRef}
      aria-label="Account"
      className="border-b border-white/[0.08] lg:w-1/4 lg:shrink-0 lg:border-b-0 lg:border-r lg:pr-4"
    >
      {/* Desktop: sticks just below where the site header ends (86px at lg — NavBar's 58px
          logo + py-3.5), so it starts in place and doesn't move while the page scrolls. The
          sticky area ends where the footer starts, so the footer pushes it up rather than
          covering it. */}
      <div className="lg:sticky lg:top-[86px] lg:flex lg:h-[calc(100dvh-86px)] lg:flex-col lg:pb-6 lg:pt-2">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={listId}
          className="flex w-full items-center justify-between py-3 text-left text-sm font-semibold text-sand lg:hidden"
        >
          <span>
            <span className="font-normal text-white/[0.44]">Menu · </span>
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
            className={`size-4 text-white/[0.44] transition-transform ${open ? "rotate-180" : ""}`}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        <div id={listId} className={`${open ? "flex" : "hidden"} flex-col gap-2 pb-4 lg:flex lg:flex-1 lg:pb-0`}>
          <div className="hidden flex-col items-center gap-1 px-4 pb-3 lg:flex">
            {/* Everyone gets the wizard (as in the header) until customers can upload their own picture. */}
            <Image
              src="/mascot/wizard-avatar.jpg"
              alt=""
              width={52}
              height={52}
              className="size-[52px] rounded-full object-cover"
            />
            {fullName && <p className="max-w-full truncate text-sm font-semibold text-sand">{fullName}</p>}
            {email && <p className="max-w-full truncate text-[11px] text-nav-label">{email}</p>}
          </div>

          {/* The one lime row: the main thing to do from here. Grows like a one-row group. */}
          <div
            style={{ "--rows": 1 } as CSSProperties}
            className="flex flex-col lg:[flex:var(--rows)_1_calc((var(--rows)-1)*0.5rem)]"
          >
            <Link
              href="/stickers"
              className={`${ROW} border-zap bg-zap lg:flex-1 font-bold text-night hover:border-sand hover:bg-[color-mix(in_srgb,var(--color-zap)_88%,white)]`}
            >
              <NavIcon name="plus" />
              Start New Order
            </Link>
          </div>

          {ACCOUNT_SECTION_GROUPS.map((group, i) => {
            const isLast = i === ACCOUNT_SECTION_GROUPS.length - 1;
            const rows = group.sections.length + (isLast ? 1 : 0); // + Log out
            return (
              <div
                key={group.title}
                // Desktop: each group grows by its row count, starting from the fixed gaps
                // between its rows (0.5rem each), so every row ends up the same height.
                style={{ "--rows": rows } as CSSProperties}
                className="flex flex-col lg:[flex:var(--rows)_1_calc((var(--rows)-1)*0.5rem)]"
              >
                <ul className="flex flex-col gap-2 lg:flex-1">
                  {group.sections.map((section) => {
                    const active = isCurrent(pathname, section.href);
                    const count = section.badge ? counts[section.badge] : 0;
                    return (
                      <li key={section.href} className="lg:flex lg:flex-1">
                        <NavRow
                          href={section.href}
                          active={active}
                          icon={section.icon}
                          tint={section.tint}
                          count={count}
                        >
                          {section.label}
                        </NavRow>
                      </li>
                    );
                  })}
                  {isLast && (
                    <li className="lg:flex lg:flex-1">
                      <form action={signOutCustomerAction} className="lg:flex lg:flex-1">
                        <button type="submit" className={`${ROW} ${ROW_IDLE}`}>
                          <span className="text-icon-rose">
                            <NavIcon name="logout" />
                          </span>
                          Log out
                        </button>
                      </form>
                    </li>
                  )}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

function NavRow({
  href,
  active,
  icon,
  tint,
  count,
  children,
}: {
  href: string;
  active: boolean;
  icon: IconName;
  tint: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`${ROW} ${active ? ROW_ACTIVE : ROW_IDLE}`}
    >
      <span className={tint}>
        <NavIcon name={icon} />
      </span>
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {count > 0 && (
        <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-mint px-1 text-[9px] font-bold text-nav-count-ink">
          {count}
          <span className="sr-only"> new</span>
        </span>
      )}
    </Link>
  );
}

/** Lucide-style 16px line icons, as in the Figma sidebar; they take the text colour. */
function NavIcon({ name }: { name: IconName }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      data-snap
      className="size-[26px] shrink-0"
    >
      {ICON_PATHS[name]}
    </svg>
  );
}

const ICON_PATHS: Record<IconName, ReactNode> = {
  plus: (
    <>
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </>
  ),
  home: (
    <>
      <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
      <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </>
  ),
  package: (
    <>
      <path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z" />
      <path d="M12 22V12" />
      <path d="m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7" />
      <path d="m7.5 4.27 9 5.15" />
    </>
  ),
  reorder: (
    <>
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </>
  ),
  image: (
    <>
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </>
  ),
  settings: (
    <>
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  help: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </>
  ),
  logout: (
    <>
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    </>
  ),
};

import Link from "next/link";
import type { ReactNode } from "react";
import { ORDER_STATUS_LABELS, PROOF_STATUS_LABELS } from "@/lib/orderLabels";
import { CONVERSATION_STATUS_LABELS } from "@/lib/supportLabels";
import type { ConversationStatus, OrderStatus } from "@/generated/prisma/client";
import type { ProofDisplayStatus } from "@/lib/proofs";

/*
 * The admin's shared look: a light workspace (admin-canvas) with white cards,
 * grape for actions and links, and status shown as a coloured dot in a quiet
 * pill. No "use client", so server pages can use the class strings directly.
 */

export const CARD_CLASSES = "rounded-2xl border border-admin-line bg-white shadow-[0_1px_2px_rgba(28,24,48,0.04)]";

const BUTTON_BASE =
  "inline-flex items-center justify-center gap-2 rounded-lg font-semibold whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grape disabled:cursor-not-allowed disabled:opacity-50";
export const PRIMARY_BUTTON = `${BUTTON_BASE} h-10 bg-grape px-4 text-sm text-white hover:bg-grape-deep`;
export const SECONDARY_BUTTON = `${BUTTON_BASE} h-10 border border-admin-line bg-white px-4 text-sm text-admin-ink hover:bg-admin-canvas`;
export const SMALL_SECONDARY_BUTTON = `${BUTTON_BASE} h-8 border border-admin-line bg-white px-3 text-xs text-admin-ink hover:bg-admin-canvas`;

export const INPUT_CLASSES =
  "h-10 w-full rounded-lg border border-admin-line bg-white px-3 text-sm text-admin-ink outline-none placeholder:text-admin-faint focus:border-grape focus:ring-2 focus:ring-grape/20";
export const LABEL_CLASSES = "flex flex-col gap-1.5 text-xs font-semibold text-admin-muted";
export const LINK_CLASSES = "font-medium text-grape underline-offset-2 hover:text-grape-deep hover:underline";

/** Page title row: optional back link, title, a line of context and actions on the right. */
export function AdminPageHeader({
  title,
  description,
  back,
  actions,
}: {
  title: ReactNode;
  description?: ReactNode;
  back?: { href: string; label: string };
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3">
      {back && (
        <Link
          href={back.href}
          className="inline-flex w-fit items-center gap-1 text-sm font-medium text-admin-muted hover:text-admin-ink"
        >
          <AdminIcon name="chevron-left" className="size-4" />
          {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-admin-ink">{title}</h1>
          {description && <div className="text-sm text-admin-muted">{description}</div>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

/** A white card, with an optional title row (title, description, actions) above its body. */
export function AdminCard({
  title,
  description,
  actions,
  className = "",
  children,
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`${CARD_CLASSES} ${className}`}>
      {title && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-admin-line px-5 py-4">
          <div className="flex min-w-0 flex-col gap-0.5">
            <h2 className="text-sm font-semibold text-admin-ink">{title}</h2>
            {description && <p className="text-xs text-admin-muted">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

/** Label/value rows inside a card. */
export function DetailList({ rows }: { rows: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="flex flex-col gap-3 px-5 py-4 text-sm">
      {rows.map((row) => (
        <div key={row.label} className="flex flex-col gap-0.5">
          <dt className="text-xs font-medium text-admin-muted">{row.label}</dt>
          <dd className="break-words text-admin-ink">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

// ─── Status ────────────────────────────────────────────────────────────────

export const ORDER_STATUS_DOT: Record<OrderStatus, string> = {
  AWAITING_PROOF: "bg-waypoint-gold",
  AWAITING_APPROVAL: "bg-blaze",
  APPROVED: "bg-grape",
  PRINTING: "bg-trail-teal",
  SHIPPED: "bg-leaf",
};

const PROOF_STATUS_DOT: Record<ProofDisplayStatus, string> = {
  PENDING: "bg-blaze",
  APPROVED: "bg-leaf",
  REJECTED: "bg-coral-signal",
  SUPERSEDED: "bg-admin-faint",
};

const PILL = "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-admin-line bg-white px-2.5 py-1 text-xs font-medium text-admin-ink";

function Dot({ className }: { className: string }) {
  return <span aria-hidden className={`size-2 shrink-0 rounded-full ${className}`} />;
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={PILL}>
      <Dot className={ORDER_STATUS_DOT[status]} />
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}

export function ProofStatusBadge({ status }: { status: ProofDisplayStatus }) {
  return (
    <span className={PILL}>
      <Dot className={PROOF_STATUS_DOT[status]} />
      {PROOF_STATUS_LABELS[status]}
    </span>
  );
}

export type DiscountLifecycleStatus = "ACTIVE" | "SCHEDULED" | "EXPIRED" | "USED_UP" | "DISABLED";

export const DISCOUNT_STATUS_LABELS: Record<DiscountLifecycleStatus, string> = {
  ACTIVE: "Active",
  SCHEDULED: "Scheduled",
  EXPIRED: "Expired",
  USED_UP: "Used up",
  DISABLED: "Off",
};

const DISCOUNT_STATUS_DOT: Record<DiscountLifecycleStatus, string> = {
  ACTIVE: "bg-leaf",
  SCHEDULED: "bg-waypoint-gold",
  EXPIRED: "bg-admin-faint",
  USED_UP: "bg-admin-faint",
  DISABLED: "bg-coral-signal",
};

export function DiscountStatusBadge({ status }: { status: DiscountLifecycleStatus }) {
  return (
    <span className={PILL}>
      <Dot className={DISCOUNT_STATUS_DOT[status]} />
      {DISCOUNT_STATUS_LABELS[status]}
    </span>
  );
}

const BLOG_STATUS: Record<"DRAFT" | "SUBMITTED" | "PUBLISHED", { label: string; dot: string }> = {
  DRAFT: { label: "Draft", dot: "bg-admin-faint" },
  SUBMITTED: { label: "Awaiting review", dot: "bg-waypoint-gold" },
  PUBLISHED: { label: "Published", dot: "bg-leaf" },
};

export function BlogStatusBadge({ status }: { status: "DRAFT" | "SUBMITTED" | "PUBLISHED" }) {
  return (
    <span className={PILL}>
      <Dot className={BLOG_STATUS[status].dot} />
      {BLOG_STATUS[status].label}
    </span>
  );
}

export function ConversationStatusBadge({ status }: { status: ConversationStatus }) {
  return (
    <span className={PILL}>
      <Dot className={status === "OPEN" ? "bg-trail-teal" : "bg-admin-faint"} />
      {CONVERSATION_STATUS_LABELS[status]}
    </span>
  );
}

// ─── Lists ─────────────────────────────────────────────────────────────────

/** Underlined tabs above a table, each with an optional count. */
export function AdminTabs({
  label,
  tabs,
}: {
  label: string;
  tabs: { href: string; label: string; count?: number; active: boolean }[];
}) {
  return (
    <nav aria-label={label} className="-mb-px flex gap-1 overflow-x-auto border-b border-admin-line px-3">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          aria-current={tab.active ? "page" : undefined}
          className={[
            "flex items-center gap-2 border-b-2 px-2.5 py-3 text-sm font-medium whitespace-nowrap transition-colors",
            tab.active
              ? "border-grape text-admin-ink"
              : "border-transparent text-admin-muted hover:text-admin-ink",
          ].join(" ")}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span
              className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums ${
                tab.active ? "bg-grape text-white" : "bg-admin-canvas text-admin-muted"
              }`}
            >
              {tab.count.toLocaleString("en-ZA")}
            </span>
          )}
        </Link>
      ))}
    </nav>
  );
}

/** "Showing 1–20 of 134 orders" with Previous/Next, at the foot of a list card. */
export function AdminPagination({
  start,
  end,
  total,
  noun,
  prevHref,
  nextHref,
}: {
  start: number;
  end: number;
  total: number;
  noun: string;
  prevHref?: string;
  nextHref?: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-admin-line px-5 py-3 text-sm text-admin-muted">
      <p className="tabular-nums">
        Showing {start.toLocaleString("en-ZA")}–{end.toLocaleString("en-ZA")} of {total.toLocaleString("en-ZA")} {noun}
      </p>
      <nav aria-label="Pagination" className="flex gap-2">
        <PageLink href={prevHref} label="Previous" icon="chevron-left" />
        <PageLink href={nextHref} label="Next" icon="chevron-right" />
      </nav>
    </div>
  );
}

function PageLink({ href, label, icon }: { href?: string; label: string; icon: AdminIconName }) {
  const content = (
    <>
      {icon === "chevron-left" && <AdminIcon name={icon} className="size-4" />}
      {label}
      {icon === "chevron-right" && <AdminIcon name={icon} className="size-4" />}
    </>
  );
  if (!href) {
    return (
      <span aria-disabled="true" className={`${SMALL_SECONDARY_BUTTON} pointer-events-none opacity-40`}>
        {content}
      </span>
    );
  }
  return (
    <Link href={href} className={SMALL_SECONDARY_BUTTON}>
      {content}
    </Link>
  );
}

/** Initials in a soft circle, for customer cells. */
export function Avatar({
  name,
  size = "md",
  dark = false,
}: {
  name: string;
  size?: "md" | "lg";
  /** For the night sidebar. */
  dark?: boolean;
}) {
  const initials =
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?";
  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold ${dark ? "bg-white/15 text-white" : "bg-grape/10 text-grape"} ${
        size === "lg" ? "size-11 text-sm" : "size-9 text-xs"
      }`}
    >
      {initials}
    </span>
  );
}

/** One centred line for an empty list. */
export function EmptyMessage({ children }: { children: ReactNode }) {
  return <p className="px-5 py-14 text-center text-sm text-admin-muted">{children}</p>;
}

export function formatAdminDate(date: Date): string {
  return date.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

export function formatAdminDateTime(date: Date): string {
  return date.toLocaleString("en-ZA", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ─── Icons ─────────────────────────────────────────────────────────────────

export type AdminIconName =
  | "package"
  | "message"
  | "store"
  | "logout"
  | "chevron-left"
  | "chevron-right"
  | "download"
  | "external"
  | "upload"
  | "truck"
  | "revenue"
  | "average"
  | "check"
  | "tag"
  | "plus"
  | "trash"
  | "pen";

const ICON_PATHS: Record<AdminIconName, ReactNode> = {
  package: (
    <>
      <path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z" />
      <path d="M12 22V12" />
      <path d="m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7" />
    </>
  ),
  message: <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />,
  store: (
    <>
      <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
      <path d="M2 7h20" />
    </>
  ),
  logout: (
    <>
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    </>
  ),
  "chevron-left": <path d="m15 18-6-6 6-6" />,
  "chevron-right": <path d="m9 18 6-6-6-6" />,
  download: (
    <>
      <path d="M12 15V3" />
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="m7 10 5 5 5-5" />
    </>
  ),
  external: (
    <>
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    </>
  ),
  upload: (
    <>
      <path d="M12 3v12" />
      <path d="m17 8-5-5-5 5" />
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    </>
  ),
  truck: (
    <>
      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
      <path d="M15 18H9" />
      <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
      <circle cx="17" cy="18" r="2" />
      <circle cx="7" cy="18" r="2" />
    </>
  ),
  revenue: (
    <>
      <path d="M3 3v16a2 2 0 0 0 2 2h16" />
      <path d="m19 9-5 5-4-4-3 3" />
    </>
  ),
  average: (
    <>
      <path d="M5 21v-6" />
      <path d="M12 21V9" />
      <path d="M19 21V3" />
    </>
  ),
  check: <path d="M20 6 9 17l-5-5" />,
  tag: (
    <>
      <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" />
      <circle cx="7.5" cy="7.5" r=".5" fill="currentColor" />
    </>
  ),
  plus: (
    <>
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </>
  ),
  pen: (
    <>
      <path d="M12 20h9" />
      <path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z" />
    </>
  ),
  trash: (
    <>
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </>
  ),
};

/** Lucide-style line icons; they take the text colour. */
export function AdminIcon({ name, className = "size-5" }: { name: AdminIconName; className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
    >
      {ICON_PATHS[name]}
    </svg>
  );
}

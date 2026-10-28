import Link from "next/link";
import type { ReactNode } from "react";
import { requireStaff } from "@/lib/auth";
import { ADMIN_SUPPORT_PAGE_SIZE, listConversationsForAdmin } from "@/lib/support";
import { orderNumber } from "@/lib/orderLabels";
import { CONVERSATION_STATUS_LABELS, SUPPORT_CATEGORY_LABELS } from "@/lib/supportLabels";
import type { ConversationStatus } from "@/generated/prisma/client";

function isStatus(v: string | undefined): v is ConversationStatus {
  return v === "OPEN" || v === "RESOLVED";
}

function inboxHref(status: ConversationStatus | undefined, page: number) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return `/admin/support${qs ? `?${qs}` : ""}`;
}

function initials(first: string, last: string, email: string) {
  return (`${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase() || email[0]?.toUpperCase()) ?? "?";
}

export default async function AdminSupportPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  await requireStaff();
  const { status: statusParam, page: pageParam } = await searchParams;
  const status = isStatus(statusParam) ? statusParam : undefined;
  const page = Math.max(1, Math.min(1000, Number(pageParam) || 1));
  const { conversations, totalCount } = await listConversationsForAdmin({ status, page });
  const totalPages = Math.max(1, Math.ceil(totalCount / ADMIN_SUPPORT_PAGE_SIZE));

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <h1 className="font-display text-2xl font-semibold text-ink-navy">Support</h1>

      <div className="mt-6 flex flex-wrap gap-2">
        <FilterPill href={inboxHref(undefined, 1)} active={!status}>
          All
        </FilterPill>
        <FilterPill href={inboxHref("OPEN", 1)} active={status === "OPEN"}>
          Open
        </FilterPill>
        <FilterPill href={inboxHref("RESOLVED", 1)} active={status === "RESOLVED"}>
          Resolved
        </FilterPill>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-ink-navy/10 bg-white/70">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-ink-navy/10 text-xs uppercase tracking-wide text-ink-navy/50">
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Last message</th>
              <th className="px-4 py-3 font-medium">Order</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Last activity</th>
            </tr>
          </thead>
          <tbody>
            {conversations.map((c) => {
              const href = `/admin/support/${c.id}`;
              const unread = c.unread > 0;
              const name = `${c.user.firstName} ${c.user.lastName}`.trim() || c.user.email;
              return (
                <tr
                  key={c.id}
                  className={`border-b border-ink-navy/5 last:border-0 hover:bg-ink-navy/[0.03] ${unread ? "bg-waypoint-gold/10" : ""}`}
                >
                  <td className="px-0 py-0">
                    <Link href={href} className="flex items-center gap-3 px-4 py-3">
                      <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink-navy/10 text-xs font-semibold text-ink-navy">
                        {initials(c.user.firstName, c.user.lastName, c.user.email)}
                        {unread && (
                          <span className="absolute -right-0.5 -top-0.5 size-3 rounded-full border-2 border-paper bg-coral-signal">
                            <span className="sr-only">Unread</span>
                          </span>
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className={`block truncate text-ink-navy ${unread ? "font-semibold" : "font-medium"}`}>{name}</span>
                        <span className="block truncate text-xs text-ink-navy/50">{c.user.email}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-ink-navy/70">{SUPPORT_CATEGORY_LABELS[c.category]}</td>
                  <td className="max-w-[320px] px-0 py-0">
                    <Link href={href} className={`block truncate px-4 py-3 ${unread ? "font-semibold text-ink-navy" : "text-ink-navy/60"}`}>
                      {c.lastMessage?.sender === "STAFF" ? "You: " : ""}
                      {c.lastMessage?.body ?? ""}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {c.order ? (
                      <Link href={`/admin/orders/${c.order.id}`} className="text-coral-signal underline underline-offset-2">
                        {orderNumber(c.order.id)}
                      </Link>
                    ) : (
                      <span className="text-ink-navy/30">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        c.status === "OPEN" ? "bg-trail-teal/15 text-trail-teal" : "bg-ink-navy/10 text-ink-navy/60"
                      }`}
                    >
                      {CONVERSATION_STATUS_LABELS[c.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-ink-navy/60">
                    {c.lastMessageAt.toLocaleString("en-ZA", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </td>
                </tr>
              );
            })}
            {conversations.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-ink-navy/50">
                  No {status ? CONVERSATION_STATUS_LABELS[status].toLowerCase() : ""} conversations.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalCount > ADMIN_SUPPORT_PAGE_SIZE && (
        <div className="mt-4 flex items-center justify-between text-sm text-ink-navy/60">
          <p>
            Page <span className="font-mono text-ink-navy">{page}</span> of{" "}
            <span className="font-mono text-ink-navy">{totalPages}</span>
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={inboxHref(status, page - 1)} className="rounded-lg border border-ink-navy/15 px-3 py-1.5 hover:border-ink-navy/30">
                Prev
              </Link>
            )}
            {page < totalPages && (
              <Link href={inboxHref(status, page + 1)} className="rounded-lg border border-ink-navy/15 px-3 py-1.5 hover:border-ink-navy/30">
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

function FilterPill({ href, active, children }: { href: string; active: boolean; children: ReactNode }) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
        active ? "border-coral-signal bg-coral-signal text-paper" : "border-ink-navy/15 text-ink-navy/70 hover:border-ink-navy/30"
      }`}
    >
      {children}
    </Link>
  );
}

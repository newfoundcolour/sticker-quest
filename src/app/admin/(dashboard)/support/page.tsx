import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { ADMIN_SUPPORT_PAGE_SIZE, getSupportCountsForStaff, listConversationsForAdmin } from "@/lib/support";
import { orderNumber } from "@/lib/orderLabels";
import { CONVERSATION_STATUS_LABELS, SUPPORT_CATEGORY_LABELS } from "@/lib/supportLabels";
import {
  AdminIcon,
  AdminPageHeader,
  AdminPagination,
  AdminTabs,
  Avatar,
  CARD_CLASSES,
  ConversationStatusBadge,
  EmptyMessage,
  LINK_CLASSES,
} from "@/components/admin/ui";
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

function formatActivity(date: Date): string {
  return date.toLocaleString("en-ZA", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
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
  const [{ conversations, totalCount }, counts] = await Promise.all([
    listConversationsForAdmin({ status, page }),
    getSupportCountsForStaff(),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalCount / ADMIN_SUPPORT_PAGE_SIZE));
  const rangeStart = totalCount === 0 ? 0 : (page - 1) * ADMIN_SUPPORT_PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * ADMIN_SUPPORT_PAGE_SIZE, totalCount);

  return (
    <>
      <AdminPageHeader
        title="Support"
        description={
          counts.unreadConversations > 0
            ? `${counts.unreadConversations} ${counts.unreadConversations === 1 ? "conversation needs" : "conversations need"} a reply. Open ones are listed first.`
            : "You're all caught up. Open conversations are listed first."
        }
      />

      <section className={`${CARD_CLASSES} overflow-hidden`}>
        <AdminTabs
          label="Filter by status"
          tabs={[
            { href: inboxHref(undefined, 1), label: "All", active: !status },
            { href: inboxHref("OPEN", 1), label: "Open", count: counts.open, active: status === "OPEN" },
            { href: inboxHref("RESOLVED", 1), label: "Resolved", active: status === "RESOLVED" },
          ]}
        />

        {conversations.length === 0 ? (
          <EmptyMessage>No {status ? CONVERSATION_STATUS_LABELS[status].toLowerCase() : ""} conversations.</EmptyMessage>
        ) : (
          <ul className="divide-y divide-admin-line">
            {conversations.map((c) => {
              const href = `/admin/support/${c.id}`;
              const unread = c.unread > 0;
              const name = `${c.user.firstName} ${c.user.lastName}`.trim() || c.user.email;
              return (
                <li key={c.id} className={`relative transition-colors hover:bg-admin-canvas/60 ${unread ? "bg-grape/[0.04]" : ""}`}>
                  {unread && <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-grape" />}
                  <div className="flex items-center gap-4 px-5 py-4">
                    <Link href={href} className="flex min-w-0 flex-1 items-center gap-4">
                      <Avatar name={name} />
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="flex flex-wrap items-center gap-x-2">
                          <span className={`truncate text-admin-ink ${unread ? "font-semibold" : "font-medium"}`}>{name}</span>
                          <span className="text-xs text-admin-muted">· {SUPPORT_CATEGORY_LABELS[c.category]}</span>
                          {unread && (
                            <span className="rounded-full bg-grape px-1.5 text-[11px] font-semibold leading-[18px] text-white">
                              New
                            </span>
                          )}
                        </span>
                        <span className={`truncate text-sm ${unread ? "text-admin-ink" : "text-admin-muted"}`}>
                          {c.lastMessage?.sender === "STAFF" ? "You: " : ""}
                          {c.lastMessage?.body ?? ""}
                        </span>
                      </span>
                    </Link>
                    <div className="hidden shrink-0 flex-col items-end gap-1.5 sm:flex">
                      <span className="text-xs text-admin-muted tabular-nums">{formatActivity(c.lastMessageAt)}</span>
                      <div className="flex items-center gap-2">
                        {c.order && (
                          <Link href={`/admin/orders/${c.order.id}`} className={`font-mono text-xs ${LINK_CLASSES}`}>
                            {orderNumber(c.order.id)}
                          </Link>
                        )}
                        <ConversationStatusBadge status={c.status} />
                      </div>
                    </div>
                    <Link
                      href={href}
                      aria-label={`Open conversation with ${name}`}
                      className="flex size-8 shrink-0 items-center justify-center rounded-lg text-admin-faint hover:bg-admin-canvas hover:text-admin-ink"
                    >
                      <AdminIcon name="chevron-right" className="size-4" />
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {totalCount > 0 && (
          <AdminPagination
            start={rangeStart}
            end={rangeEnd}
            total={totalCount}
            noun={totalCount === 1 ? "conversation" : "conversations"}
            prevHref={page > 1 ? inboxHref(status, page - 1) : undefined}
            nextHref={page < totalPages ? inboxHref(status, page + 1) : undefined}
          />
        )}
      </section>
    </>
  );
}

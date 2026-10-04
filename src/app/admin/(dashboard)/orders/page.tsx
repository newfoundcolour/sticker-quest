import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { STICKER_TYPE_LABELS } from "@/lib/stickerTypeSlug";
import {
  CUT_TYPE_LABELS,
  finishLabel,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_VALUES,
  SHAPE_LABELS,
  formatAddOns,
} from "@/lib/orderLabels";
import { formatSizeMm } from "@/lib/pricingUtils";
import { getOrderStats } from "@/lib/orderStats";
import { QuickStats } from "@/components/admin/QuickStats";
import { OrderStatusSelect } from "@/components/admin/OrderStatusSelect";
import { toArtworkDownloadUrl } from "@/lib/cloudinary";
import type { OrderStatus } from "@/generated/prisma/client";

const PAGE_SIZE = 20;

function isOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUS_VALUES as string[]).includes(value);
}

function getInitials(name: string): string {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  return initials || "?";
}

function ordersHref(status: OrderStatus | undefined, page: number): string {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return `/admin/orders${qs ? `?${qs}` : ""}`;
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const { status, page: pageParam } = await searchParams;
  const activeStatus = status && isOrderStatus(status) ? status : undefined;
  const page = Math.max(1, Number(pageParam) || 1);
  const where = activeStatus ? { status: activeStatus } : undefined;

  const [orders, totalCount, stats] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { items: { orderBy: { createdAt: "asc" } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.order.count({ where }),
    getOrderStats(),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const rangeStart = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, totalCount);

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <h1 className="font-display text-2xl font-semibold text-ink-navy">Orders</h1>

      <div className="mt-6">
        <QuickStats stats={stats} />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <FilterPill href="/admin/orders" active={!activeStatus}>
          All
        </FilterPill>
        {ORDER_STATUS_VALUES.map((s) => (
          <FilterPill key={s} href={ordersHref(s, 1)} active={activeStatus === s}>
            {ORDER_STATUS_LABELS[s]}
          </FilterPill>
        ))}
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-ink-navy/10 bg-white/70">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-ink-navy/10 text-xs uppercase tracking-wide text-ink-navy/50">
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">
                <span className="sr-only">Artwork</span>
              </th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Configuration</th>
              <th className="px-4 py-3 font-medium text-right">Qty</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order, orderIndex) => {
              const href = `/admin/orders/${order.id}`;
              // Every order has at least one item by the time checkout completes, but
              // fall back to a single placeholder row so a malformed order still renders.
              const rows = order.items.length > 0 ? order.items : [null];

              return rows.map((item, itemIndex) => {
                const isFirstRow = itemIndex === 0;
                const addOns = item ? formatAddOns(item) : "";
                const sizeLine = item
                  ? `${formatSizeMm(Number(item.widthCm))} x ${formatSizeMm(Number(item.heightCm))}${addOns ? ` · ${addOns}` : ""}`
                  : "";

                return (
                  <tr
                    key={item ? item.id : order.id}
                    className={`border-b border-ink-navy/5 last:border-0 hover:bg-ink-navy/[0.03] ${
                      isFirstRow && orderIndex > 0 ? "border-t border-t-ink-navy/10" : ""
                    }`}
                  >
                    {isFirstRow && (
                      <td className="px-0 py-0 align-top" rowSpan={rows.length}>
                        <Link href={href} className="flex items-center gap-3 px-4 py-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink-navy/10 text-xs font-semibold text-ink-navy">
                            {getInitials(order.customerName)}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate font-medium text-ink-navy">
                              {order.customerName}
                            </span>
                            <span className="block truncate text-xs text-ink-navy/50">
                              {order.email}
                            </span>
                          </span>
                        </Link>
                      </td>
                    )}
                    <td className="px-4 py-3">
                      {item ? (
                        <div className="flex items-center gap-2">
                          {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary URL, no next/image remote pattern configured */}
                          <img
                            src={item.artworkUrl}
                            alt=""
                            className="h-10 w-10 shrink-0 rounded-lg border border-ink-navy/10 object-cover"
                          />
                          <a
                            href={toArtworkDownloadUrl(item.artworkUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-medium text-coral-signal underline underline-offset-2 hover:text-coral-signal/80"
                          >
                            Download
                          </a>
                        </div>
                      ) : (
                        <span className="text-ink-navy/30">—</span>
                      )}
                    </td>
                    <td className="px-0 py-0">
                      <Link href={href} className="block px-4 py-3 text-ink-navy/70">
                        {item ? STICKER_TYPE_LABELS[item.stickerType] : "—"}
                      </Link>
                    </td>
                    <td className="px-0 py-0">
                      <Link href={href} className="block px-4 py-3">
                        <span className="block text-ink-navy/70">
                          {item
                            ? `${SHAPE_LABELS[item.shape]} · ${CUT_TYPE_LABELS[item.cutType]} · ${finishLabel(item.stickerType, item.finish)}`
                            : "—"}
                        </span>
                        {sizeLine && (
                          <span className="block text-xs text-ink-navy/50">{sizeLine}</span>
                        )}
                      </Link>
                    </td>
                    <td className="px-0 py-0">
                      <Link
                        href={href}
                        className="block px-4 py-3 text-right font-mono text-ink-navy/70"
                      >
                        {item ? item.quantity.toLocaleString("en-ZA") : "—"}
                      </Link>
                    </td>
                    {isFirstRow && (
                      <td className="px-4 py-3 align-top" rowSpan={rows.length}>
                        <OrderStatusSelect orderId={order.id} status={order.status} />
                      </td>
                    )}
                    {isFirstRow && (
                      <td className="px-0 py-0 align-top" rowSpan={rows.length}>
                        <Link
                          href={href}
                          className="block px-4 py-3 font-mono text-xs text-ink-navy/60"
                        >
                          {order.createdAt.toLocaleDateString("en-ZA", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </Link>
                      </td>
                    )}
                  </tr>
                );
              });
            })}
            {orders.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-ink-navy/50">
                  No orders {activeStatus ? `with status "${ORDER_STATUS_LABELS[activeStatus]}"` : "yet"}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalCount > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-ink-navy/60">
          <p>
            Showing <span className="font-mono text-ink-navy">{rangeStart}</span>–
            <span className="font-mono text-ink-navy">{rangeEnd}</span> of{" "}
            <span className="font-mono text-ink-navy">{totalCount}</span> orders
          </p>
          <div className="flex gap-2">
            <PageLink href={ordersHref(activeStatus, page - 1)} disabled={page <= 1}>
              Prev
            </PageLink>
            <PageLink href={ordersHref(activeStatus, page + 1)} disabled={page >= totalPages}>
              Next
            </PageLink>
          </div>
        </div>
      )}
    </main>
  );
}

function FilterPill({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "border-coral-signal bg-coral-signal text-paper"
          : "border-ink-navy/15 text-ink-navy/70 hover:border-ink-navy/30"
      }`}
    >
      {children}
    </Link>
  );
}

function PageLink({
  href,
  disabled,
  children,
}: {
  href: string;
  disabled: boolean;
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <span className="cursor-not-allowed rounded-lg border border-ink-navy/10 px-3 py-1.5 text-ink-navy/30">
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className="rounded-lg border border-ink-navy/15 px-3 py-1.5 text-ink-navy/70 hover:border-ink-navy/30 hover:text-ink-navy"
    >
      {children}
    </Link>
  );
}

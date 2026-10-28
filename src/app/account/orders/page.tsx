import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { StepCard } from "@/components/configurator/StepCard";
import { PRIMARY_BUTTON_CLASSES } from "@/components/auth/fields";
import { AccountPageHeader } from "@/components/account/AccountPageHeader";
import { ArtworkThumb } from "@/components/account/ArtworkThumb";
import { EmptyState, StatCard, StatusPill, formatOrderDate } from "@/components/account/OrderBits";
import { requireVerifiedUser } from "@/lib/auth";
import {
  CUSTOMER_ORDERS_PAGE_SIZE,
  getCustomerOrderStats,
  listCustomerOrders,
} from "@/lib/customerOrders";
import { ORDER_STATUS_LABELS, ORDER_STATUS_VALUES, itemSummary, orderNumber } from "@/lib/orderLabels";
import { formatCurrency } from "@/lib/pricingUtils";
import type { OrderStatus } from "@/generated/prisma/client";

export const metadata: Metadata = { title: "Orders · Sticker Quest" };

function isOrderStatus(value: string | undefined): value is OrderStatus {
  return !!value && (ORDER_STATUS_VALUES as string[]).includes(value);
}

function ordersHref(status: OrderStatus | undefined, page: number): string {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return `/account/orders${qs ? `?${qs}` : ""}`;
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const user = await requireVerifiedUser("/account/orders");
  const { status: statusParam, page: pageParam } = await searchParams;
  const status = isOrderStatus(statusParam) ? statusParam : undefined;
  const page = Math.max(1, Math.min(1000, Number(pageParam) || 1));

  const [stats, { orders, totalCount }] = await Promise.all([
    getCustomerOrderStats(user.id),
    listCustomerOrders(user.id, { status, page }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / CUSTOMER_ORDERS_PAGE_SIZE));
  const rangeStart = totalCount === 0 ? 0 : (page - 1) * CUSTOMER_ORDERS_PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * CUSTOMER_ORDERS_PAGE_SIZE, totalCount);

  return (
    <>
      <AccountPageHeader title="Orders" intro="Every order you've placed, newest first." />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard icon="📦" label="Total orders" value={stats.totalOrders.toLocaleString("en-ZA")} />
        <StatCard icon="✨" label="Total stickers" value={stats.totalStickers.toLocaleString("en-ZA")} />
        <StatCard icon="🚚" label="Active orders" value={stats.activeOrders.toLocaleString("en-ZA")} />
      </div>

      <nav aria-label="Filter by status" className="mt-6 flex flex-wrap gap-2">
        <FilterPill href={ordersHref(undefined, 1)} active={!status}>
          All
        </FilterPill>
        {ORDER_STATUS_VALUES.map((s) => (
          <FilterPill key={s} href={ordersHref(s, 1)} active={status === s}>
            {ORDER_STATUS_LABELS[s]}
          </FilterPill>
        ))}
      </nav>

      <div className="mt-4">
        <StepCard icon="🧾" title="All orders">
          {orders.length === 0 ? (
            <EmptyState
              title={status ? `No ${ORDER_STATUS_LABELS[status].toLowerCase()} orders` : "No orders yet"}
              action={
                !status && (
                  <Link href="/stickers" className={`${PRIMARY_BUTTON_CLASSES} inline-block w-auto px-7 text-center`}>
                    Start your first order
                  </Link>
                )
              }
            >
              {status ? "Try another filter, or view all your orders." : "Once you place an order, it'll show up here."}
            </EmptyState>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-grape/20 text-xs font-black uppercase tracking-wide text-quiet">
                    <th scope="col" className="px-5 py-3">Preview</th>
                    <th scope="col" className="px-3 py-3">Order #</th>
                    <th scope="col" className="px-3 py-3">Items</th>
                    <th scope="col" className="px-3 py-3">Date</th>
                    <th scope="col" className="px-3 py-3 text-right">Total</th>
                    <th scope="col" className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    const href = `/account/orders/${order.id}`;
                    return (
                      <tr key={order.id} className="border-b border-grape/10 last:border-0 hover:bg-white/60">
                        <td className="px-5 py-3">
                          {order.items[0] && (
                            <ArtworkThumb url={order.items[0].artworkUrl} extra={order.items.length - 1} />
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <Link href={href} className="font-black whitespace-nowrap text-night hover:text-blaze">
                            {orderNumber(order.id)}
                          </Link>
                        </td>
                        <td className="max-w-[340px] px-3 py-3 text-ink">
                          <ul className="flex flex-col gap-0.5">
                            {order.items.map((item) => (
                              <li key={item.id}>{itemSummary(item)}</li>
                            ))}
                          </ul>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-quiet">{formatOrderDate(order.createdAt)}</td>
                        <td className="px-3 py-3 text-right font-black whitespace-nowrap text-night">
                          {formatCurrency(Number(order.totalPrice))}
                        </td>
                        <td className="px-5 py-3">
                          <StatusPill status={order.status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </StepCard>
      </div>

      {totalCount > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-white/70">
          <p>
            Showing <span className="font-black text-white">{rangeStart}</span>–
            <span className="font-black text-white">{rangeEnd}</span> of{" "}
            <span className="font-black text-white">{totalCount}</span> orders
          </p>
          <div className="flex gap-2">
            <PageLink href={ordersHref(status, page - 1)} disabled={page <= 1}>
              ← Prev
            </PageLink>
            <PageLink href={ordersHref(status, page + 1)} disabled={page >= totalPages}>
              Next →
            </PageLink>
          </div>
        </div>
      )}
    </>
  );
}

function FilterPill({ href, active, children }: { href: string; active: boolean; children: ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={[
        "rounded-full border-2 px-4 py-1.5 text-sm font-black transition-colors",
        active ? "border-blaze bg-blaze text-white" : "border-white/[0.19] text-white/75 hover:border-white/50 hover:text-white",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}

function PageLink({ href, disabled, children }: { href: string; disabled: boolean; children: ReactNode }) {
  const classes = "rounded-full border-2 px-4 py-1.5 font-black";
  if (disabled) {
    return <span className={`${classes} cursor-not-allowed border-white/10 text-white/30`}>{children}</span>;
  }
  return (
    <Link href={href} className={`${classes} border-white/[0.19] text-white hover:border-white/50`}>
      {children}
    </Link>
  );
}

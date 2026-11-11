import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { EmptyState, MetricCard } from "@/components/account/OrderBits";
import { ORDER_TABLE_CARD_CLASSES, OrderRows } from "@/components/account/OrderRows";
import { QuickOrder } from "@/components/account/QuickOrder";
import { requireVerifiedUser } from "@/lib/auth";
import {
  CUSTOMER_ORDERS_PAGE_SIZE,
  ORDER_SEARCH_MAX_LENGTH,
  getCustomerOrderStats,
  getCustomerOrderStatusCounts,
  getLatestCustomerOrder,
  listCustomerOrders,
} from "@/lib/customerOrders";
import { ORDER_STATUS_LABELS, ORDER_STATUS_VALUES } from "@/lib/orderLabels";
import type { OrderStatus } from "@/generated/prisma/client";

export const metadata: Metadata = { title: "Orders · Sticker Quest" };

function isOrderStatus(value: string | undefined): value is OrderStatus {
  return !!value && (ORDER_STATUS_VALUES as string[]).includes(value);
}

function ordersHref(opts: { status?: OrderStatus; q?: string; page?: number }): string {
  const params = new URLSearchParams();
  if (opts.status) params.set("status", opts.status);
  if (opts.q) params.set("q", opts.q);
  if (opts.page && opts.page > 1) params.set("page", String(opts.page));
  const qs = params.toString();
  return `/account/orders${qs ? `?${qs}` : ""}`;
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string; q?: string }>;
}) {
  const user = await requireVerifiedUser("/account/orders");
  const { status: statusParam, page: pageParam, q: qParam } = await searchParams;
  const status = isOrderStatus(statusParam) ? statusParam : undefined;
  const page = Math.max(1, Math.min(1000, Number(pageParam) || 1));
  const q = typeof qParam === "string" ? qParam.trim().slice(0, ORDER_SEARCH_MAX_LENGTH) : "";

  const [stats, counts, { orders, totalCount }, latestOrder] = await Promise.all([
    getCustomerOrderStats(user.id),
    getCustomerOrderStatusCounts(user.id, q),
    listCustomerOrders(user.id, { status, search: q, page }),
    getLatestCustomerOrder(user.id),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / CUSTOMER_ORDERS_PAGE_SIZE));
  const rangeStart = totalCount === 0 ? 0 : (page - 1) * CUSTOMER_ORDERS_PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * CUSTOMER_ORDERS_PAGE_SIZE, totalCount);
  const filtered = !!status || !!q;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="font-headline text-[32px] font-bold leading-tight text-sand">Orders</h1>
          <p className="text-sm text-white/[0.44]">From first proof to your front door. Track every sticker here.</p>
        </div>
        <Link
          href="/stickers"
          className="flex h-[42px] items-center gap-2 rounded-full bg-zap px-4 text-[13px] font-semibold text-night transition-transform hover:-translate-y-px"
        >
          <Image src="/icons/orders/plus.svg" alt="" width={16} height={16} />
          New order
        </Link>
      </div>

      <div className="grid gap-3.5 sm:grid-cols-3">
        <MetricCard
          label="Total Orders"
          value={stats.totalOrders.toLocaleString("en-ZA")}
          note="All time"
          icon="/icons/orders/package.svg"
        />
        <MetricCard
          label="Total Stickers"
          value={stats.totalStickers.toLocaleString("en-ZA")}
          note="Across all orders"
          icon="/icons/orders/layers.svg"
        />
        <MetricCard
          label="Active Orders"
          value={stats.activeOrders.toLocaleString("en-ZA")}
          note="In the making"
          icon="/icons/orders/loader-circle.svg"
          highlight
        />
      </div>

      <section aria-labelledby="order-history-heading" className={ORDER_TABLE_CARD_CLASSES}>
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 pb-4 pt-5">
          <div className="flex flex-col gap-1">
            <h2 id="order-history-heading" className="font-headline text-[22px] font-bold text-sand">
              Your orders
            </h2>
            <p className="text-[13px] text-white/[0.38]">Good things are in the making.</p>
          </div>
          <form
            action="/account/orders"
            method="get"
            role="search"
            className="flex h-[38px] w-full items-center gap-[9px] rounded-full border-[1.5px] border-white/[0.13] bg-white/[0.04] px-3 focus-within:border-white/40 sm:w-[240px]"
          >
            <Image src="/icons/orders/search.svg" alt="" width={16} height={16} />
            {status && <input type="hidden" name="status" value={status} />}
            <input
              type="search"
              name="q"
              defaultValue={q}
              maxLength={ORDER_SEARCH_MAX_LENGTH}
              placeholder="Search by order or design"
              aria-label="Search by order number or design"
              className="min-w-0 flex-1 bg-transparent text-[13px] text-sand outline-none placeholder:text-white/25"
            />
          </form>
        </div>

        <nav aria-label="Filter by status" className="flex flex-wrap gap-2 px-6 pb-4">
          <FilterPill href={ordersHref({ q })} active={!status} count={counts.all}>
            All
          </FilterPill>
          {ORDER_STATUS_VALUES.map((s) => (
            <FilterPill key={s} href={ordersHref({ status: s, q })} active={status === s} count={counts.byStatus[s] ?? 0}>
              {ORDER_STATUS_LABELS[s]}
            </FilterPill>
          ))}
        </nav>

        {orders.length === 0 ? (
          <div className="border-t border-white/[0.06]">
            <EmptyState
              dark
              title={
                q
                  ? "No orders match that search"
                  : status
                    ? `No ${ORDER_STATUS_LABELS[status].toLowerCase()} orders`
                    : "No orders yet"
              }
              action={
                !filtered && (
                  <Link
                    href="/stickers"
                    className="inline-flex h-[42px] items-center rounded-full bg-zap px-6 text-[13px] font-semibold text-night"
                  >
                    Start your first order
                  </Link>
                )
              }
            >
              {filtered ? "Try another filter or search, or view all your orders." : "Once you place an order, it'll show up here."}
            </EmptyState>
          </div>
        ) : (
          <OrderRows orders={orders} />
        )}

        {totalCount > 0 && (
          <div className="flex min-h-[60px] flex-wrap items-center justify-between gap-3 px-6 py-3">
            <p className="text-[13px] text-white/25">
              Showing {rangeStart}–{rangeEnd} of {totalCount.toLocaleString("en-ZA")} {totalCount === 1 ? "order" : "orders"}
            </p>
            <nav aria-label="Pagination" className="flex items-center gap-2">
              <PageButton
                href={ordersHref({ status, q, page: page - 1 })}
                disabled={page <= 1}
                label="Previous page"
                icon="/icons/orders/chevron-left.svg"
              />
              <span
                aria-current="page"
                className="flex size-[30px] items-center justify-center rounded-[6px] bg-zap text-[13px] font-bold text-night"
              >
                {page}
              </span>
              <PageButton
                href={ordersHref({ status, q, page: page + 1 })}
                disabled={page >= totalPages}
                label="Next page"
                icon="/icons/orders/chevron-right.svg"
              />
            </nav>
          </div>
        )}
      </section>

      <QuickOrder latestOrder={latestOrder} />
    </div>
  );
}

function FilterPill({
  href,
  active,
  count,
  children,
}: {
  href: string;
  active: boolean;
  count: number;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={[
        "flex h-8 items-center gap-2 rounded-full px-3 whitespace-nowrap transition-colors",
        active
          ? "bg-zap text-night"
          : "border-[1.5px] border-white/[0.13] bg-white/[0.04] hover:border-white/30",
      ].join(" ")}
    >
      <span className={active ? "text-xs font-semibold" : "text-xs font-medium text-dusk-note"}>{children}</span>
      <span className={active ? "text-[11px]" : "text-[11px] text-white/[0.31]"}>{count}</span>
    </Link>
  );
}

function PageButton({ href, disabled, label, icon }: { href: string; disabled: boolean; label: string; icon: string }) {
  const classes =
    "flex size-[30px] items-center justify-center rounded-[6px] border border-white/[0.08] bg-white/[0.04]";
  const img = <Image src={icon} alt="" width={14} height={14} />;
  if (disabled) {
    return (
      <span aria-disabled="true" aria-label={label} className={`${classes} opacity-40`}>
        {img}
      </span>
    );
  }
  return (
    <Link href={href} aria-label={label} className={`${classes} hover:border-white/30`}>
      {img}
    </Link>
  );
}

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth";
import { STICKER_TYPE_LABELS } from "@/lib/stickerTypeSlug";
import { ORDER_STATUS_LABELS, ORDER_STATUS_VALUES, itemSpecLine, orderNumber } from "@/lib/orderLabels";
import { formatCurrency } from "@/lib/pricingUtils";
import { getOrderStats } from "@/lib/orderStats";
import { QuickStats } from "@/components/admin/QuickStats";
import { OrderStatusSelect } from "@/components/admin/OrderStatusSelect";
import { ArtworkThumb } from "@/components/account/ArtworkThumb";
import {
  AdminIcon,
  AdminPageHeader,
  AdminPagination,
  AdminTabs,
  Avatar,
  CARD_CLASSES,
  EmptyMessage,
  formatAdminDate,
} from "@/components/admin/ui";
import type { OrderStatus } from "@/generated/prisma/client";

const PAGE_SIZE = 20;

function isOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUS_VALUES as string[]).includes(value);
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
  await requireStaff();
  const { status, page: pageParam } = await searchParams;
  const activeStatus = status && isOrderStatus(status) ? status : undefined;
  const page = Math.max(1, Math.min(1000, Number(pageParam) || 1));
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
    <>
      <AdminPageHeader
        title="Orders"
        description="Every order, newest first. Change a status straight from the list, or open an order to upload proofs."
      />

      <QuickStats stats={stats} />

      <section className={`${CARD_CLASSES} mt-6 overflow-hidden`}>
        <AdminTabs
          label="Filter by status"
          tabs={[
            { href: ordersHref(undefined, 1), label: "All", count: stats.totalOrders, active: !activeStatus },
            ...ORDER_STATUS_VALUES.map((s) => ({
              href: ordersHref(s, 1),
              label: ORDER_STATUS_LABELS[s],
              count: stats.statusCounts[s],
              active: activeStatus === s,
            })),
          ]}
        />

        {orders.length === 0 ? (
          <EmptyMessage>
            {activeStatus ? `No orders are ${ORDER_STATUS_LABELS[activeStatus].toLowerCase()} right now.` : "No orders yet."}
          </EmptyMessage>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead>
                <tr className="border-b border-admin-line bg-admin-canvas/60 text-xs font-medium text-admin-muted">
                  <th scope="col" className="px-5 py-3 font-medium">Order</th>
                  <th scope="col" className="px-5 py-3 font-medium">Customer</th>
                  <th scope="col" className="px-5 py-3 font-medium">Items</th>
                  <th scope="col" className="px-5 py-3 text-right font-medium">Qty</th>
                  <th scope="col" className="px-5 py-3 text-right font-medium">Total</th>
                  <th scope="col" className="px-5 py-3 font-medium">Status</th>
                  <th scope="col" className="w-12 px-5 py-3">
                    <span className="sr-only">Open</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-line">
                {orders.map((order) => {
                  const href = `/admin/orders/${order.id}`;
                  const first = order.items[0];
                  const totalQty = order.items.reduce((sum, i) => sum + i.quantity, 0);
                  return (
                    <tr key={order.id} className="transition-colors hover:bg-admin-canvas/60">
                      <td className="px-5 py-3.5 align-middle">
                        <Link href={href} className="flex flex-col gap-0.5">
                          <span className="font-mono text-[13px] font-semibold text-admin-ink">{orderNumber(order.id)}</span>
                          <span className="text-xs text-admin-muted">{formatAdminDate(order.createdAt)}</span>
                        </Link>
                      </td>
                      <td className="px-5 py-3.5 align-middle">
                        <Link href={href} className="flex items-center gap-3">
                          <Avatar name={order.customerName} />
                          <span className="min-w-0">
                            <span className="block max-w-[200px] truncate font-medium text-admin-ink">{order.customerName}</span>
                            <span className="block max-w-[200px] truncate text-xs text-admin-muted">{order.email}</span>
                          </span>
                        </Link>
                      </td>
                      <td className="px-5 py-3.5 align-middle">
                        <Link href={href} className="flex items-center gap-3">
                          <span className="flex shrink-0 -space-x-3">
                            {order.items.slice(0, 3).map((item) => (
                              <ArtworkThumb key={item.id} url={item.artworkUrl} size={40} checker className="ring-2 ring-white" />
                            ))}
                          </span>
                          {first ? (
                            <span className="min-w-0">
                              <span className="block max-w-[240px] truncate font-medium text-admin-ink">
                                {STICKER_TYPE_LABELS[first.stickerType]}
                                {order.items.length > 1 && (
                                  <span className="font-normal text-admin-muted"> + {order.items.length - 1} more</span>
                                )}
                              </span>
                              <span className="block max-w-[240px] truncate text-xs text-admin-muted">{itemSpecLine(first)}</span>
                            </span>
                          ) : (
                            <span className="text-admin-faint">No items</span>
                          )}
                        </Link>
                      </td>
                      <td className="px-5 py-3.5 text-right align-middle tabular-nums text-admin-ink">
                        {totalQty.toLocaleString("en-ZA")}
                      </td>
                      <td className="px-5 py-3.5 text-right align-middle font-medium tabular-nums text-admin-ink">
                        {formatCurrency(Number(order.totalPrice))}
                      </td>
                      <td className="px-5 py-3.5 align-middle">
                        <OrderStatusSelect orderId={order.id} status={order.status} />
                      </td>
                      <td className="px-5 py-3.5 align-middle">
                        <Link
                          href={href}
                          aria-label={`Open order ${orderNumber(order.id)}`}
                          className="flex size-8 items-center justify-center rounded-lg text-admin-faint hover:bg-admin-canvas hover:text-admin-ink"
                        >
                          <AdminIcon name="chevron-right" className="size-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalCount > 0 && (
          <AdminPagination
            start={rangeStart}
            end={rangeEnd}
            total={totalCount}
            noun={totalCount === 1 ? "order" : "orders"}
            prevHref={page > 1 ? ordersHref(activeStatus, page - 1) : undefined}
            nextHref={page < totalPages ? ordersHref(activeStatus, page + 1) : undefined}
          />
        )}
      </section>
    </>
  );
}

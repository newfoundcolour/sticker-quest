import "server-only";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ACTIVE_ORDER_STATUSES } from "@/lib/orderLabels";
import type { OrderStatus, Prisma } from "@/generated/prisma/client";

/**
 * Every query a customer can trigger about orders lives here, and every one
 * is scoped by `userId` — which callers must take from the verified session
 * (requireVerifiedUser), never from the browser. Someone else's order id
 * simply isn't found.
 */

export const CUSTOMER_ORDERS_PAGE_SIZE = 10;

const itemsInOrder = { items: { orderBy: { createdAt: "asc" as const } } };

/** What an order table row needs: the items, plus the proof waiting on the customer ("Review proof"). */
const orderRowInclude = {
  ...itemsInOrder,
  proofs: {
    where: { status: "PENDING" as const },
    orderBy: { version: "desc" as const },
    take: 1,
    select: { id: true },
  },
} satisfies Prisma.OrderInclude;

export type CustomerOrderRow = Prisma.OrderGetPayload<{ include: typeof orderRowInclude }>;

/** Most unshipped orders the Dashboard lists; more than this links to the Orders page. */
export const DASHBOARD_ACTIVE_ORDERS_LIMIT = 20;

export async function getCustomerOrderStats(userId: string) {
  const [totalOrders, stickers, activeOrders] = await Promise.all([
    prisma.order.count({ where: { userId } }),
    prisma.orderItem.aggregate({ _sum: { quantity: true }, where: { order: { userId } } }),
    prisma.order.count({ where: { userId, status: { in: ACTIVE_ORDER_STATUSES } } }),
  ]);
  return { totalOrders, totalStickers: stickers._sum.quantity ?? 0, activeOrders };
}

/** Longest search the Orders page accepts; anything longer is cut. */
export const ORDER_SEARCH_MAX_LENGTH = 60;

/**
 * Matches an order number ("#K3J9X2QZ" is the end of the id) or a design's
 * artwork filename. Always combined with the userId filter by callers.
 */
function orderSearchWhere(search: string | undefined): Prisma.OrderWhereInput {
  const q = search?.trim().slice(0, ORDER_SEARCH_MAX_LENGTH);
  if (!q) return {};
  const idPart = q.replace(/^#/, "").toLowerCase();
  return {
    OR: [
      ...(idPart ? [{ id: { contains: idPart } }] : []),
      { items: { some: { artworkFilename: { contains: q, mode: "insensitive" } } } },
    ],
  };
}

/** How many of the customer's orders are in each status (for the filter pills). */
export async function getCustomerOrderStatusCounts(userId: string, search?: string) {
  const rows = await prisma.order.groupBy({
    by: ["status"],
    where: { userId, ...orderSearchWhere(search) },
    _count: { _all: true },
  });
  const counts = Object.fromEntries(rows.map((r) => [r.status, r._count._all])) as Partial<Record<OrderStatus, number>>;
  const all = rows.reduce((sum, r) => sum + r._count._all, 0);
  return { all, byStatus: counts };
}

export async function listCustomerOrders(
  userId: string,
  opts: { status?: OrderStatus; search?: string; page: number },
) {
  const where: Prisma.OrderWhereInput = {
    userId,
    ...(opts.status && { status: opts.status }),
    ...orderSearchWhere(opts.search),
  };
  const [orders, totalCount] = await Promise.all([
    prisma.order.findMany({
      where,
      include: orderRowInclude,
      orderBy: { createdAt: "desc" },
      skip: (opts.page - 1) * CUSTOMER_ORDERS_PAGE_SIZE,
      take: CUSTOMER_ORDERS_PAGE_SIZE,
    }),
    prisma.order.count({ where }),
  ]);
  return { orders, totalCount };
}

/** Orders that haven't shipped yet, newest first, with how many there are in total. */
export async function getActiveCustomerOrders(userId: string, take = DASHBOARD_ACTIVE_ORDERS_LIMIT) {
  const where = { userId, status: { in: ACTIVE_ORDER_STATUSES } };
  const [orders, totalCount] = await Promise.all([
    prisma.order.findMany({ where, include: orderRowInclude, orderBy: { createdAt: "desc" }, take }),
    prisma.order.count({ where }),
  ]);
  return { orders, totalCount };
}

export async function getLatestCustomerOrder(userId: string) {
  return prisma.order.findFirst({
    where: { userId },
    include: itemsInOrder,
    orderBy: { createdAt: "desc" },
  });
}

/** One of the customer's orders, or a 404 — including when it belongs to someone else. */
export async function getCustomerOrderOr404(userId: string, orderId: string) {
  if (typeof orderId !== "string" || orderId.length > 64) notFound();
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    include: itemsInOrder,
  });
  if (!order) notFound();
  return order;
}

/** One line item from one of the customer's own orders (for reorder), or null. */
export async function findCustomerOrderItem(userId: string, orderItemId: string) {
  if (typeof orderItemId !== "string" || orderItemId.length > 64) return null;
  return prisma.orderItem.findFirst({
    where: { id: orderItemId, order: { userId } },
    include: { order: { select: { id: true, createdAt: true } } },
  });
}

/** Recent orders for the Reorder page. */
export async function listReorderableOrders(userId: string, take = 20) {
  return prisma.order.findMany({
    where: { userId },
    include: itemsInOrder,
    orderBy: { createdAt: "desc" },
    take,
  });
}

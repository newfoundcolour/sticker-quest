import "server-only";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ACTIVE_ORDER_STATUSES } from "@/lib/orderLabels";
import type { OrderStatus } from "@/generated/prisma/client";

/**
 * Every query a customer can trigger about orders lives here, and every one
 * is scoped by `userId` — which callers must take from the verified session
 * (requireVerifiedUser), never from the browser. Someone else's order id
 * simply isn't found.
 */

export const CUSTOMER_ORDERS_PAGE_SIZE = 10;

const itemsInOrder = { items: { orderBy: { createdAt: "asc" as const } } };

export async function getCustomerOrderStats(userId: string) {
  const [totalOrders, stickers, activeOrders] = await Promise.all([
    prisma.order.count({ where: { userId } }),
    prisma.orderItem.aggregate({ _sum: { quantity: true }, where: { order: { userId } } }),
    prisma.order.count({ where: { userId, status: { in: ACTIVE_ORDER_STATUSES } } }),
  ]);
  return { totalOrders, totalStickers: stickers._sum.quantity ?? 0, activeOrders };
}

export async function listCustomerOrders(userId: string, opts: { status?: OrderStatus; page: number }) {
  const where = { userId, ...(opts.status && { status: opts.status }) };
  const [orders, totalCount] = await Promise.all([
    prisma.order.findMany({
      where,
      include: itemsInOrder,
      orderBy: { createdAt: "desc" },
      skip: (opts.page - 1) * CUSTOMER_ORDERS_PAGE_SIZE,
      take: CUSTOMER_ORDERS_PAGE_SIZE,
    }),
    prisma.order.count({ where }),
  ]);
  return { orders, totalCount };
}

export async function getActiveCustomerOrders(userId: string, take = 5) {
  return prisma.order.findMany({
    where: { userId, status: { in: ACTIVE_ORDER_STATUSES } },
    include: itemsInOrder,
    orderBy: { createdAt: "desc" },
    take,
  });
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

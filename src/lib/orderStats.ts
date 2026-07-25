import { prisma } from "@/lib/prisma";
import type { OrderStatus } from "@/generated/prisma/client";

export type OrderStats = {
  totalOrders: number;
  awaitingProof: number;
  approved: number;
  printing: number;
  shippedToday: number;
  shippedTodayTrendPercent: number | null;
  revenueToday: number;
  revenueTodayTrendPercent: number | null;
  averageOrderValue: number;
};

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** % change from `previous` to `current` — null when there's no baseline to compare against. */
function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

/**
 * Powers the /admin/orders "Quick Stats" row (see DESIGN.md — Admin Dashboard
 * UI Inspiration). Day boundaries use the server's local time, which is fine
 * for an internal glance-at-shop-health tool but not meant to model SAST
 * precisely.
 */
export async function getOrderStats(): Promise<OrderStats> {
  const todayStart = startOfDay(new Date());
  const tomorrowStart = addDays(todayStart, 1);
  const yesterdayStart = addDays(todayStart, -1);

  const [statusCounts, overall, revenueToday, revenueYesterday, shippedToday, shippedYesterday] =
    await Promise.all([
      prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.order.aggregate({ _count: { _all: true }, _avg: { totalPrice: true } }),
      prisma.order.aggregate({
        _sum: { totalPrice: true },
        where: { createdAt: { gte: todayStart, lt: tomorrowStart } },
      }),
      prisma.order.aggregate({
        _sum: { totalPrice: true },
        where: { createdAt: { gte: yesterdayStart, lt: todayStart } },
      }),
      prisma.order.count({
        where: { status: "SHIPPED", updatedAt: { gte: todayStart, lt: tomorrowStart } },
      }),
      prisma.order.count({
        where: { status: "SHIPPED", updatedAt: { gte: yesterdayStart, lt: todayStart } },
      }),
    ]);

  const countByStatus = Object.fromEntries(
    statusCounts.map((s) => [s.status, s._count._all]),
  ) as Partial<Record<OrderStatus, number>>;

  const revenueTodayAmount = Number(revenueToday._sum.totalPrice ?? 0);
  const revenueYesterdayAmount = Number(revenueYesterday._sum.totalPrice ?? 0);

  return {
    totalOrders: overall._count._all,
    awaitingProof: countByStatus.AWAITING_PROOF ?? 0,
    approved: countByStatus.APPROVED ?? 0,
    printing: countByStatus.PRINTING ?? 0,
    shippedToday,
    shippedTodayTrendPercent: percentChange(shippedToday, shippedYesterday),
    revenueToday: revenueTodayAmount,
    revenueTodayTrendPercent: percentChange(revenueTodayAmount, revenueYesterdayAmount),
    averageOrderValue: Number(overall._avg.totalPrice ?? 0),
  };
}

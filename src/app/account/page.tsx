import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { FormMessage } from "@/components/auth/fields";
import { EmptyState } from "@/components/account/OrderBits";
import { ORDER_TABLE_CARD_CLASSES, OrderRows } from "@/components/account/OrderRows";
import { prisma } from "@/lib/prisma";
import { requireVerifiedUser } from "@/lib/auth";
import { QuickOrder } from "@/components/account/QuickOrder";
import { getActiveCustomerOrders, getLatestCustomerOrder } from "@/lib/customerOrders";

export const metadata: Metadata = { title: "Dashboard · Sticker Quest" };

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ password?: string }> }) {
  const user = await requireVerifiedUser("/account");
  const { password } = await searchParams;

  const [profile, active, latestOrder] = await Promise.all([
    prisma.profile.findUnique({ where: { id: user.id }, select: { firstName: true } }),
    getActiveCustomerOrders(user.id),
    getLatestCustomerOrder(user.id),
  ]);
  const { orders, totalCount } = active;
  const hasOrders = !!latestOrder;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-headline text-[32px] font-bold leading-tight text-sand">
          Hey {profile?.firstName || "there"}! 👋
        </h1>
        <p className="text-sm text-white/[0.44]">Here&apos;s where your stickers are at.</p>
      </div>

      {password === "updated" && (
        <FormMessage tone="success">Your password is updated, and any other devices have been signed out.</FormMessage>
      )}

      <section aria-labelledby="active-orders-heading" className={ORDER_TABLE_CARD_CLASSES}>
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 pb-4 pt-5">
          <div className="flex flex-col gap-1">
            <h2 id="active-orders-heading" className="font-headline text-[22px] font-bold text-sand">
              Active orders
            </h2>
            <p className="text-[13px] text-white/[0.38]">
              {totalCount > 0
                ? `${totalCount.toLocaleString("en-ZA")} on the go. Everything that hasn't shipped yet.`
                : "Everything that hasn't shipped yet."}
            </p>
          </div>
          {hasOrders && (
            <Link
              href="/account/orders"
              className="flex items-center gap-[5px] text-[13px] font-medium whitespace-nowrap text-grape hover:text-lilac"
            >
              All orders
              <Image src="/icons/orders/chevron-right-grape.svg" alt="" width={14} height={14} />
            </Link>
          )}
        </div>

        {orders.length === 0 ? (
          <div className="border-t border-white/[0.06]">
            <EmptyState
              dark
              title={hasOrders ? "Nothing in the works right now" : "Your quest starts here"}
              action={
                <Link
                  href="/stickers"
                  className="inline-flex h-[42px] items-center rounded-full bg-zap px-6 text-[13px] font-semibold text-night"
                >
                  Make some stickers
                </Link>
              }
            >
              {hasOrders
                ? "Every order so far has shipped. Ready for round two?"
                : "No orders yet. Pick a sticker type, upload your art and we'll take it from there."}
            </EmptyState>
          </div>
        ) : (
          <>
            <div className="border-t border-white/[0.06]">
              <OrderRows orders={orders} />
            </div>
            {totalCount > orders.length && (
              <p className="px-6 py-4 text-[13px] text-white/25">
                Showing the latest {orders.length} of {totalCount.toLocaleString("en-ZA")}.{" "}
                <Link href="/account/orders" className="text-grape hover:text-lilac">
                  See them all on the Orders page
                </Link>
              </p>
            )}
          </>
        )}
      </section>

      <QuickOrder latestOrder={latestOrder} />
    </div>
  );
}

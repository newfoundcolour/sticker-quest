import type { Metadata } from "next";
import Link from "next/link";
import { StepCard } from "@/components/configurator/StepCard";
import { StickerTypeImage } from "@/components/StickerTypeImage";
import { FormMessage, PRIMARY_BUTTON_CLASSES } from "@/components/auth/fields";
import { AccountPageHeader } from "@/components/account/AccountPageHeader";
import { ArtworkThumb } from "@/components/account/ArtworkThumb";
import { EmptyState, OrderProgress, StatusPill, formatOrderDate } from "@/components/account/OrderBits";
import { prisma } from "@/lib/prisma";
import { requireVerifiedUser } from "@/lib/auth";
import { getActiveCustomerOrders, getLatestCustomerOrder } from "@/lib/customerOrders";
import { itemSummary, orderNumber } from "@/lib/orderLabels";
import { reorderHref } from "@/lib/reorder";
import { STICKER_TYPE_DESCRIPTIONS, STICKER_TYPE_GROUPS, STICKER_TYPE_LABELS, STICKER_TYPE_SLUGS } from "@/lib/stickerTypeSlug";

export const metadata: Metadata = { title: "Dashboard · Sticker Quest" };

const QUICK_CARD_CLASSES =
  "group flex items-center gap-3 rounded-[20px] border-[1.5px] bg-dusk p-4 text-left transition-[translate,border-color] duration-150 hover:border-zap motion-safe:hover:-translate-y-0.5";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ password?: string }> }) {
  const user = await requireVerifiedUser("/account");
  const { password } = await searchParams;

  const [profile, activeOrders, latestOrder] = await Promise.all([
    prisma.profile.findUnique({ where: { id: user.id }, select: { firstName: true } }),
    getActiveCustomerOrders(user.id),
    getLatestCustomerOrder(user.id),
  ]);

  const latestItem = latestOrder?.items[0];
  // Single-item orders reorder straight into the configurator; bigger ones go to the Reorder page.
  const lastOrderHref =
    latestOrder && latestOrder.items.length === 1 && latestItem ? reorderHref(latestItem) : latestOrder ? "/account/reorder" : null;

  return (
    <>
      <AccountPageHeader
        title={`Hey ${profile?.firstName || "there"}! 👋`}
        intro="Here's where your stickers are at, and a shortcut to your next batch."
      />

      <div className="flex flex-col gap-8">
        {password === "updated" && (
          <FormMessage tone="success">Your password is updated, and any other devices have been signed out.</FormMessage>
        )}

        <StepCard icon="🚚" title="Active orders" description={activeOrders.length > 0 ? `${activeOrders.length} on the go` : undefined}>
          {activeOrders.length === 0 ? (
            <EmptyState
              title={latestOrder ? "Nothing in the works right now" : "Your quest starts here"}
              action={
                <Link href="/stickers" className={`${PRIMARY_BUTTON_CLASSES} inline-block w-auto px-7 text-center`}>
                  Make some stickers
                </Link>
              }
            >
              {latestOrder
                ? "Every order so far has shipped. Ready for round two?"
                : "No orders yet. Pick a sticker type, upload your art and we'll take it from there."}
            </EmptyState>
          ) : (
            <ul className="divide-y divide-grape/20">
              {activeOrders.map((order) => (
                <li key={order.id} className="flex flex-col gap-4 p-5 sm:p-6">
                  <div className="flex flex-wrap items-center gap-3">
                    {order.items[0] && <ArtworkThumb url={order.items[0].artworkUrl} extra={order.items.length - 1} />}
                    <div className="min-w-0 flex-1">
                      <Link href={`/account/orders/${order.id}`} className="font-black text-night hover:text-blaze">
                        Order {orderNumber(order.id)}
                      </Link>
                      <p className="truncate text-sm text-quiet">
                        {order.items[0] ? itemSummary(order.items[0]) : ""}
                        {order.items.length > 1 && ` + ${order.items.length - 1} more`}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <StatusPill status={order.status} />
                      <span className="text-xs text-quiet">Placed {formatOrderDate(order.createdAt)}</span>
                    </div>
                  </div>
                  <OrderProgress status={order.status} />
                </li>
              ))}
            </ul>
          )}
        </StepCard>

        <section aria-labelledby="quick-order">
          <h2 id="quick-order" className="mb-3 text-lg font-black text-white">
            Quick order
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {lastOrderHref && latestOrder && (
              <li>
                <Link href={lastOrderHref} className={`${QUICK_CARD_CLASSES} border-blaze`}>
                  {latestItem && <ArtworkThumb url={latestItem.artworkUrl} size={56} />}
                  <span className="min-w-0">
                    <span className="block font-black text-white">Reorder your last order</span>
                    <span className="block truncate text-xs text-white/60">
                      {orderNumber(latestOrder.id)} · priced at today&apos;s rates
                    </span>
                  </span>
                </Link>
              </li>
            )}
            {STICKER_TYPE_GROUPS.flatMap((g) => g.types).map((type) => (
              <li key={type}>
                <Link href={`/configure/${STICKER_TYPE_SLUGS[type]}`} className={`${QUICK_CARD_CLASSES} border-dusk-line`}>
                  <StickerTypeImage type={type} className="size-14 shrink-0 text-white" size={112} />
                  <span className="min-w-0">
                    <span className="block font-black text-white">{STICKER_TYPE_LABELS[type]}</span>
                    <span className="line-clamp-2 block text-xs text-white/60">{STICKER_TYPE_DESCRIPTIONS[type]}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}

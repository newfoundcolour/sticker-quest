import type { Metadata } from "next";
import Link from "next/link";
import { StepCard } from "@/components/configurator/StepCard";
import { PRIMARY_BUTTON_CLASSES } from "@/components/auth/fields";
import { AccountPageHeader } from "@/components/account/AccountPageHeader";
import { ArtworkThumb } from "@/components/account/ArtworkThumb";
import { EmptyState, formatOrderDate } from "@/components/account/OrderBits";
import { requireVerifiedUser } from "@/lib/auth";
import { listReorderableOrders } from "@/lib/customerOrders";
import { itemSummary, orderNumber } from "@/lib/orderLabels";
import { reorderHref } from "@/lib/reorder";

export const metadata: Metadata = { title: "Reorder · Sticker Quest" };

export default async function ReorderPage() {
  const user = await requireVerifiedUser("/account/reorder");
  const orders = await listReorderableOrders(user.id);

  return (
    <>
      <AccountPageHeader
        title="Reorder"
        intro="Same stickers, same artwork, two clicks. You can tweak anything before adding to cart, and prices are always today's."
      />

      {orders.length === 0 ? (
        <StepCard icon="🔁" title="Nothing to reorder yet">
          <EmptyState
            title="Your favourites will live here"
            action={
              <Link href="/stickers" className={`${PRIMARY_BUTTON_CLASSES} inline-block w-auto px-7 text-center`}>
                Make some stickers
              </Link>
            }
          >
            Once you&apos;ve placed an order, you can reorder it from here in a click.
          </EmptyState>
        </StepCard>
      ) : (
        <ul className="grid gap-4 xl:grid-cols-2">
          {orders.map((order) => (
            <li key={order.id}>
              <StepCard
                icon="📦"
                title={`Order ${orderNumber(order.id)}`}
                description={formatOrderDate(order.createdAt)}
                className="h-full"
              >
                <ul className="divide-y divide-grape/20">
                  {order.items.map((item) => {
                    const href = reorderHref(item);
                    return (
                      <li key={item.id} className="flex items-center gap-4 p-4 sm:p-5">
                        <ArtworkThumb url={item.artworkUrl} size={64} />
                        <p className="min-w-0 flex-1 text-sm text-ink">{itemSummary(item)}</p>
                        {href ? (
                          <Link
                            href={href}
                            className="shrink-0 rounded-full border-2 border-night bg-blaze px-4 py-2 text-xs font-black uppercase text-white shadow-pop-blaze transition-[translate] duration-150 motion-safe:hover:-translate-y-0.5"
                          >
                            Reorder
                          </Link>
                        ) : (
                          <span className="shrink-0 text-xs font-bold text-quiet">No longer available</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </StepCard>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import {
  ACCOUNT_ACTION_CLASSES,
  AccountCard,
  CARD_LIST_CLASSES,
  ROW_ACTION_CLASSES,
} from "@/components/account/AccountCard";
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
        <AccountCard title="Nothing to reorder yet">
          <div className="border-t border-white/[0.06]">
            <EmptyState
              dark
              title="Your favourites will live here"
              action={
                <Link href="/stickers" className={ACCOUNT_ACTION_CLASSES}>
                  Make some stickers
                </Link>
              }
            >
              Once you&apos;ve placed an order, you can reorder it from here in a click.
            </EmptyState>
          </div>
        </AccountCard>
      ) : (
        <ul className="grid gap-4 xl:grid-cols-2">
          {orders.map((order) => (
            <li key={order.id}>
              <AccountCard
                title={`Order ${orderNumber(order.id)}`}
                description={formatOrderDate(order.createdAt)}
                className="h-full"
              >
                <ul className={CARD_LIST_CLASSES}>
                  {order.items.map((item) => {
                    const href = reorderHref(item);
                    return (
                      <li key={item.id} className="flex items-center gap-4 px-6 py-4">
                        <ArtworkThumb url={item.artworkUrl} size={44} />
                        <p className="min-w-0 flex-1 text-[13px] text-dusk-note">{itemSummary(item)}</p>
                        {href ? (
                          <Link href={href} className={ROW_ACTION_CLASSES}>
                            Reorder
                          </Link>
                        ) : (
                          <span className="shrink-0 text-xs text-white/[0.31]">No longer available</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </AccountCard>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

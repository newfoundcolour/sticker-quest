import Link from "next/link";
import { StickerTypeImage } from "@/components/StickerTypeImage";
import { StickerPreview } from "@/components/account/StickerPreview";
import { orderNumber } from "@/lib/orderLabels";
import { reorderHref } from "@/lib/reorder";
import { STICKER_TYPE_DESCRIPTIONS, STICKER_TYPE_GROUPS, STICKER_TYPE_LABELS, STICKER_TYPE_SLUGS } from "@/lib/stickerTypeSlug";
import type { Order, OrderItem } from "@/generated/prisma/client";

const QUICK_CARD_CLASSES =
  "group flex items-center gap-3 rounded-[20px] border-[1.5px] bg-dusk p-4 text-left transition-[translate,border-color] duration-150 hover:border-zap motion-safe:hover:-translate-y-0.5";

/** "Reorder your last order" plus a card per sticker type, at the bottom of the Dashboard and Orders page. */
export function QuickOrder({ latestOrder }: { latestOrder: (Order & { items: OrderItem[] }) | null }) {
  const latestItem = latestOrder?.items[0];
  // Single-item orders reorder straight into the configurator; bigger ones go to the Reorder page.
  const lastOrderHref =
    latestOrder && latestOrder.items.length === 1 && latestItem ? reorderHref(latestItem) : latestOrder ? "/account/reorder" : null;

  return (
    <section aria-labelledby="quick-order">
      <h2 id="quick-order" className="mb-3 font-headline text-[22px] font-bold text-sand">
        Quick order
      </h2>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {lastOrderHref && latestOrder && (
          <li>
            <Link href={lastOrderHref} className={`${QUICK_CARD_CLASSES} border-blaze`}>
              {latestItem && <StickerPreview url={latestItem.artworkUrl} cutType={latestItem.cutType} size={56} />}
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
  );
}

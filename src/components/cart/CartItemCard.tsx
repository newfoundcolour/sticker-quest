import Image from "next/image";
import Link from "next/link";
import { removeFromCartAction } from "@/app/actions/cart";
import type { CartItem } from "@/lib/cart";
import type { PricedCartItem } from "@/lib/cartPricing";
import { itemChoices } from "@/lib/itemChoices";
import { productName, unitNoun } from "@/lib/orderLabels";
import { formatCurrency } from "@/lib/pricingUtils";
import { STICKER_TYPE_SLUGS } from "@/lib/stickerTypeSlug";
import { ArtworkPreview } from "./ArtworkPreview";
import { QuantityPicker } from "./QuantityPicker";

const CARD_CLASSES = "rounded-[20px] border-[1.5px] border-grape bg-sand";

/** "Vinyl Stickers" → "Vinyl stickers", as the cart headings read. */
function headingName(name: string): string {
  return name.charAt(0) + name.slice(1).toLowerCase();
}

function TrashButton({ itemId, label }: { itemId: string; label: string }) {
  return (
    <form action={removeFromCartAction.bind(null, itemId)}>
      <button
        type="submit"
        aria-label={`Remove ${label} from your cart`}
        title="Remove"
        className="flex size-7 items-center justify-center rounded-md border border-sand-line bg-sand transition-colors hover:border-blaze hover:bg-blaze/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grape"
      >
        <Image src="/icons/trash.svg" alt="" width={14} height={14} />
      </button>
    </form>
  );
}

/** One configured sticker in the cart: artwork, every choice made, quantity and line total. */
export function CartItemCard({ item }: { item: PricedCartItem }) {
  const name = headingName(productName(item.stickerType));

  return (
    <article aria-label={name} className={CARD_CLASSES}>
      <div className="flex flex-wrap items-start gap-x-5 gap-y-4 p-4 sm:p-5">
        <ArtworkPreview url={item.artworkUrl} filename={item.artworkFilename} />

        <div className="flex min-w-[180px] flex-1 flex-col gap-4">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="font-headline text-xl font-bold text-grape">{name}</h2>
            <Link
              href={`/configure/${STICKER_TYPE_SLUGS[item.stickerType]}?edit=${encodeURIComponent(item.id)}`}
              className="text-xs font-bold text-stone underline underline-offset-2 transition-colors hover:text-grape"
            >
              Edit<span className="sr-only"> {name}</span>
            </Link>
          </div>

          {/* Every question the configurator asked for this type, and the answer. */}
          <dl className="grid grid-cols-[max-content_1fr] items-baseline gap-x-3 gap-y-2">
            {itemChoices(item).map((choice) => (
              <div key={choice.label} className="contents">
                <dt className="text-[11px] font-bold text-stone">{choice.label}</dt>
                <dd className="flex flex-wrap items-baseline gap-x-2 text-sm font-extrabold text-night">
                  {choice.value}
                  {choice.detail && (
                    <span className="text-[11px] font-normal leading-[1.3] text-stone">{choice.detail}</span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="flex w-full items-start justify-between gap-5 border-t border-sand-line pt-4 md:w-auto md:border-0 md:pt-0">
          <QuantityPicker itemId={item.id} quantity={item.quantity} unit={unitNoun(item.stickerType, 2)} />
          <div className="flex flex-col items-end gap-1.5 md:items-start">
            <div className="flex items-center gap-2">
              <p className="text-2xl font-black text-night tabular-nums">{formatCurrency(item.totalPrice)}</p>
              <TrashButton itemId={item.id} label={name} />
            </div>
            {item.discountPercent > 0 && (
              <p className="text-sm font-bold text-orchid">{item.discountPercent}% off</p>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

/** A line whose type was discontinued or lost its pricing: it can't be ordered, only removed. */
export function UnavailableItemCard({ item }: { item: CartItem }) {
  const name = headingName(productName(item.stickerType));
  return (
    <article aria-label={name} className={CARD_CLASSES}>
      <div className="flex items-start justify-between gap-4 p-4 sm:p-5">
        <div className="flex min-w-0 flex-col gap-1.5">
          <h2 className="font-headline text-xl font-bold text-grape">
            <span aria-hidden>⚠️ </span>
            {name}
          </h2>
          <p className="max-w-prose text-sm text-night">
            <span className="font-black">This one can&apos;t be ordered any more,</span> so it&apos;s been
            left out of your total. Remove it to carry on to checkout.
          </p>
          <p className="truncate text-[11px] text-stone">{item.artworkFilename}</p>
        </div>
        <TrashButton itemId={item.id} label={name} />
      </div>
    </article>
  );
}

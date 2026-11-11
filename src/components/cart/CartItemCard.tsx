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

/** The cart's dark card (Figma "Item row", "Discount card", "Order summary"). */
export const CART_CARD_CLASSES = "rounded-[20px] bg-dusk shadow-[0_4px_8px_0_rgb(0_0_0/0.25)]";

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
        className="flex size-7 items-center justify-center rounded-md transition-colors hover:bg-blaze/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zap"
      >
        <Image src="/icons/trash.svg" alt="" width={20} height={19} />
      </button>
    </form>
  );
}

/** One configured sticker in the cart: artwork, every choice made, quantity and line total. */
export function CartItemCard({ item }: { item: PricedCartItem }) {
  const name = headingName(productName(item.stickerType));

  return (
    <article aria-label={name} className={CART_CARD_CLASSES}>
      <div className="flex flex-wrap items-start gap-x-5 gap-y-4 p-5">
        <ArtworkPreview url={item.artworkUrl} filename={item.artworkFilename} />

        <div className="flex min-w-[180px] flex-1 flex-col gap-4">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="font-headline text-xl font-bold text-sand">{name}</h2>
            <Link
              href={`/configure/${STICKER_TYPE_SLUGS[item.stickerType]}?edit=${encodeURIComponent(item.id)}`}
              className="text-xs font-bold text-dusk-note underline underline-offset-2 transition-colors hover:text-zap"
            >
              Edit<span className="sr-only"> {name}</span>
            </Link>
          </div>

          {/* Every question the configurator asked for this type, and the answer. The design
              shows answers only, so the question is for screen readers — except yes/no
              answers, which read as "Laminated  No" since "No" alone means nothing. */}
          <dl className="flex flex-col gap-2">
            {itemChoices(item).map((choice) => {
              const yesNo = choice.value === "Yes" || choice.value === "No";
              return (
                <div key={choice.label} className="flex flex-wrap items-baseline gap-x-2">
                  <dt className={yesNo ? "text-sm font-extrabold text-sand" : "sr-only"}>{choice.label}</dt>
                  <dd className={yesNo ? "text-[11px] leading-[1.3] text-dusk-note" : "text-sm font-extrabold text-sand"}>
                    {choice.value}
                  </dd>
                  {choice.detail && <dd className="text-[11px] leading-[1.3] text-dusk-note">{choice.detail}</dd>}
                </div>
              );
            })}
          </dl>
        </div>

        <div className="flex w-full items-start justify-between gap-5 border-t border-dusk-line pt-4 md:w-auto md:border-0 md:pt-0">
          <QuantityPicker itemId={item.id} quantity={item.quantity} unit={unitNoun(item.stickerType, 2)} />
          <div className="flex flex-col items-end gap-1.5 md:items-start">
            <div className="flex items-center gap-2">
              <p className="text-2xl font-black text-sand tabular-nums">{formatCurrency(item.totalPrice)}</p>
              <TrashButton itemId={item.id} label={name} />
            </div>
            {item.discountPercent > 0 && <p className="text-sm font-bold text-zap">{item.discountPercent}% off</p>}
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
    <article aria-label={name} className={CART_CARD_CLASSES}>
      <div className="flex items-start justify-between gap-4 p-5">
        <div className="flex min-w-0 flex-col gap-1.5">
          <h2 className="font-headline text-xl font-bold text-sand">
            <span aria-hidden>⚠️ </span>
            {name}
          </h2>
          <p className="max-w-prose text-sm text-dusk-hint">
            <span className="font-black text-sand">This one can&apos;t be ordered any more,</span> so it&apos;s been
            left out of your total. Remove it to carry on to checkout.
          </p>
          <p className="truncate text-[11px] text-dusk-note">{item.artworkFilename}</p>
        </div>
        <TrashButton itemId={item.id} label={name} />
      </div>
    </article>
  );
}

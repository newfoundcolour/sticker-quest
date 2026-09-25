import { removeFromCartAction, updateCartItemQuantityAction } from "@/app/actions/cart";
import { STICKER_TYPE_LABELS } from "@/lib/stickerTypeSlug";
import { CUT_TYPE_LABELS, FINISH_LABELS, SHAPE_LABELS, formatAddOns } from "@/lib/orderLabels";
import { formatCurrency } from "@/lib/pricingUtils";
import { MIN_QUANTITY, formatSizeMm } from "@/lib/pricingUtils";
import type { PricedCartItem } from "@/lib/cartPricing";

/** Shared between /cart (editable) and the /checkout summary (read-only). */
export function CartLineItem({
  item,
  editable,
}: {
  item: PricedCartItem;
  editable: boolean;
}) {
  const addOns = formatAddOns(item);

  return (
    <div className="flex items-start gap-4 rounded-xl border border-ink-navy/10 p-4">
      {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary URL, no next/image remote pattern configured */}
      <img
        src={item.artworkUrl}
        alt=""
        className="h-16 w-16 shrink-0 rounded-lg border border-ink-navy/10 object-cover"
      />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-ink-navy">{STICKER_TYPE_LABELS[item.stickerType]}</p>
        <p className="text-sm text-ink-navy/60">
          {SHAPE_LABELS[item.shape]} · {CUT_TYPE_LABELS[item.cutType]} · {FINISH_LABELS[item.finish]}
        </p>
        <p className="text-sm text-ink-navy/60">
          {formatSizeMm(item.widthCm)} x {formatSizeMm(item.heightCm)}
          {addOns && ` · ${addOns}`}
        </p>
        <p className="mt-1 truncate text-xs text-ink-navy/40">{item.artworkFilename}</p>

        {editable ? (
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <form
              action={updateCartItemQuantityAction.bind(null, item.id)}
              className="flex items-center gap-2"
            >
              <input
                type="number"
                name="quantity"
                defaultValue={item.quantity}
                min={MIN_QUANTITY}
                className="w-28 rounded-lg border border-ink-navy/15 px-2 py-1 font-mono text-sm outline-none focus:border-coral-signal"
              />
              <button
                type="submit"
                className="text-xs font-medium text-ink-navy/60 underline underline-offset-2 hover:text-ink-navy"
              >
                Update
              </button>
            </form>
            <form action={removeFromCartAction.bind(null, item.id)}>
              <button
                type="submit"
                className="text-xs font-medium text-coral-signal underline underline-offset-2 hover:text-coral-signal/80"
              >
                Remove
              </button>
            </form>
          </div>
        ) : (
          <p className="mt-1 font-mono text-sm text-ink-navy/70">
            {item.quantity.toLocaleString("en-ZA")} stickers
          </p>
        )}
      </div>
      <div className="shrink-0 text-right">
        <p className="font-mono text-sm font-semibold text-ink-navy">
          {formatCurrency(item.totalPrice)}
        </p>
        <p className="font-mono text-xs text-ink-navy/50">
          {formatCurrency(item.pricePerUnit)} / sticker
        </p>
      </div>
    </div>
  );
}

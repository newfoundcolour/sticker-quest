import type { PricedCartItem } from "@/lib/cartPricing";
import { designName, productName, unitNoun } from "@/lib/orderLabels";
import { formatCurrency } from "@/lib/pricingUtils";

/** "150 stickers · 20 sheets · 3 unique designs" */
function countLine(items: PricedCartItem[]): string {
  const stickers = items.filter((i) => i.stickerType !== "STICKER_SHEETS").reduce((n, i) => n + i.quantity, 0);
  const sheets = items.filter((i) => i.stickerType === "STICKER_SHEETS").reduce((n, i) => n + i.quantity, 0);
  return [
    stickers > 0 && `${stickers.toLocaleString("en-ZA")} ${unitNoun("VINYL", stickers)}`,
    sheets > 0 && `${sheets.toLocaleString("en-ZA")} ${unitNoun("STICKER_SHEETS", sheets)}`,
    `${items.length} unique ${items.length === 1 ? "design" : "designs"}`,
  ]
    .filter(Boolean)
    .join(" · ");
}

/** "Order Summary" (cart and checkout): one row per design, shipping and the total, with `children` underneath. */
export function OrderSummary({
  items,
  shippingFee,
  total,
  children,
}: {
  items: PricedCartItem[];
  shippingFee: number;
  total: number;
  children?: React.ReactNode;
}) {
  return (
    <section aria-labelledby="order-summary-title" className="rounded-[20px] border-[1.5px] border-grape bg-sand p-5">
      <div className="flex flex-col gap-5">
        <h2 id="order-summary-title" className="font-headline text-[30px] font-bold leading-tight text-night">
          Order Summary
        </h2>

        <ul className="flex flex-col gap-2.5 text-sm">
          {items.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-4">
              <span className="min-w-0 truncate text-stone">
                {designName(item.artworkFilename) ?? productName(item.stickerType)} ·{" "}
                {item.quantity.toLocaleString("en-ZA")}
              </span>
              <span className="shrink-0 font-extrabold text-night tabular-nums">{formatCurrency(item.totalPrice)}</span>
            </li>
          ))}
        </ul>

        <div className="flex items-center justify-between gap-4 border-y border-sand-line py-3">
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-bold text-night">Shipping (Standard)</p>
            <p className="max-w-[190px] text-[11px] leading-[1.4] text-stone">
              We use The Courier Guy on all orders in South Africa.
            </p>
          </div>
          <p className="shrink-0 text-sm font-extrabold text-night tabular-nums">
            {shippingFee > 0 ? formatCurrency(shippingFee) : "Free"}
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between gap-4">
            <div className="flex flex-col gap-0.5">
              <p className="text-[17px] font-extrabold text-night">Total</p>
              <p className="text-[11px] text-stone">Incl. shipping</p>
            </div>
            <p className="text-[34px] font-black leading-none text-night tabular-nums sm:text-[38px]">
              {formatCurrency(total)}
            </p>
          </div>
          <p className="text-[13px] text-stone">{countLine(items)}</p>
        </div>

        {children}
      </div>
    </section>
  );
}

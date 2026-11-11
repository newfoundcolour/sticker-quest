import type { PricedCartItem } from "@/lib/cartPricing";
import { designName, productName } from "@/lib/orderLabels";
import { formatCurrency } from "@/lib/pricingUtils";
import { CART_CARD_CLASSES } from "./CartItemCard";

/** "Order Summary" (cart and checkout): one row per design, any discount, shipping and the total, with `children` underneath. */
export function OrderSummary({
  items,
  discount = null,
  shippingFee,
  total,
  children,
}: {
  items: PricedCartItem[];
  /** A discount code that applies to this cart (from getPricedCart). */
  discount?: { code: string; amount: number } | null;
  shippingFee: number;
  total: number;
  children?: React.ReactNode;
}) {
  return (
    <section aria-labelledby="order-summary-title" className={`${CART_CARD_CLASSES} p-5`}>
      <div className="flex flex-col gap-5">
        <h2 id="order-summary-title" className="font-headline text-[30px] font-bold leading-tight text-sand">
          Order Summary
        </h2>

        <ul className="flex flex-col gap-2.5 text-sm">
          {items.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-4">
              <span className="min-w-0 truncate text-dusk-note">
                {designName(item.artworkFilename) ?? productName(item.stickerType)} ·{" "}
                {item.quantity.toLocaleString("en-ZA")}
              </span>
              <span className="shrink-0 font-extrabold text-sand tabular-nums">{formatCurrency(item.totalPrice)}</span>
            </li>
          ))}
        </ul>

        {discount && (
          <div className="flex items-start justify-between gap-4 text-sm">
            <span className="min-w-0 truncate font-bold text-zap">Discount ({discount.code})</span>
            <span className="shrink-0 font-extrabold text-zap tabular-nums">−{formatCurrency(discount.amount)}</span>
          </div>
        )}

        <div className="flex items-center justify-between gap-4 border-y border-grape py-3">
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-bold text-sand">Shipping (Standard)</p>
            <p className="text-[11px] leading-[1.4] text-dusk-note">Via The Courier Guy.</p>
          </div>
          <p className="shrink-0 text-sm font-extrabold text-sand tabular-nums">
            {shippingFee > 0 ? formatCurrency(shippingFee) : "Free"}
          </p>
        </div>

        <div className="flex items-baseline justify-between gap-4 pb-1.5">
          <div className="flex flex-col gap-0.5">
            <p className="text-[17px] font-extrabold text-sand">Total</p>
            <p className="text-[11px] text-dusk-note">Incl. shipping</p>
          </div>
          <p className="text-[34px] font-black leading-none text-sand tabular-nums sm:text-[38px]">
            {formatCurrency(total)}
          </p>
        </div>

        {children}
      </div>
    </section>
  );
}

import Link from "next/link";
import { getPricedCart } from "@/lib/cartPricing";
import { formatCurrency } from "@/lib/pricingUtils";
import { CartLineItem } from "@/components/cart/CartLineItem";

export default async function CartPage() {
  const { items, unavailableItemIds, subtotal } = await getPricedCart();

  if (items.length === 0 && unavailableItemIds.length === 0) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-3 px-4 py-20 text-center">
        <h1 className="font-display text-3xl font-bold text-ink-navy">Your cart is empty</h1>
        <p className="max-w-sm text-sm text-ink-navy/60">
          Configure a sticker to add it to your cart.
        </p>
        <Link
          href="/"
          className="mt-3 rounded-xl bg-coral-signal px-6 py-3 font-medium text-paper transition-colors hover:bg-coral-signal/90"
        >
          Start your quest
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <h1 className="font-display text-3xl font-bold text-ink-navy">Your cart</h1>

      <div className="mt-6 flex flex-col gap-4">
        {items.map((item) => (
          <CartLineItem key={item.id} item={item} editable />
        ))}
      </div>

      {unavailableItemIds.length > 0 && (
        <p className="mt-4 text-sm text-coral-signal">
          One or more items in your cart are no longer available for order and have been left out
          of your total — remove them to continue.
        </p>
      )}

      {items.length > 0 && (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-ink-navy/10 bg-ink-navy px-6 py-5 text-paper">
          <div>
            <p className="text-sm text-paper/60">Subtotal</p>
            <p className="font-mono text-3xl font-semibold tabular-nums">
              {formatCurrency(subtotal)}
            </p>
          </div>
          <Link
            href="/checkout"
            className="rounded-xl bg-coral-signal px-6 py-3.5 font-medium text-paper transition-colors hover:bg-coral-signal/90"
          >
            Proceed to checkout
          </Link>
        </div>
      )}
    </main>
  );
}

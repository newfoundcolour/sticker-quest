import { redirect } from "next/navigation";
import { getPricedCart } from "@/lib/cartPricing";
import { formatCurrency } from "@/lib/pricingUtils";
import { CartLineItem } from "@/components/cart/CartLineItem";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";

export default async function CheckoutPage() {
  const { items, unavailableItemIds, subtotal } = await getPricedCart();

  if (items.length === 0 && unavailableItemIds.length === 0) {
    redirect("/cart");
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <h1 className="font-display text-3xl font-bold text-ink-navy">Checkout</h1>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
        <section className="rounded-2xl border border-ink-navy/10 bg-white/70 p-6">
          <h2 className="mb-4 font-display text-lg font-semibold text-ink-navy">
            Shipping details
          </h2>
          <CheckoutForm disabled={items.length === 0} />
        </section>

        <aside className="flex flex-col gap-4">
          <h2 className="font-display text-lg font-semibold text-ink-navy">Order summary</h2>

          <div className="flex flex-col gap-3">
            {items.map((item) => (
              <CartLineItem key={item.id} item={item} editable={false} />
            ))}
          </div>

          {unavailableItemIds.length > 0 && (
            <p className="text-sm text-coral-signal">
              Some items in your cart are no longer available and are excluded from this total —
              go back to your cart to remove them before paying.
            </p>
          )}

          <div className="rounded-2xl border border-ink-navy/10 bg-ink-navy px-6 py-5 text-paper">
            <p className="text-sm text-paper/60">Total due</p>
            <p className="font-mono text-3xl font-semibold tabular-nums">
              {formatCurrency(subtotal)}
            </p>
            <p className="mt-2 text-xs text-paper/50">
              Delivery in 3–5 working days once your proof is approved.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/Container";
import { CartItemCard, UnavailableItemCard } from "@/components/cart/CartItemCard";
import { DiscountCard } from "@/components/cart/DiscountCard";
import { CheckoutPanel, type CheckoutStatus } from "@/components/cart/CheckoutPanel";
import { OrderSummary } from "@/components/cart/OrderSummary";
import { EMPTY_DELIVERY_VALUES, type DeliveryValues } from "@/components/checkout/DeliveryFields";
import { ProductCardGrid } from "@/components/home/ProductCards";
import { getSessionUser, isEmailVerified } from "@/lib/auth";
import { getPricedCart } from "@/lib/cartPricing";
import { savedDeliveryValues } from "@/lib/deliveryDefaults";
import { prisma } from "@/lib/prisma";
import { DELIVERY_PROFILE_SELECT, completeDeliveryDetails } from "@/lib/validation/deliveryDetails";

export const metadata: Metadata = { title: "Your cart · Sticker Quest" };

/** Figma "Sticker Quest cart — empty": a centred hero, then the product cards to start from. */
function EmptyCart() {
  return (
    <main className="flex flex-1 flex-col bg-night">
      <Container className="pb-16">
        <div className="flex flex-col items-center gap-8 px-2 py-14 text-center sm:py-20">
          <div className="flex size-[72px] items-center justify-center rounded-full border-2 border-white/[0.19] bg-white/5">
            <Image src="/icons/cart-hero.svg" alt="" width={32} height={32} />
          </div>
          <div className="flex flex-col items-center gap-5">
            <h1 className="font-headline text-[40px] font-bold uppercase leading-none text-white sm:text-[64px]">
              Your cart is empty.
            </h1>
            <p className="text-base leading-normal text-white/55 sm:text-lg">
              Add some stickers to get started on your next quest.
            </p>
          </div>
          <Link
            href="/stickers"
            className="flex items-center gap-2 rounded-full bg-zap px-9 py-[18px] text-lg font-black text-night shadow-[4px_4px_0_0_var(--color-grape)] transition-[translate,box-shadow] duration-150 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-zap motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-[4px_6px_0_0_var(--color-grape)]"
          >
            Get custom stickers <span aria-hidden>→</span>
          </Link>
        </div>

        <section aria-label="Sticker types">
          <ProductCardGrid />
        </section>
      </Container>
    </main>
  );
}

/** Where the customer stands for checkout, and their saved details to prefill the popup. */
async function checkoutStatus(): Promise<{ status: CheckoutStatus; email: string | null; saved: DeliveryValues }> {
  const user = await getSessionUser();
  if (!user) return { status: "guest", email: null, saved: EMPTY_DELIVERY_VALUES };
  const email = user.email ?? null;
  if (!isEmailVerified(user)) return { status: "unverified", email, saved: EMPTY_DELIVERY_VALUES };

  const saved = await savedDeliveryValues(user.id);
  // Ready only when the Profile itself is complete — values prefilled from a past order still need saving.
  const profile = await prisma.profile.findUnique({ where: { id: user.id }, select: DELIVERY_PROFILE_SELECT });
  return { status: completeDeliveryDetails(profile) ? "ready" : "incomplete", email, saved };
}

/** Figma "Sticker Quest cart — populated": sticker cards on the left, discount and order summary on the right. */
export default async function CartPage() {
  const [{ items, unavailableItems, discount, discountProblem, shippingFee, total }, checkout] = await Promise.all([
    getPricedCart(),
    checkoutStatus(),
  ]);

  if (items.length === 0 && unavailableItems.length === 0) {
    return <EmptyCart />;
  }

  return (
    <main className="relative isolate flex flex-1 flex-col bg-night">
      <Container className="pb-16 pt-6 sm:pt-9">
        <h1 className="sr-only">Your cart</h1>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            {items.map((item) => (
              <CartItemCard key={item.id} item={item} />
            ))}
            {unavailableItems.map((item) => (
              <UnavailableItemCard key={item.id} item={item} />
            ))}
            <div className="pt-1">
              <Link
                href="/stickers"
                className="inline-flex h-[52px] items-center gap-2.5 rounded-full border-[1.5px] border-grape bg-well px-6 text-[15px] font-black text-sand transition-colors hover:border-zap focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-zap"
              >
                Add more stickers <span aria-hidden className="text-xl font-normal">+</span>
              </Link>
            </div>
          </div>

          {items.length > 0 && (
            <aside aria-label="Order summary" className="flex w-full flex-col gap-5 lg:sticky lg:top-6 lg:w-[360px] lg:shrink-0">
              <DiscountCard applied={discount} problem={discountProblem} />
              <OrderSummary items={items} discount={discount} shippingFee={shippingFee} total={total}>
                <CheckoutPanel {...checkout} blocked={unavailableItems.length > 0} />
              </OrderSummary>
            </aside>
          )}
        </div>
      </Container>

      {/* Figma "Background gradient": the grape glow in both bottom corners, as on the configurator. */}
      <div aria-hidden="true" className="pointer-events-none sticky bottom-0 -z-10 h-0">
        <div className="page-glow-left absolute bottom-0 left-0 h-[85vh] w-[70%]" />
        <div className="page-glow-right absolute bottom-0 right-0 h-[85vh] w-[70%]" />
      </div>
    </main>
  );
}

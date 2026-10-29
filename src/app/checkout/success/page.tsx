import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/Container";
import { ZAP_BUTTON_CLASSES } from "@/components/buttonStyles";
import { STEP_BADGES } from "@/components/home/HowItWorks";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/pricingUtils";
import { getLastOrderId } from "@/lib/cart";
import { getSessionUser } from "@/lib/auth";
import { designName, productName } from "@/lib/orderLabels";

export const metadata: Metadata = { title: "Order confirmed · Sticker Quest" };

const NEXT_STEPS = [
  {
    title: "We check your artwork",
    body: "A real person preflights every file so it prints crisp.",
  },
  {
    title: "You approve your proof",
    body: "We’ll send it to your email or WhatsApp. Nothing prints until you say yes.",
  },
  {
    title: "Printed and dispatched",
    body: "Out the door the next business day after you approve, with The Courier Guy.",
  },
];

const CARD_CLASSES = "rounded-[20px] border-[1.5px] border-grape bg-sand p-5 sm:p-7";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order: orderId } = await searchParams;
  if (!orderId) notFound();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { orderBy: { createdAt: "asc" } } },
  });
  if (!order) notFound();

  // Only the browser that just placed this order, or its logged-in owner, may see it.
  const isJustPlaced = orderId === (await getLastOrderId());
  const user = isJustPlaced ? null : await getSessionUser();
  if (!isJustPlaced && !(user && order.userId === user.id)) notFound();

  const firstName = order.customerName.split(" ")[0];
  const shippingFee = Number(order.shippingFee);

  return (
    <main className="relative isolate flex flex-1 flex-col bg-night">
      <Container className="pb-16">
        {/* Hero, like the empty cart's. */}
        <div className="flex flex-col items-center gap-6 px-2 pb-12 pt-14 text-center sm:pt-20">
          <div className="flex size-[72px] items-center justify-center rounded-full border-2 border-white/[0.19] bg-white/5">
            <span className="flex size-10 items-center justify-center rounded-full bg-zap">
              <Image src="/icons/check-night.svg" alt="" width={20} height={20} />
            </span>
          </div>
          <div className="flex flex-col items-center gap-4">
            <p className="text-sm font-black uppercase tracking-[0.06em] text-zap">Order confirmed</p>
            <h1 className="max-w-[900px] font-headline text-[40px] font-bold uppercase leading-none text-white sm:text-[64px]">
              Your quest has begun, {firstName}!
            </h1>
            <p className="max-w-xl text-base leading-normal text-white/70 sm:text-lg">
              We&apos;ll check your artwork and send a proof to{" "}
              <span className="font-bold text-white">{order.email}</span> for you to approve before anything is
              printed.
            </p>
          </div>
        </div>

        <div className="mx-auto flex max-w-[1080px] flex-col gap-6 lg:flex-row lg:items-start">
          {/* What happens next — the home page's step badges. */}
          <section aria-labelledby="next-steps-heading" className="min-w-0 flex-1">
            <h2 id="next-steps-heading" className="mb-5 font-headline text-[30px] font-bold uppercase leading-none text-white">
              What happens next.
            </h2>
            <ol className="flex flex-col gap-3">
              {NEXT_STEPS.map((step, i) => (
                <li key={step.title} className="flex items-center gap-5 rounded-[20px] border border-dusk-line bg-dusk p-5">
                  <span aria-hidden="true" className={`${STEP_BADGES[i]} shrink-0`}>
                    {i + 1}
                  </span>
                  <div className="flex flex-col gap-1">
                    <h3 className="text-lg font-black leading-tight text-white">{step.title}</h3>
                    <p className="text-sm leading-normal text-white/70">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* The order itself, in the cart's summary card. */}
          <section aria-labelledby="order-heading" className={`${CARD_CLASSES} w-full lg:w-[400px] lg:shrink-0`}>
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-1">
                <h2 id="order-heading" className="font-headline text-[30px] font-bold leading-tight text-night">
                  Your order
                </h2>
                <p className="break-all text-xs text-stone">
                  Order number <span className="font-bold text-night">{order.id}</span>
                </p>
              </div>

              <ul className="flex flex-col gap-2.5 text-sm">
                {order.items.map((item) => (
                  <li key={item.id} className="flex items-start justify-between gap-4">
                    <span className="min-w-0 text-stone">
                      <span className="block truncate">
                        {designName(item.artworkFilename) ?? productName(item.stickerType)} ·{" "}
                        {item.quantity.toLocaleString("en-ZA")}
                      </span>
                      <span className="text-[11px]">{productName(item.stickerType)}</span>
                    </span>
                    <span className="shrink-0 font-extrabold text-night tabular-nums">
                      {formatCurrency(Number(item.totalPrice))}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="flex flex-col gap-2 border-y border-sand-line py-3 text-sm">
                <div className="flex items-start justify-between gap-4">
                  <span className="font-bold text-night">Shipping</span>
                  <span className="shrink-0 font-extrabold text-night tabular-nums">
                    {shippingFee > 0 ? formatCurrency(shippingFee) : "Free"}
                  </span>
                </div>
                <p className="text-[13px] leading-normal text-stone">
                  To {order.customerName}, {order.shippingAddress}
                </p>
              </div>

              <div className="flex items-baseline justify-between gap-4">
                <p className="text-[17px] font-extrabold text-night">Total</p>
                <p className="text-[34px] font-black leading-none text-night tabular-nums">
                  {formatCurrency(Number(order.totalPrice))}
                </p>
              </div>

              <div className="flex flex-col gap-3">
                {order.userId && (
                  <Link href={`/account/orders/${order.id}`} className={`${ZAP_BUTTON_CLASSES} w-full`}>
                    Track your order <span aria-hidden className="text-xl font-normal">→</span>
                  </Link>
                )}
                <Link
                  href="/stickers"
                  className="text-center text-sm font-bold text-night underline underline-offset-2 hover:text-grape"
                >
                  Order more stickers
                </Link>
              </div>
            </div>
          </section>
        </div>
      </Container>
      <div aria-hidden="true" className="pointer-events-none sticky bottom-0 -z-10 h-0">
        <div className="page-glow-left absolute bottom-0 left-0 h-[85vh] w-[70%]" />
        <div className="page-glow-right absolute bottom-0 right-0 h-[85vh] w-[70%]" />
      </div>
    </main>
  );
}

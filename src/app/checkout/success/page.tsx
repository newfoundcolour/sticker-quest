import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/pricingUtils";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order: orderId } = await searchParams;
  if (!orderId) notFound();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) notFound();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center gap-4 px-4 py-20 text-center">
      <h1 className="font-display text-3xl font-bold text-ink-navy">
        We&apos;ve got your order, {order.customerName.split(" ")[0]}
      </h1>
      <p className="max-w-md text-ink-navy/70">
        We&apos;re preflighting your artwork now — we&apos;ll send a proof to{" "}
        <span className="font-medium text-ink-navy">{order.email}</span> or WhatsApp for you to
        approve before we print. Delivery is 3–5 working days from approval.
      </p>

      <div className="mt-4 w-full rounded-2xl border border-ink-navy/10 bg-white/70 p-6 text-left">
        <div className="flex items-center justify-between border-b border-ink-navy/10 pb-4">
          <span className="text-sm text-ink-navy/60">Order number</span>
          <span className="font-mono text-sm font-medium text-ink-navy">{order.id}</span>
        </div>
        <div className="flex items-center justify-between pt-4">
          <span className="text-sm text-ink-navy/60">
            {order.items.length} item{order.items.length === 1 ? "" : "s"}
          </span>
          <span className="font-mono text-lg font-semibold text-ink-navy">
            {formatCurrency(Number(order.totalPrice))}
          </span>
        </div>
      </div>

      <Link
        href="/"
        className="mt-4 rounded-xl bg-coral-signal px-6 py-3 font-medium text-paper transition-colors hover:bg-coral-signal/90"
      >
        Back to Sticker Quest
      </Link>
    </main>
  );
}

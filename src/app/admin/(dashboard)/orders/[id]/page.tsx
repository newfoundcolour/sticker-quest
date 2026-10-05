import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatSizeMm } from "@/lib/pricingUtils";
import { STICKER_TYPE_LABELS } from "@/lib/stickerTypeSlug";
import {
  ORDER_STATUS_BADGE_CLASSES,
  ORDER_STATUS_LABELS,
  formatAddOns,
  itemSpecLine,
  unitNoun,
} from "@/lib/orderLabels";
import { toArtworkDownloadUrl } from "@/lib/cloudinary";
import { OrderStatusForm } from "@/components/admin/OrderStatusForm";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!order) notFound();

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-10">
      <Link href="/admin/orders" className="text-sm text-ink-navy/60 hover:text-ink-navy">
        ← All orders
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-navy">
            {order.customerName}
          </h1>
          <p className="mt-1 font-mono text-xs text-ink-navy/50">{order.id}</p>
        </div>
        <span
          className={`inline-flex rounded-full px-3 py-1.5 text-sm font-medium ${ORDER_STATUS_BADGE_CLASSES[order.status]}`}
        >
          {ORDER_STATUS_LABELS[order.status]}
        </span>
      </div>

      <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-ink-navy/10 bg-white/70 p-5">
          <h2 className="text-sm font-semibold text-ink-navy/80">Customer</h2>
          <dl className="mt-3 space-y-1.5 text-sm text-ink-navy/70">
            <div>
              <dt className="inline text-ink-navy/50">Email: </dt>
              <dd className="inline">{order.email}</dd>
            </div>
            <div>
              <dt className="inline text-ink-navy/50">Phone: </dt>
              <dd className="inline">{order.phone}</dd>
            </div>
            <div>
              <dt className="inline text-ink-navy/50">Shipping: </dt>
              <dd className="inline">{order.shippingAddress}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-2xl border border-ink-navy/10 bg-white/70 p-5">
          <h2 className="text-sm font-semibold text-ink-navy/80">Order</h2>
          <dl className="mt-3 space-y-1.5 text-sm text-ink-navy/70">
            <div>
              <dt className="inline text-ink-navy/50">Placed: </dt>
              <dd className="inline">{order.createdAt.toLocaleString("en-ZA")}</dd>
            </div>
            <div>
              <dt className="inline text-ink-navy/50">Total: </dt>
              <dd className="inline font-mono">{formatCurrency(Number(order.totalPrice))}</dd>
            </div>
            {order.notes && (
              <div>
                <dt className="inline text-ink-navy/50">Notes: </dt>
                <dd className="inline">{order.notes}</dd>
              </div>
            )}
          </dl>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-ink-navy/80">
          {order.items.length} item{order.items.length === 1 ? "" : "s"}
        </h2>
        <div className="mt-3 flex flex-col gap-4">
          {order.items.map((item) => {
            const addOns = formatAddOns(item);
            return (
              <div
                key={item.id}
                className="flex flex-col gap-4 rounded-2xl border border-ink-navy/10 bg-white/70 p-5 sm:flex-row"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary URL, no next/image remote pattern configured */}
                <img
                  src={item.artworkUrl}
                  alt=""
                  className="h-32 w-32 shrink-0 rounded-lg border border-ink-navy/10 object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-ink-navy">
                    {STICKER_TYPE_LABELS[item.stickerType]}
                  </p>
                  <p className="mt-1 text-sm text-ink-navy/60">
                    {itemSpecLine(item)}
                  </p>
                  <p className="text-sm text-ink-navy/60">
                    {formatSizeMm(Number(item.widthCm))} x {formatSizeMm(Number(item.heightCm))}
                    {addOns && ` · ${addOns}`}
                  </p>
                  <p className="mt-1 text-sm text-ink-navy/60">
                    {item.quantity.toLocaleString("en-ZA")} {unitNoun(item.stickerType, item.quantity)} ·{" "}
                    <span className="font-mono">{formatCurrency(Number(item.pricePerUnit))}</span>{" "}
                    each
                  </p>
                  {item.artworkFilename && (
                    <p className="mt-1 truncate text-xs text-ink-navy/40">
                      {item.artworkFilename}
                    </p>
                  )}
                  <a
                    href={toArtworkDownloadUrl(item.artworkUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-xs font-medium text-coral-signal underline underline-offset-2 hover:text-coral-signal/80"
                  >
                    Download artwork
                  </a>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-mono text-sm font-semibold text-ink-navy">
                    {formatCurrency(Number(item.totalPrice))}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-ink-navy/10 bg-white/70 p-5">
        <h2 className="text-sm font-semibold text-ink-navy/80">Fulfilment</h2>
        <div className="mt-3">
          <OrderStatusForm
            orderId={order.id}
            status={order.status}
            trackingNumber={order.trackingNumber}
          />
        </div>
      </section>
    </main>
  );
}

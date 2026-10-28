import type { Metadata } from "next";
import Link from "next/link";
import { StepCard } from "@/components/configurator/StepCard";
import { AccountPageHeader } from "@/components/account/AccountPageHeader";
import { ArtworkThumb } from "@/components/account/ArtworkThumb";
import { OrderProgress, StatusPill, formatOrderDate } from "@/components/account/OrderBits";
import { requireVerifiedUser } from "@/lib/auth";
import { getCustomerOrderOr404 } from "@/lib/customerOrders";
import {
  SHAPE_LABELS,
  CUT_TYPE_LABELS,
  SHEET_CUTS_LABELS,
  finishLabel,
  formatAddOns,
  hasCutChoice,
  itemMaterial,
  itemSizeLabel,
  orderNumber,
  unitNoun,
} from "@/lib/orderLabels";
import { reorderHref } from "@/lib/reorder";
import { formatCurrency } from "@/lib/pricingUtils";
import { STICKER_TYPE_LABELS } from "@/lib/stickerTypeSlug";

export const metadata: Metadata = { title: "Order details · Sticker Quest" };

const STATUS_BLURBS = {
  AWAITING_PROOF: "We're checking your artwork and preparing a proof for you to approve.",
  APPROVED: "Proof approved! Your stickers go to print next, and ship the next business day.",
  PRINTING: "Your stickers are on the press right now.",
  SHIPPED: "On the way! Your parcel is with The Courier Guy.",
} as const;

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireVerifiedUser(`/account/orders`);
  // 404s for orders that don't exist *and* for other customers' orders.
  const order = await getCustomerOrderOr404(user.id, id);

  return (
    <>
      <Link href="/account/orders" className="mb-3 inline-block text-sm font-bold text-zap hover:underline">
        ← All orders
      </Link>
      <AccountPageHeader
        title={`Order ${orderNumber(order.id)}`}
        intro={`Placed ${formatOrderDate(order.createdAt)}`}
        action={<StatusPill status={order.status} size="md" />}
      />

      <div className="flex flex-col gap-6">
        <StepCard icon="🧭" title="Where it's at">
          <div className="flex flex-col gap-4 p-5 sm:p-6">
            <OrderProgress status={order.status} />
            <p className="text-sm text-ink">{STATUS_BLURBS[order.status as keyof typeof STATUS_BLURBS] ?? ""}</p>
            {order.trackingNumber && (
              <p className="text-sm text-ink">
                Tracking number: <span className="font-black">{order.trackingNumber}</span>
              </p>
            )}
          </div>
        </StepCard>

        <StepCard icon="🎨" title={`${order.items.length} item${order.items.length === 1 ? "" : "s"}`}>
          <ul className="divide-y divide-grape/20">
            {order.items.map((item) => {
              const material = itemMaterial(item);
              const isSheet = item.stickerType === "STICKER_SHEETS";
              const addOns = formatAddOns(item);
              const reorder = reorderHref(item);
              const details: [string, string][] = [
                ["Type", STICKER_TYPE_LABELS[item.stickerType]],
                ...(isSheet ? ([["Material", STICKER_TYPE_LABELS[material]]] as [string, string][]) : []),
                ...(isSheet && item.sheetCuts ? ([["Stickers per sheet", SHEET_CUTS_LABELS[item.sheetCuts]]] as [string, string][]) : []),
                ...(!isSheet ? ([["Shape", SHAPE_LABELS[item.shape]]] as [string, string][]) : []),
                ...(!isSheet && hasCutChoice(item.stickerType) ? ([["Cut", CUT_TYPE_LABELS[item.cutType]]] as [string, string][]) : []),
                ["Finish", finishLabel(item)],
                ["Size", itemSizeLabel(item)],
                ["Quantity", `${item.quantity.toLocaleString("en-ZA")} ${unitNoun(item.stickerType, item.quantity)}`],
                ...(addOns ? ([["Extras", addOns]] as [string, string][]) : []),
              ];
              return (
                <li key={item.id} className="flex flex-col gap-5 p-5 sm:flex-row sm:p-6">
                  <div className="flex flex-col items-start gap-2">
                    <ArtworkThumb url={item.artworkUrl} size={128} />
                    <a
                      href={item.artworkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="max-w-[128px] truncate text-xs font-bold text-blaze hover:underline"
                      title={item.artworkFilename ?? undefined}
                    >
                      View artwork ↗
                    </a>
                  </div>
                  <dl className="grid flex-1 grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
                    {details.map(([label, value]) => (
                      <div key={label} className="contents">
                        <dt className="text-quiet">{label}</dt>
                        <dd className="font-bold text-night">{value}</dd>
                      </div>
                    ))}
                    {item.artworkFilename && (
                      <div className="contents">
                        <dt className="text-quiet">Artwork file</dt>
                        <dd className="truncate text-night">{item.artworkFilename}</dd>
                      </div>
                    )}
                  </dl>
                  <div className="flex flex-row items-center justify-between gap-3 sm:flex-col sm:items-end">
                    <div className="text-right">
                      <p className="text-lg font-black text-night">{formatCurrency(Number(item.totalPrice))}</p>
                      <p className="text-xs text-quiet">{formatCurrency(Number(item.pricePerUnit))} each</p>
                    </div>
                    {reorder && (
                      <Link
                        href={reorder}
                        className="rounded-full border-2 border-night bg-zap px-4 py-1.5 text-xs font-black uppercase text-night shadow-pop-zap transition-[translate] duration-150 motion-safe:hover:-translate-y-0.5"
                      >
                        Reorder
                      </Link>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="flex items-center justify-between border-t-[1.5px] border-grape/30 px-5 py-4 sm:px-6">
            <span className="font-black text-night">Total paid</span>
            <span className="text-xl font-black text-night">{formatCurrency(Number(order.totalPrice))}</span>
          </div>
        </StepCard>

        <div className="grid gap-6 md:grid-cols-2">
          <StepCard icon="📍" title="Delivery">
            <dl className="flex flex-col gap-1.5 p-5 text-sm sm:p-6">
              <dt className="sr-only">Name</dt>
              <dd className="font-black text-night">{order.customerName}</dd>
              <dt className="sr-only">Address</dt>
              <dd className="text-ink">{order.shippingAddress}</dd>
              <dt className="sr-only">Phone</dt>
              <dd className="text-ink">{order.phone}</dd>
            </dl>
          </StepCard>

          {/* Phase 4 fills this in with the proof viewer and approve/reject. */}
          <StepCard icon="🖼️" title="Proofs">
            <p className="p-5 text-sm text-ink sm:p-6">
              When your proof is ready, it&apos;ll show up here for you to approve. We&apos;ll also
              send it by email or WhatsApp.
            </p>
          </StepCard>
        </div>
      </div>
    </>
  );
}

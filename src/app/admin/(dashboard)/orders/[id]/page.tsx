import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth";
import { formatCurrency, formatSizeMm } from "@/lib/pricingUtils";
import { STICKER_TYPE_LABELS } from "@/lib/stickerTypeSlug";
import { formatAddOns, itemSpecLine, orderNumber, unitNoun } from "@/lib/orderLabels";
import { toArtworkDownloadUrl } from "@/lib/cloudinary";
import { OrderStatusForm } from "@/components/admin/OrderStatusForm";
import { ProofsPanel } from "@/components/admin/ProofsPanel";
import { ArtworkThumb } from "@/components/account/ArtworkThumb";
import {
  AdminCard,
  AdminIcon,
  AdminPageHeader,
  Avatar,
  DetailList,
  LINK_CLASSES,
  OrderStatusBadge,
  SMALL_SECONDARY_BUTTON,
  formatAdminDateTime,
} from "@/components/admin/ui";

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff();
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: { orderBy: { createdAt: "asc" } } },
  });
  if (!order) notFound();

  const total = Number(order.totalPrice);
  const shipping = Number(order.shippingFee);
  const discountAmount = Number(order.discountAmount);
  const itemsTotal = order.items.reduce((sum, i) => sum + Number(i.totalPrice), 0);

  return (
    <>
      <AdminPageHeader
        back={{ href: "/admin/orders", label: "All orders" }}
        title={
          <span className="flex flex-wrap items-center gap-3">
            <span className="font-mono">{orderNumber(order.id)}</span>
            <OrderStatusBadge status={order.status} />
          </span>
        }
        description={
          <>
            {order.customerName} · placed {formatAdminDateTime(order.createdAt)}
          </>
        }
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-6">
          <AdminCard
            title={`${order.items.length} ${order.items.length === 1 ? "item" : "items"}`}
            description="Download each artwork to preflight it."
          >
            <ul className="divide-y divide-admin-line">
              {order.items.map((item) => {
                const addOns = formatAddOns(item);
                return (
                  <li key={item.id} className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-start">
                    <ArtworkThumb url={item.artworkUrl} size={88} checker />
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <p className="font-semibold text-admin-ink">{STICKER_TYPE_LABELS[item.stickerType]}</p>
                      <p className="text-sm text-admin-muted">{itemSpecLine(item)}</p>
                      <p className="text-sm text-admin-muted">
                        {formatSizeMm(Number(item.widthCm))} × {formatSizeMm(Number(item.heightCm))}
                        {addOns && ` · ${addOns}`}
                      </p>
                      <p className="text-sm text-admin-muted">
                        <span className="tabular-nums">{item.quantity.toLocaleString("en-ZA")}</span>{" "}
                        {unitNoun(item.stickerType, item.quantity)} ×{" "}
                        <span className="tabular-nums">{formatCurrency(Number(item.pricePerUnit))}</span>
                      </p>
                      {item.artworkFilename && (
                        <p className="truncate text-xs text-admin-faint" title={item.artworkFilename}>
                          {item.artworkFilename}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-row items-center justify-between gap-3 sm:flex-col sm:items-end">
                      <p className="font-semibold tabular-nums text-admin-ink">{formatCurrency(Number(item.totalPrice))}</p>
                      <a
                        href={toArtworkDownloadUrl(item.artworkUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={SMALL_SECONDARY_BUTTON}
                      >
                        <AdminIcon name="download" className="size-3.5" />
                        Artwork
                      </a>
                    </div>
                  </li>
                );
              })}
            </ul>
            <dl className="flex flex-col gap-1.5 border-t border-admin-line bg-admin-canvas/50 px-5 py-4 text-sm">
              <div className="flex justify-between gap-4 text-admin-muted">
                <dt>Items</dt>
                <dd className="tabular-nums">{formatCurrency(itemsTotal)}</dd>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between gap-4 text-admin-muted">
                  <dt>
                    Discount
                    {order.discountCodeText &&
                      (order.discountCodeId ? (
                        <>
                          {" "}
                          (<Link href={`/admin/discounts/${order.discountCodeId}`} className={LINK_CLASSES}>{order.discountCodeText}</Link>)
                        </>
                      ) : (
                        ` (${order.discountCodeText})`
                      ))}
                  </dt>
                  <dd className="tabular-nums text-leaf">−{formatCurrency(discountAmount)}</dd>
                </div>
              )}
              <div className="flex justify-between gap-4 text-admin-muted">
                <dt>Shipping</dt>
                <dd className="tabular-nums">{shipping > 0 ? formatCurrency(shipping) : "Free"}</dd>
              </div>
              <div className="flex justify-between gap-4 font-semibold text-admin-ink">
                <dt>Total</dt>
                <dd className="tabular-nums">{formatCurrency(total)}</dd>
              </div>
            </dl>
          </AdminCard>

          <ProofsPanel orderId={order.id} />
        </div>

        <div className="flex flex-col gap-6">
          <AdminCard title="Fulfilment" description="Status and The Courier Guy tracking number.">
            <div className="px-5 py-4">
              <OrderStatusForm orderId={order.id} status={order.status} trackingNumber={order.trackingNumber} />
            </div>
          </AdminCard>

          <AdminCard title="Customer">
            <div className="flex items-center gap-3 border-b border-admin-line px-5 py-4">
              <Avatar name={order.customerName} size="lg" />
              <div className="min-w-0">
                <p className="truncate font-semibold text-admin-ink">{order.customerName}</p>
                <a href={`mailto:${order.email}`} className={`block truncate text-sm ${LINK_CLASSES}`}>
                  {order.email}
                </a>
              </div>
            </div>
            <DetailList
              rows={[
                { label: "Phone", value: order.phone ? <a href={`tel:${order.phone}`} className={LINK_CLASSES}>{order.phone}</a> : "—" },
                { label: "Ship to", value: <span className="whitespace-pre-line">{order.shippingAddress}</span> },
                ...(order.userId
                  ? []
                  : [{ label: "Account", value: <span className="text-admin-muted">Guest checkout</span> }]),
              ]}
            />
          </AdminCard>

          {order.notes && (
            <AdminCard title="Customer notes">
              <p className="whitespace-pre-wrap px-5 py-4 text-sm text-admin-ink">{order.notes}</p>
            </AdminCard>
          )}

          <p className="break-all px-1 font-mono text-[11px] text-admin-faint">Order ID {order.id}</p>
        </div>
      </div>
    </>
  );
}

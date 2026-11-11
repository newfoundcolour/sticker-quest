import Image from "next/image";
import Link from "next/link";
import { StatusChip, formatOrderDate } from "@/components/account/OrderBits";
import { StickerPreview } from "@/components/account/StickerPreview";
import type { CustomerOrderRow } from "@/lib/customerOrders";
import { designName, itemSizeLabel, itemSpecLine, orderNumber, productName } from "@/lib/orderLabels";

/**
 * The order table rows from the Figma Orders dashboard, shared by the Orders
 * page (every order) and the Dashboard (unshipped ones). Goes inside a dusk card.
 */
export function OrderRows({ orders }: { orders: CustomerOrderRow[] }) {
  return (
    <ul>
      {orders.map((order) => (
        <OrderRow key={order.id} order={order} />
      ))}
    </ul>
  );
}

function OrderRow({ order }: { order: CustomerOrderRow }) {
  const first = order.items[0];
  const quantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const pendingProof = order.status === "AWAITING_APPROVAL" ? order.proofs[0] : undefined;
  const moreDesigns = order.items.length - 1;

  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-white/[0.06] px-6 py-4 md:h-[78px] md:flex-nowrap md:py-0">
      <Link
        href={`/account/orders/${order.id}`}
        className="w-full text-[13px] font-semibold text-sand hover:text-zap md:w-[104px] md:shrink-0"
      >
        {orderNumber(order.id)}
      </Link>
      <div className="flex min-w-0 flex-1 basis-full items-center gap-3 md:basis-0">
        {first && <StickerPreview url={first.artworkUrl} cutType={first.cutType} extra={moreDesigns} />}
        {first && (
          <div className="flex min-w-0 flex-col gap-1">
            <p className="truncate text-[13px] font-semibold text-sand">
              {designName(first.artworkFilename) ?? productName(first.stickerType)}
              {moreDesigns > 0 && (
                <span className="font-normal text-white/[0.44]">
                  {" "}
                  + {moreDesigns} more {moreDesigns === 1 ? "design" : "designs"}
                </span>
              )}
            </p>
            <p className="truncate text-[11px] text-white/[0.31]">
              {[productName(first.stickerType), itemSizeLabel(first), itemSpecLine(first)].join(" · ")}
            </p>
          </div>
        )}
      </div>
      <p className="text-[13px] text-dusk-note md:w-[110px] md:shrink-0">{formatOrderDate(order.createdAt)}</p>
      <p className="text-[13px] text-sand md:w-16 md:shrink-0">
        <span className="sr-only">Quantity: </span>
        {quantity.toLocaleString("en-ZA")}
      </p>
      <div className="md:w-[164px] md:shrink-0">
        <StatusChip status={order.status} />
      </div>
      <div className="ml-auto flex justify-end md:ml-0 md:w-[114px] md:shrink-0">
        {pendingProof ? (
          <Link
            href={`/account/proofs/${pendingProof.id}`}
            className="flex h-8 items-center rounded-full bg-zap px-3 text-xs font-bold whitespace-nowrap text-night shadow-[0_3px_0_0_var(--color-grape)] transition-transform hover:-translate-y-px"
          >
            Review proof
          </Link>
        ) : (
          <Link
            href={`/account/orders/${order.id}`}
            className="flex items-center gap-[5px] text-[13px] font-medium whitespace-nowrap text-grape hover:text-lilac"
          >
            View order
            <Image src="/icons/orders/chevron-right-grape.svg" alt="" width={14} height={14} />
          </Link>
        )}
      </div>
    </li>
  );
}

/** The dusk card the order table sits in, with the Figma heading row. */
export const ORDER_TABLE_CARD_CLASSES =
  "overflow-hidden rounded-[20px] border-[1.5px] border-dusk-line bg-dusk shadow-[0_4px_12px_rgba(0,0,0,0.28)]";

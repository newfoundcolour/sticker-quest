"use client";

import { useTransition } from "react";
import { setOrderStatusAction } from "@/app/actions/orders";
import { ORDER_STATUS_BADGE_CLASSES, ORDER_STATUS_LABELS, ORDER_STATUS_VALUES } from "@/lib/orderLabels";
import type { OrderStatus } from "@/generated/prisma/client";

/**
 * Inline status control for the orders table — styled to look like the same
 * pill used elsewhere, but it's a real <select> that saves on change. Value
 * stays controlled by the `status` prop (not defaultValue), so once the
 * server action resolves and the page revalidates, this naturally re-syncs
 * to the true status — no key-remount trick needed like the detail page's
 * uncontrolled form required.
 */
export function OrderStatusSelect({ orderId, status }: { orderId: string; status: OrderStatus }) {
  const [isPending, startTransition] = useTransition();

  return (
    <select
      value={status}
      disabled={isPending}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => {
        const next = e.target.value as OrderStatus;
        startTransition(() => {
          setOrderStatusAction(orderId, next);
        });
      }}
      className={`rounded-full border-0 px-2.5 py-1 text-xs font-medium outline-none focus:ring-2 focus:ring-coral-signal disabled:opacity-50 ${ORDER_STATUS_BADGE_CLASSES[status]}`}
    >
      {ORDER_STATUS_VALUES.map((s) => (
        <option key={s} value={s}>
          {ORDER_STATUS_LABELS[s]}
        </option>
      ))}
    </select>
  );
}

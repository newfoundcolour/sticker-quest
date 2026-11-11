"use client";

import { useTransition } from "react";
import { setOrderStatusAction } from "@/app/actions/orders";
import { ORDER_STATUS_LABELS, ORDER_STATUS_VALUES } from "@/lib/orderLabels";
import { ORDER_STATUS_DOT } from "@/components/admin/ui";
import type { OrderStatus } from "@/generated/prisma/client";

/**
 * Inline status control for the orders table: looks like the status badge (a
 * coloured dot in a quiet pill) but is a real <select> that saves on change.
 * The value is controlled by the `status` prop, so it re-syncs to the true
 * status once the action resolves and the page revalidates.
 */
export function OrderStatusSelect({ orderId, status }: { orderId: string; status: OrderStatus }) {
  const [isPending, startTransition] = useTransition();

  return (
    <span className="relative inline-flex items-center">
      <span aria-hidden className={`pointer-events-none absolute left-2.5 size-2 rounded-full ${ORDER_STATUS_DOT[status]}`} />
      <select
        value={status}
        disabled={isPending}
        aria-label="Order status"
        onChange={(e) => {
          const next = e.target.value as OrderStatus;
          startTransition(() => {
            setOrderStatusAction(orderId, next);
          });
        }}
        className="h-8 cursor-pointer appearance-none rounded-full border border-admin-line bg-white pl-6 pr-7 text-xs font-medium text-admin-ink outline-none transition-colors hover:border-grape/40 focus:border-grape focus:ring-2 focus:ring-grape/20 disabled:opacity-50"
      >
        {ORDER_STATUS_VALUES.map((s) => (
          <option key={s} value={s}>
            {ORDER_STATUS_LABELS[s]}
          </option>
        ))}
      </select>
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="pointer-events-none absolute right-2 size-3.5 text-admin-faint"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </span>
  );
}

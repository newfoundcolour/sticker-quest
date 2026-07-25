"use client";

import { useActionState } from "react";
import { updateOrderAction, type UpdateOrderResult } from "@/app/actions/orders";
import { ORDER_STATUS_LABELS, ORDER_STATUS_VALUES } from "@/lib/orderLabels";
import type { OrderStatus } from "@/generated/prisma/client";

export function OrderStatusForm({
  orderId,
  status,
  trackingNumber,
}: {
  orderId: string;
  status: OrderStatus;
  trackingNumber: string | null;
}) {
  const [state, formAction, isPending] = useActionState<UpdateOrderResult | undefined, FormData>(
    updateOrderAction.bind(null, orderId),
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4 sm:flex-row sm:items-end">
      <label className="flex flex-1 flex-col gap-1.5 text-sm text-ink-navy/70">
        Status
        {/*
          Keyed on `status` so the uncontrolled <select> remounts (and picks
          up the new defaultValue) once a save succeeds and fresh order data
          flows back in — otherwise React leaves the DOM's stale
          initial-mount selection in place even though the badge above has
          already moved on.
        */}
        <select
          key={status}
          name="status"
          defaultValue={status}
          className="rounded-lg border border-ink-navy/15 bg-white px-3 py-2 text-sm text-ink-navy outline-none focus:border-coral-signal"
        >
          {ORDER_STATUS_VALUES.map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-1 flex-col gap-1.5 text-sm text-ink-navy/70">
        Tracking number
        <input
          key={trackingNumber ?? ""}
          type="text"
          name="trackingNumber"
          defaultValue={trackingNumber ?? ""}
          placeholder="Paste The Courier Guy tracking number once shipped"
          className="rounded-lg border border-ink-navy/15 px-3 py-2 font-mono text-sm text-ink-navy outline-none focus:border-coral-signal"
        />
      </label>

      <div className="flex flex-col items-start gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-coral-signal px-5 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-coral-signal/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isPending ? "Saving…" : "Save changes"}
        </button>
        {state && !state.ok && <p className="text-sm text-coral-signal">{state.error}</p>}
        {state?.ok && <p className="text-sm text-trail-teal">Saved.</p>}
      </div>
    </form>
  );
}

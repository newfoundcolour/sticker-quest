"use client";

import { useActionState } from "react";
import { updateOrderAction, type UpdateOrderResult } from "@/app/actions/orders";
import { ORDER_STATUS_LABELS, ORDER_STATUS_VALUES } from "@/lib/orderLabels";
import { INPUT_CLASSES, LABEL_CLASSES, PRIMARY_BUTTON } from "@/components/admin/ui";
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
    <form action={formAction} className="flex flex-col gap-4">
      <label className={LABEL_CLASSES}>
        Status
        {/*
          Keyed on `status` so the uncontrolled <select> remounts (and picks up
          the new defaultValue) once a save succeeds and fresh order data flows
          back in — otherwise React keeps the stale initial selection.
        */}
        <select key={status} name="status" defaultValue={status} className={`${INPUT_CLASSES} cursor-pointer`}>
          {ORDER_STATUS_VALUES.map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </label>

      <label className={LABEL_CLASSES}>
        Tracking number
        <input
          key={trackingNumber ?? ""}
          type="text"
          name="trackingNumber"
          defaultValue={trackingNumber ?? ""}
          placeholder="Add once shipped"
          className={`${INPUT_CLASSES} font-mono`}
        />
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={isPending} className={PRIMARY_BUTTON}>
          {isPending ? "Saving…" : "Save changes"}
        </button>
        {state && !state.ok && (
          <p role="alert" className="text-sm font-medium text-coral-signal">
            {state.error}
          </p>
        )}
        {state?.ok && (
          <p role="status" className="text-sm font-medium text-trail-teal">
            Saved.
          </p>
        )}
      </div>
    </form>
  );
}

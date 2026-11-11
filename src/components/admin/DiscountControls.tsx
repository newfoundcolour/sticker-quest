"use client";

import { useState, useTransition } from "react";
import { deleteDiscountAction, setDiscountActiveAction } from "@/app/actions/discounts";
import { AdminIcon, SECONDARY_BUTTON } from "@/components/admin/ui";

/** Turn a code on/off, and delete it (only offered while it's unused), on /admin/discounts/[id]. */
export function DiscountControls({ discountId, active, used }: { discountId: string; active: boolean; used: boolean }) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string>();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => setDiscountActiveAction(discountId, !active))}
        className={SECONDARY_BUTTON}
      >
        {active ? "Turn off" : "Turn on"}
      </button>

      {!used &&
        (confirming ? (
          <span className="flex items-center gap-2 rounded-lg bg-coral-signal/10 px-3 py-1.5 text-sm text-admin-ink">
            Delete for good?
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const result = await deleteDiscountAction(discountId);
                  if (result && !result.ok) setError(result.message);
                })
              }
              className="h-8 rounded-lg bg-coral-signal px-3 text-xs font-semibold text-white disabled:opacity-50"
            >
              {pending ? "Deleting…" : "Yes, delete"}
            </button>
            <button type="button" onClick={() => setConfirming(false)} className="px-1 text-xs font-medium text-admin-muted">
              Cancel
            </button>
          </span>
        ) : (
          <button type="button" onClick={() => setConfirming(true)} className={`${SECONDARY_BUTTON} text-coral-signal`}>
            <AdminIcon name="trash" className="size-4" />
            Delete
          </button>
        ))}
      {error && (
        <p role="alert" className="w-full text-sm font-medium text-coral-signal">
          {error}
        </p>
      )}
    </div>
  );
}

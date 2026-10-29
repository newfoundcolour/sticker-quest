"use client";

import { useId, useState, useTransition } from "react";
import { updateCartItemQuantityAction } from "@/app/actions/cart";
import { QUANTITY_PRESETS } from "@/lib/configuratorOptions";
import { MIN_QUANTITY } from "@/lib/pricingUtils";

const CUSTOM = "custom";

const CONTROL_CLASSES =
  "h-9 rounded-[9px] border-[1.5px] border-pebble bg-transparent px-3.5 text-sm font-extrabold text-night outline-none focus-visible:border-grape focus-visible:ring-2 focus-visible:ring-grape/30";

/**
 * A cart line's quantity: the configurator's presets in a dropdown (saved as
 * soon as one is picked), or "Other amount" for any number from the minimum
 * up. The server clamps whatever arrives, so this is only a convenience.
 */
export function QuantityPicker({ itemId, quantity, unit }: { itemId: string; quantity: number; unit: string }) {
  const id = useId();
  const [pending, startTransition] = useTransition();
  const [custom, setCustom] = useState(false);
  const [draft, setDraft] = useState(String(quantity));
  // The current amount stays in the list even when it isn't a preset.
  const options = [...new Set([...QUANTITY_PRESETS, quantity])].sort((a, b) => a - b);

  function save(value: number) {
    const data = new FormData();
    data.set("quantity", String(value));
    startTransition(async () => {
      await updateCartItemQuantityAction(itemId, data);
      setCustom(false);
    });
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="sr-only">
        Quantity
      </label>
      {custom ? (
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            save(Math.max(MIN_QUANTITY, Math.floor(Number(draft)) || MIN_QUANTITY));
          }}
        >
          <input
            id={id}
            type="number"
            inputMode="numeric"
            min={MIN_QUANTITY}
            step={1}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            autoFocus
            className={`${CONTROL_CLASSES} w-28`}
          />
          <button
            type="submit"
            disabled={pending}
            className="h-9 rounded-[9px] bg-night px-3 text-xs font-black text-white disabled:opacity-60"
          >
            {pending ? "Saving…" : "Update"}
          </button>
          <button
            type="button"
            onClick={() => setCustom(false)}
            className="text-xs font-bold text-stone underline underline-offset-2 hover:text-night"
          >
            Cancel
          </button>
        </form>
      ) : (
        <div className="relative">
          <select
            id={id}
            value={quantity}
            disabled={pending}
            onChange={(e) => {
              if (e.target.value === CUSTOM) {
                setDraft(String(quantity));
                setCustom(true);
              } else {
                save(Number(e.target.value));
              }
            }}
            className={`${CONTROL_CLASSES} cursor-pointer appearance-none pr-9 disabled:opacity-60`}
          >
            {options.map((q) => (
              <option key={q} value={q}>
                {q.toLocaleString("en-ZA")} {unit}
              </option>
            ))}
            <option value={CUSTOM}>Other amount…</option>
          </select>
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-grape"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      )}
    </div>
  );
}

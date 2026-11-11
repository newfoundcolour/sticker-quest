"use client";

import { useId, useState, useTransition } from "react";
import { updateCartItemQuantityAction } from "@/app/actions/cart";
import { QUANTITY_PRESETS } from "@/lib/configuratorOptions";
import { MIN_QUANTITY } from "@/lib/pricingUtils";

const CUSTOM = "custom";

/** Figma "Qty selector": a grape pill. */
const PILL_CLASSES =
  "h-9 rounded-full bg-grape px-3.5 text-sm font-extrabold text-white outline-none transition-colors hover:bg-grape/85 focus-visible:ring-2 focus-visible:ring-zap focus-visible:ring-offset-2 focus-visible:ring-offset-dusk";

const INPUT_CLASSES =
  "h-9 w-28 rounded-full border-[1.5px] border-grape bg-well px-3.5 text-sm font-extrabold text-sand outline-none focus-visible:border-zap";

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
            className={INPUT_CLASSES}
          />
          <button
            type="submit"
            disabled={pending}
            className="h-9 rounded-full bg-zap px-3.5 text-xs font-black text-night disabled:opacity-60"
          >
            {pending ? "Saving…" : "Update"}
          </button>
          <button
            type="button"
            onClick={() => setCustom(false)}
            className="text-xs font-bold text-dusk-note underline underline-offset-2 hover:text-sand"
          >
            Cancel
          </button>
        </form>
      ) : (
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
          className={`${PILL_CLASSES} field-sizing-content cursor-pointer appearance-none disabled:opacity-60 [&_option]:bg-dusk [&_option]:text-sand`}
        >
          {options.map((q) => (
            <option key={q} value={q}>
              {q.toLocaleString("en-ZA")} {unit}
            </option>
          ))}
          <option value={CUSTOM}>Other amount…</option>
        </select>
      )}
    </div>
  );
}

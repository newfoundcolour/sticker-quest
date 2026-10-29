"use client";

import { useId, useState } from "react";

/**
 * Placeholder for discount codes (Figma "Discount card"). There's no discount
 * system yet, so Apply never changes the price — it just says codes aren't
 * live. TODO(discounts): validate and apply codes server-side in getPricedCart
 * and checkout.
 */
export function DiscountCard() {
  const id = useId();
  const [message, setMessage] = useState<string | null>(null);

  function apply() {
    setMessage("Discount codes aren’t live yet. Check back soon!");
  }

  return (
    <section aria-labelledby={`${id}-title`} className="rounded-[20px] border-[1.5px] border-grape bg-sand p-5">
      <h2 id={`${id}-title`} className="font-headline text-2xl font-bold uppercase text-night">
        Discount
      </h2>
      {/* Not a <form>: a submit before the page hydrates would put the code in the URL. */}
      <div className="mt-3.5 flex items-center gap-2.5">
        <label htmlFor={`${id}-code`} className="sr-only">
          Discount code
        </label>
        <input
          id={`${id}-code`}
          name="code"
          placeholder="Enter code"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={40}
          onChange={() => setMessage(null)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              apply();
            }
          }}
          aria-describedby={message ? `${id}-message` : undefined}
          className="h-11 min-w-0 flex-1 rounded-full border-[1.5px] border-sand-well-line bg-sand-well px-4 text-base font-bold text-night outline-none placeholder:text-stone-deep focus:border-grape focus-visible:ring-2 focus-visible:ring-grape/30 sm:text-sm"
        />
        <button
          type="button"
          onClick={apply}
          className="h-11 shrink-0 rounded-full bg-zap px-5 text-sm font-black text-night shadow-[0_4px_0_0_var(--color-grape)] transition-[translate,box-shadow] duration-150 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-grape motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-[0_6px_0_0_var(--color-grape)]"
        >
          Apply
        </button>
      </div>
      <p id={`${id}-message`} role="status" className="mt-3 text-[13px] font-bold text-stone-deep empty:hidden">
        {message}
      </p>
    </section>
  );
}

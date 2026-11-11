"use client";

import { useActionState, useId, useState, useTransition } from "react";
import { applyDiscountAction, removeDiscountAction, type DiscountFormState } from "@/app/actions/discount";
import { formatCurrency } from "@/lib/pricingUtils";
import { CART_CARD_CLASSES } from "./CartItemCard";

/**
 * Figma "Discount card". Applying a code checks it on the server against the
 * cart; the order summary then shows the discount. `applied` and `problem`
 * come from getPricedCart, which re-checks the code on every cart read.
 */
export function DiscountCard({
  applied,
  problem,
}: {
  applied: { code: string; label: string; amount: number } | null;
  problem: { code: string; message: string } | null;
}) {
  const id = useId();
  const [state, formAction, pending] = useActionState<DiscountFormState, FormData>(applyDiscountAction, undefined);
  const [removing, startRemove] = useTransition();
  // Controlled, so a mistyped code stays in the box after a failed try (React resets uncontrolled forms).
  const [typed, setTyped] = useState("");
  const remove = () => startRemove(() => removeDiscountAction());

  // A code that was applied but no longer works (expired, used up, cart too small).
  const current = applied ?? (problem ? { code: problem.code } : null);
  const message = !applied && state && !state.ok ? state.message : null;

  return (
    <section aria-labelledby={`${id}-title`} className={`${CART_CARD_CLASSES} p-5`}>
      <h2 id={`${id}-title`} className="font-headline text-2xl font-bold uppercase text-sand">
        Discount
      </h2>

      {current ? (
        <div className="mt-3.5 flex flex-col gap-2">
          <div
            className={`flex min-h-16 items-center gap-3 rounded-2xl border-[1.5px] px-4 py-3 ${
              applied ? "border-zap/60 bg-zap/10" : "border-blaze/60 bg-blaze/10"
            }`}
          >
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <p className="truncate text-base font-black tracking-wide text-sand">{current.code}</p>
              <p className="text-[13px] font-bold text-dusk-hint">
                {applied ? `${applied.label} · you save ${formatCurrency(applied.amount)}` : "Not applied"}
              </p>
            </div>
            <button
              type="button"
              onClick={remove}
              disabled={removing}
              className="shrink-0 rounded-full border-[1.5px] border-white/25 px-4 py-2 text-xs font-black text-sand transition-colors hover:border-white/60 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zap"
            >
              {removing ? "Removing…" : "Remove"}
              <span className="sr-only"> code {current.code}</span>
            </button>
          </div>
          {problem && (
            <p role="status" className="text-[13px] font-bold text-blaze">
              {problem.message}
            </p>
          )}
        </div>
      ) : (
        <>
          {/* A server-action form: without JavaScript it still posts (never puts the code in the URL). */}
          <form action={formAction} className="mt-3.5 flex h-16 items-center gap-2.5">
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
              required
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              aria-invalid={message ? true : undefined}
              aria-describedby={message ? `${id}-message` : undefined}
              className="h-11 min-w-0 flex-1 rounded-full border-[1.5px] border-grape bg-well px-4 text-base font-bold uppercase text-sand outline-none placeholder:normal-case placeholder:text-dusk-note focus:border-zap aria-[invalid=true]:border-blaze sm:text-sm"
            />
            <button
              type="submit"
              disabled={pending}
              className="h-11 shrink-0 rounded-full bg-zap px-5 text-sm font-black text-night shadow-[0_4px_0_0_var(--color-grape)] transition-[translate,box-shadow] duration-150 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-zap disabled:opacity-60 motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-[0_6px_0_0_var(--color-grape)]"
            >
              {pending ? "Checking…" : "Apply"}
            </button>
          </form>
          <p id={`${id}-message`} role="status" className="mt-3 text-[13px] font-bold text-blaze empty:hidden">
            {message}
          </p>
        </>
      )}
    </section>
  );
}

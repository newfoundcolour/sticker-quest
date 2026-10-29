"use client";

import Link from "next/link";
import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import { checkoutAction, saveDeliveryDetailsAction, type CheckoutState } from "@/app/actions/checkout";
import { ZAP_BUTTON_CLASSES } from "@/components/buttonStyles";
import { FormMessage } from "@/components/auth/fields";
import { AddressFields, ContactFields, type DeliveryValues } from "@/components/checkout/DeliveryFields";

/** Where the customer stands, worked out by the cart page (and re-checked by the server). */
export type CheckoutStatus = "guest" | "unverified" | "incomplete" | "ready";

type Mode = "checkout" | "edit";

const CLOSE_BUTTON_CLASSES =
  "absolute right-4 top-4 flex size-9 items-center justify-center rounded-full text-xl text-stone transition-colors hover:bg-night/5 hover:text-night focus-visible:outline-2 focus-visible:outline-grape";

function DialogHeading({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 pr-10">
      <h2 id={id} className="font-headline text-[28px] font-bold leading-tight text-night">
        {title}
      </h2>
      <p className="text-sm leading-normal text-stone">{children}</p>
    </div>
  );
}

/** The popup's form: name, surname, phone and address, saved to the customer's profile. */
function DeliveryDetailsForm({ mode, saved, onSaved }: { mode: Mode; saved: DeliveryValues; onSaved: () => void }) {
  const [state, action, pending] = useActionState(saveDeliveryDetailsAction, undefined);
  const failed = state && !state.ok ? state : undefined;
  const value = (key: keyof DeliveryValues) => failed?.values?.[key] ?? saved[key];
  const error = (key: keyof DeliveryValues) => failed?.fieldErrors?.[key];

  useEffect(() => {
    if (state?.ok) onSaved();
  }, [state, onSaved]);

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="intent" value={mode} />
      {failed?.message && <FormMessage tone="error">{failed.message}</FormMessage>}
      <ContactFields value={value} error={error} />
      <AddressFields value={value} error={error} />
      <div className="mt-2 flex flex-col gap-2.5">
        <button type="submit" disabled={pending} className={`${ZAP_BUTTON_CLASSES} w-full`}>
          {pending ? (
            mode === "checkout" ? "Placing your order…" : "Saving…"
          ) : mode === "checkout" ? (
            <>
              Save &amp; checkout <span aria-hidden className="text-xl font-normal">→</span>
            </>
          ) : (
            "Save details"
          )}
        </button>
        <p className="text-center text-xs text-stone">
          We&apos;ll save these to your account for next time. Change them any time in Settings.
        </p>
      </div>
    </form>
  );
}

/**
 * The cart's way on. Ready customers place their order straight away;
 * anyone else gets a popup first — log in, verify their email, or complete
 * their delivery details (saved to their profile).
 */
export function CheckoutPanel({
  status,
  blocked,
  email,
  saved,
}: {
  status: CheckoutStatus;
  /** True while unavailable lines are still in the cart (checkout refuses them). */
  blocked: boolean;
  email: string | null;
  /** The customer's saved details (blank for guests), to prefill the popup. */
  saved: DeliveryValues;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [mode, setMode] = useState<Mode>("checkout");
  // Bumped on every open so the form starts fresh from the saved details.
  const [openCount, setOpenCount] = useState(0);

  const open = useCallback((next: Mode) => {
    setMode(next);
    setOpenCount((n) => n + 1);
    if (!dialogRef.current?.open) dialogRef.current?.showModal();
  }, []);
  const close = useCallback(() => dialogRef.current?.close(), []);

  const [state, checkout, placing] = useActionState(async (): Promise<CheckoutState> => {
    const result = await checkoutAction();
    // The server knows best: if it found something missing, show that popup.
    if (result && result.reason !== "cart") open("checkout");
    return result;
  }, undefined);

  const current: CheckoutStatus =
    state?.reason === "login"
      ? "guest"
      : state?.reason === "verify"
        ? "unverified"
        : state?.reason === "details"
          ? "incomplete"
          : status;

  const titleId = "checkout-dialog-title";
  const showForm = mode === "edit" || current === "incomplete" || current === "ready";

  return (
    <>
      {state?.reason === "cart" && <FormMessage tone="error">{state.message}</FormMessage>}

      {blocked ? (
        <p role="status" className="rounded-xl border-[1.5px] border-blaze bg-blaze/10 px-4 py-3 text-sm font-bold text-night">
          Remove the stickers that can&apos;t be ordered any more to carry on.
        </p>
      ) : current === "ready" ? (
        <form action={checkout}>
          <button type="submit" disabled={placing} className={`${ZAP_BUTTON_CLASSES} w-full`}>
            {placing ? (
              "Placing your order…"
            ) : (
              <>
                Checkout <span aria-hidden className="text-xl font-normal">→</span>
              </>
            )}
          </button>
        </form>
      ) : (
        <button type="button" onClick={() => open("checkout")} aria-haspopup="dialog" className={`${ZAP_BUTTON_CLASSES} w-full`}>
          Checkout <span aria-hidden className="text-xl font-normal">→</span>
        </button>
      )}

      {current === "ready" && (
        <div className="flex items-start justify-between gap-3 rounded-xl bg-sand-well px-4 py-3 text-[13px] leading-normal">
          <p className="min-w-0 text-stone-deep">
            <span className="block font-bold text-night">Delivering to</span>
            {saved.firstName} {saved.lastName} · {saved.phone}
            <br />
            {[saved.addressLine1, saved.addressLine2, saved.city, saved.province, saved.postalCode].filter(Boolean).join(", ")}
          </p>
          <button
            type="button"
            onClick={() => open("edit")}
            aria-haspopup="dialog"
            className="shrink-0 text-xs font-bold text-night underline underline-offset-2 hover:text-grape"
          >
            Change
          </button>
        </div>
      )}

      {email ? (
        <p className="truncate text-center text-xs text-stone">
          Logged in as <span className="font-bold text-night">{email}</span>
        </p>
      ) : (
        <p className="text-center text-xs text-stone">You&apos;ll need a free account to check out.</p>
      )}

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        className="m-auto max-h-[calc(100dvh-32px)] w-[calc(100%-32px)] max-w-[600px] overflow-y-auto rounded-[20px] border-[1.5px] border-grape bg-sand p-0 text-night backdrop:bg-night/75"
      >
        <div className="relative flex flex-col gap-6 p-6 sm:p-8">
          <button type="button" onClick={close} aria-label="Close" className={CLOSE_BUTTON_CLASSES}>
            <span aria-hidden>×</span>
          </button>

          {current === "guest" && !showForm && (
            <>
              <DialogHeading id={titleId} title="Log in to check out">
                You&apos;ll need a free account so we can save your delivery details and keep your proofs and
                orders in one place. Your cart will be right here when you get back.
              </DialogHeading>
              <div className="flex flex-col gap-3">
                <Link href="/login?next=/cart" className={`${ZAP_BUTTON_CLASSES} w-full`}>
                  Log in <span aria-hidden className="text-xl font-normal">→</span>
                </Link>
                <p className="text-center text-sm text-stone">
                  New to Sticker Quest?{" "}
                  <Link href="/signup" className="font-bold text-night underline underline-offset-2 hover:text-grape">
                    Create an account
                  </Link>
                </p>
              </div>
            </>
          )}

          {current === "unverified" && !showForm && (
            <>
              <DialogHeading id={titleId} title="Verify your email first">
                We sent a link to <span className="font-bold text-night">{email}</span>. Click it to confirm your
                account, then come back to your cart to check out.
              </DialogHeading>
              <button type="button" onClick={close} className={`${ZAP_BUTTON_CLASSES} w-full`}>
                Got it
              </button>
            </>
          )}

          {showForm && (current === "incomplete" || current === "ready") && (
            <>
              <DialogHeading
                id={titleId}
                title={mode === "edit" ? "Delivery details" : "Where should we send them?"}
              >
                {mode === "edit"
                  ? "Update who we're sending to and where."
                  : "Add your name, phone number and delivery address before you check out. You'll only need to do this once."}
              </DialogHeading>
              <DeliveryDetailsForm key={openCount} mode={mode} saved={saved} onSaved={close} />
            </>
          )}
        </div>
      </dialog>
    </>
  );
}

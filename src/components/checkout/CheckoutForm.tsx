"use client";

import { useActionState } from "react";
import { submitOrderAction, type CheckoutResult } from "@/app/actions/checkout";

const PROVINCES = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "Northern Cape",
  "North West",
  "Western Cape",
];

function Field({
  label,
  name,
  type = "text",
  required = true,
  autoComplete,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm text-ink-navy/70">
      {label}
      <input
        type={type}
        name={name}
        required={required}
        autoComplete={autoComplete}
        className="rounded-lg border border-ink-navy/15 px-3 py-2 text-sm text-ink-navy outline-none focus:border-coral-signal"
      />
    </label>
  );
}

export function CheckoutForm({ disabled }: { disabled: boolean }) {
  const [state, formAction, isPending] = useActionState<CheckoutResult | undefined, FormData>(
    submitOrderAction,
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <Field label="Full name" name="fullName" autoComplete="name" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Email" name="email" type="email" autoComplete="email" />
        <Field label="Phone" name="phone" type="tel" autoComplete="tel" />
      </div>

      <Field label="Address line 1" name="addressLine1" autoComplete="address-line1" />
      <Field
        label="Address line 2 (optional)"
        name="addressLine2"
        required={false}
        autoComplete="address-line2"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="City" name="city" autoComplete="address-level2" />
        <label className="flex flex-col gap-1 text-sm text-ink-navy/70">
          Province
          <select
            name="province"
            required
            defaultValue=""
            className="rounded-lg border border-ink-navy/15 bg-white px-3 py-2 text-sm text-ink-navy outline-none focus:border-coral-signal"
          >
            <option value="" disabled>
              Select…
            </option>
            {PROVINCES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <Field label="Postal code" name="postalCode" autoComplete="postal-code" />
      </div>

      {state && !state.ok && <p className="text-sm text-coral-signal">{state.error}</p>}

      <button
        type="submit"
        disabled={disabled || isPending}
        className="mt-2 rounded-xl bg-coral-signal px-6 py-3.5 text-center font-medium text-paper transition-colors hover:bg-coral-signal/90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isPending ? "Submitting…" : "Pay & submit for proofing"}
      </button>
    </form>
  );
}

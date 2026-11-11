"use client";

import { useActionState, useState } from "react";
import type { DiscountFormState } from "@/app/actions/discounts";
import { INPUT_CLASSES, LABEL_CLASSES, PRIMARY_BUTTON } from "@/components/admin/ui";

export type DiscountFormValues = {
  code: string;
  description: string;
  type: "PERCENT" | "FIXED";
  value: string;
  minOrderTotal: string;
  maxUses: string;
  startsOn: string;
  endsOn: string;
  oncePerCustomer: boolean;
  active: boolean;
};

export const EMPTY_DISCOUNT_VALUES: DiscountFormValues = {
  code: "",
  description: "",
  type: "PERCENT",
  value: "",
  minOrderTotal: "",
  maxUses: "",
  startsOn: "",
  endsOn: "",
  oncePerCustomer: false,
  active: true,
};

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-xs font-medium text-coral-signal">
      {message}
    </p>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-normal text-admin-faint">{children}</p>;
}

/**
 * Create / edit a discount code. Everything is re-checked on the server
 * (discountFormSchema); this form only shapes the input.
 */
export function DiscountForm({
  action,
  defaults,
  codeLocked = false,
  submitLabel,
}: {
  action: (prev: DiscountFormState, formData: FormData) => Promise<DiscountFormState>;
  defaults: DiscountFormValues;
  /** True once the code has been used: its name can't change. */
  codeLocked?: boolean;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  // After a failed save, refill from what was typed.
  const v = state?.values;
  const value = (key: keyof DiscountFormValues) => (v ? v[key] : String(defaults[key]));
  const checked = (key: "oncePerCustomer" | "active") => (v ? v[key] === "on" : defaults[key]);
  const [type, setType] = useState<DiscountFormValues["type"]>(defaults.type);
  const errors = state?.fieldErrors ?? {};
  const err = (key: string) => (errors[key] ? { "aria-invalid": true, "aria-describedby": `${key}-error` } : {});

  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate key={v ? JSON.stringify(v) : "initial"}>
      {state?.message && (
        <p
          role={state.ok ? "status" : "alert"}
          className={`rounded-lg px-3 py-2 text-sm font-medium ${
            state.ok ? "bg-trail-teal/10 text-admin-ink" : "bg-coral-signal/10 text-admin-ink"
          }`}
        >
          {state.message}
        </p>
      )}

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-3 text-sm font-semibold text-admin-ink">Code</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={LABEL_CLASSES}>
            Code customers type
            <input
              name="code"
              defaultValue={value("code")}
              readOnly={codeLocked}
              required
              maxLength={30}
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              placeholder="e.g. WELCOME15"
              className={`${INPUT_CLASSES} font-mono uppercase placeholder:normal-case read-only:bg-admin-canvas read-only:text-admin-muted`}
              {...err("code")}
            />
            <Hint>{codeLocked ? "Used on an order, so the name is fixed." : "Letters, numbers, dashes. Not case-sensitive."}</Hint>
            <FieldError id="code-error" message={errors.code} />
          </label>
          <label className={LABEL_CLASSES}>
            <span>
              Note for staff <span className="font-normal text-admin-faint">(optional)</span>
            </span>
            <input
              name="description"
              defaultValue={value("description")}
              maxLength={200}
              placeholder="e.g. Instagram giveaway"
              className={INPUT_CLASSES}
              {...err("description")}
            />
            <Hint>Customers never see this.</Hint>
            <FieldError id="description-error" message={errors.description} />
          </label>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-4 border-t border-admin-line pt-5">
        <legend className="mb-3 text-sm font-semibold text-admin-ink">Discount</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className={LABEL_CLASSES}>
            <span id="type-label">Type</span>
            <div role="radiogroup" aria-labelledby="type-label" className="grid grid-cols-2 gap-1 rounded-lg bg-admin-canvas p-1">
              {(
                [
                  ["PERCENT", "Percentage"],
                  ["FIXED", "Fixed amount"],
                ] as const
              ).map(([t, label]) => (
                <label
                  key={t}
                  className={`flex h-8 cursor-pointer items-center justify-center rounded-md text-sm font-semibold transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-grape ${
                    type === t ? "bg-white text-admin-ink shadow-sm" : "text-admin-muted hover:text-admin-ink"
                  }`}
                >
                  <input
                    type="radio"
                    name="type"
                    value={t}
                    checked={type === t}
                    onChange={() => setType(t)}
                    className="sr-only"
                  />
                  {label}
                </label>
              ))}
            </div>
            <Hint>Comes off the stickers, not the shipping.</Hint>
          </div>
          <label className={LABEL_CLASSES}>
            {type === "PERCENT" ? "Percentage off" : "Amount off"}
            <span className="relative flex items-center">
              {type === "FIXED" && <span className="pointer-events-none absolute left-3 text-sm text-admin-muted">R</span>}
              <input
                name="value"
                type="number"
                inputMode="decimal"
                min={type === "PERCENT" ? 1 : 0.01}
                max={type === "PERCENT" ? 100 : 100000}
                step={type === "PERCENT" ? 1 : 0.01}
                defaultValue={value("value")}
                required
                className={`${INPUT_CLASSES} tabular-nums ${type === "FIXED" ? "pl-7" : "pr-8"}`}
                {...err("value")}
              />
              {type === "PERCENT" && <span className="pointer-events-none absolute right-3 text-sm text-admin-muted">%</span>}
            </span>
            <FieldError id="value-error" message={errors.value} />
          </label>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-4 border-t border-admin-line pt-5">
        <legend className="mb-3 text-sm font-semibold text-admin-ink">Limits</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={LABEL_CLASSES}>
            <span>
              Starts on <span className="font-normal text-admin-faint">(optional)</span>
            </span>
            <input name="startsOn" type="date" defaultValue={value("startsOn")} className={INPUT_CLASSES} {...err("startsOn")} />
            <Hint>From the start of this day (SA time). Blank = straight away.</Hint>
            <FieldError id="startsOn-error" message={errors.startsOn} />
          </label>
          <label className={LABEL_CLASSES}>
            <span>
              Ends on <span className="font-normal text-admin-faint">(optional)</span>
            </span>
            <input name="endsOn" type="date" defaultValue={value("endsOn")} className={INPUT_CLASSES} {...err("endsOn")} />
            <Hint>Until the end of this day. Blank = no end date.</Hint>
            <FieldError id="endsOn-error" message={errors.endsOn} />
          </label>
          <label className={LABEL_CLASSES}>
            <span>
              Minimum order <span className="font-normal text-admin-faint">(optional)</span>
            </span>
            <span className="relative flex items-center">
              <span className="pointer-events-none absolute left-3 text-sm text-admin-muted">R</span>
              <input
                name="minOrderTotal"
                type="number"
                inputMode="decimal"
                min={0}
                step={0.01}
                defaultValue={value("minOrderTotal")}
                className={`${INPUT_CLASSES} pl-7 tabular-nums`}
                {...err("minOrderTotal")}
              />
            </span>
            <Hint>Stickers total before shipping.</Hint>
            <FieldError id="minOrderTotal-error" message={errors.minOrderTotal} />
          </label>
          <label className={LABEL_CLASSES}>
            <span>
              Total uses <span className="font-normal text-admin-faint">(optional)</span>
            </span>
            <input
              name="maxUses"
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              defaultValue={value("maxUses")}
              placeholder="Unlimited"
              className={`${INPUT_CLASSES} tabular-nums`}
              {...err("maxUses")}
            />
            <Hint>How many orders can use it in all.</Hint>
            <FieldError id="maxUses-error" message={errors.maxUses} />
          </label>
        </div>
        <label className="flex items-start gap-3 text-sm text-admin-ink">
          <input
            type="checkbox"
            name="oncePerCustomer"
            defaultChecked={checked("oncePerCustomer")}
            className="mt-0.5 size-4 accent-grape"
          />
          <span>
            <span className="font-medium">Once per customer</span>
            <span className="block text-xs text-admin-muted">Each account can use it on one order.</span>
          </span>
        </label>
        <label className="flex items-start gap-3 text-sm text-admin-ink">
          <input type="checkbox" name="active" defaultChecked={checked("active")} className="mt-0.5 size-4 accent-grape" />
          <span>
            <span className="font-medium">On</span>
            <span className="block text-xs text-admin-muted">Untick to stop the code working without deleting it.</span>
          </span>
        </label>
      </fieldset>

      <div className="flex items-center gap-3 border-t border-admin-line pt-5">
        <button type="submit" disabled={pending} className={PRIMARY_BUTTON}>
          {pending ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}

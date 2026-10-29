"use client";

import { useActionState, useEffect, useRef } from "react";
import { changeEmailAction, changePasswordAction, updateProfileAction } from "@/app/actions/account";
import { updateAddressAction } from "@/app/actions/checkout";
import { AddressFields, EMPTY_DELIVERY_VALUES, type DeliveryValues } from "@/components/checkout/DeliveryFields";
import type { AuthFormState } from "@/lib/authForms";
import { FormMessage, INPUT_CLASSES, PasswordField, SubmitButton, TextField } from "@/components/auth/fields";

/** Exact copy requested for the Instagram field (settings and sign up). */
export const INSTAGRAM_HELPER =
  "We love to tag our customers for recognition and exposure when we feature our work on Instagram";

function failure(state: AuthFormState) {
  return state && !state.ok ? state : undefined;
}

function StatusMessage({ state }: { state: AuthFormState }) {
  if (!state?.message) return null;
  return <FormMessage tone={state.ok ? "success" : "error"}>{state.message}</FormMessage>;
}

// ─── Profile ───────────────────────────────────────────────────────────────

export type ProfileDefaults = {
  firstName: string;
  lastName: string;
  company: string;
  phone: string;
  instagramHandle: string;
};

export function ProfileForm({ defaults }: { defaults: ProfileDefaults }) {
  const [state, action] = useActionState(updateProfileAction, undefined);
  const failed = failure(state);
  // After a failed save, refill from what was typed; otherwise from the saved profile.
  const value = (key: keyof ProfileDefaults) => failed?.values?.[key] ?? defaults[key];

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <StatusMessage state={state} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="First name"
          name="firstName"
          autoComplete="given-name"
          required
          maxLength={50}
          defaultValue={value("firstName")}
          error={failed?.fieldErrors?.firstName}
        />
        <TextField
          label="Last name"
          name="lastName"
          autoComplete="family-name"
          required
          maxLength={50}
          defaultValue={value("lastName")}
          error={failed?.fieldErrors?.lastName}
        />
      </div>
      <TextField
        label="Company (optional)"
        name="company"
        autoComplete="organization"
        maxLength={100}
        defaultValue={value("company")}
        error={failed?.fieldErrors?.company}
      />
      <TextField
        label="Phone (optional)"
        name="phone"
        type="tel"
        autoComplete="tel"
        maxLength={20}
        defaultValue={value("phone")}
        error={failed?.fieldErrors?.phone}
      />
      <InstagramField defaultValue={value("instagramHandle")} error={failed?.fieldErrors?.instagramHandle} />
      <div className="sm:max-w-[240px]">
        <SubmitButton pendingText="Saving…">Save profile</SubmitButton>
      </div>
    </form>
  );
}

function InstagramField({ defaultValue, error }: { defaultValue: string; error?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="instagramHandle" className="text-sm font-black text-night">
        Instagram handle (optional)
      </label>
      <div className="relative">
        <span aria-hidden className="pointer-events-none absolute inset-y-0 left-3 flex items-center font-black text-quiet">
          @
        </span>
        <input
          id="instagramHandle"
          name="instagramHandle"
          defaultValue={defaultValue}
          maxLength={31}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          pattern="@?[A-Za-z0-9._]{1,30}"
          aria-invalid={error ? true : undefined}
          aria-describedby="instagramHandle-hint"
          className={`${INPUT_CLASSES} pl-8`}
        />
      </div>
      <p id="instagramHandle-hint" className="text-xs text-quiet">
        {INSTAGRAM_HELPER}
      </p>
      {error && <p className="text-sm font-bold text-blaze">{error}</p>}
    </div>
  );
}

// ─── Delivery address ──────────────────────────────────────────────────────

export type AddressDefaults = Pick<DeliveryValues, "addressLine1" | "addressLine2" | "city" | "province" | "postalCode">;

export function AddressForm({ defaults }: { defaults: AddressDefaults }) {
  const [state, action] = useActionState(updateAddressAction, undefined);
  const failed = failure(state);
  const saved: DeliveryValues = { ...EMPTY_DELIVERY_VALUES, ...defaults };
  const value = (key: keyof DeliveryValues) => failed?.values?.[key] ?? saved[key];
  const error = (key: keyof DeliveryValues) => failed?.fieldErrors?.[key];

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <StatusMessage state={state} />
      <AddressFields value={value} error={error} />
      <div>
        <SubmitButton pendingText="Saving…">Save address</SubmitButton>
      </div>
    </form>
  );
}

// ─── Email ─────────────────────────────────────────────────────────────────

export function EmailForm({ currentEmail, pendingEmail }: { currentEmail: string; pendingEmail?: string }) {
  const [state, action] = useActionState(changeEmailAction, undefined);
  const failed = failure(state);

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <p className="text-sm text-ink">
        You log in with <span className="font-black">{currentEmail}</span>.
      </p>
      {pendingEmail && !state?.ok && (
        <FormMessage tone="info">
          Waiting for you to confirm <span className="font-black">{pendingEmail}</span>. Check both
          inboxes for the links. Until then, your current email keeps working.
        </FormMessage>
      )}
      <StatusMessage state={state} />
      <TextField
        label="New email"
        name="email"
        type="email"
        autoComplete="email"
        required
        defaultValue={failed?.values?.email}
        error={failed?.fieldErrors?.email}
      />
      <div className="sm:max-w-[240px]">
        <SubmitButton pendingText="Sending…">Change email</SubmitButton>
      </div>
    </form>
  );
}

// ─── Password ──────────────────────────────────────────────────────────────

export function PasswordForm() {
  const [state, action] = useActionState(changePasswordAction, undefined);
  const failed = failure(state);
  const formRef = useRef<HTMLFormElement>(null);

  // Clear the password fields after a successful change.
  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-4" noValidate>
      <StatusMessage state={state} />
      <PasswordField
        // Remount after success so the controlled value clears too.
        key={state?.ok ? "done-current" : "current"}
        label="Current password"
        name="currentPassword"
        autoComplete="current-password"
        error={failed?.fieldErrors?.currentPassword}
      />
      <PasswordField
        key={state?.ok ? "done-new" : "new"}
        label="New password"
        name="password"
        autoComplete="new-password"
        showStrength
        error={failed?.fieldErrors?.password}
      />
      <PasswordField
        key={state?.ok ? "done-confirm" : "confirm"}
        label="Confirm new password"
        name="confirmPassword"
        autoComplete="new-password"
        error={failed?.fieldErrors?.confirmPassword}
      />
      <div className="sm:max-w-[240px]">
        <SubmitButton pendingText="Updating…">Update password</SubmitButton>
      </div>
    </form>
  );
}

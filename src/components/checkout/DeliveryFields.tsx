"use client";

import { useId } from "react";
import { INPUT_CLASSES, TextField } from "@/components/auth/fields";
import { PROVINCES } from "@/lib/validation/deliveryDetails";

export type DeliveryValues = {
  firstName: string;
  lastName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  province: string;
  postalCode: string;
};

export const EMPTY_DELIVERY_VALUES: DeliveryValues = {
  firstName: "",
  lastName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  province: "",
  postalCode: "",
};

type Props = {
  value: (key: keyof DeliveryValues) => string;
  error: (key: keyof DeliveryValues) => string | undefined;
};

/** Name, surname and phone (the cart popup only — settings has these in Profile). */
export function ContactFields({ value, error }: Props) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="First name"
          name="firstName"
          autoComplete="given-name"
          required
          maxLength={50}
          defaultValue={value("firstName")}
          error={error("firstName")}
        />
        <TextField
          label="Surname"
          name="lastName"
          autoComplete="family-name"
          required
          maxLength={50}
          defaultValue={value("lastName")}
          error={error("lastName")}
        />
      </div>
      <TextField
        label="Phone"
        name="phone"
        type="tel"
        autoComplete="tel"
        required
        maxLength={20}
        defaultValue={value("phone")}
        error={error("phone")}
        hint="For the courier, or a quick WhatsApp about your proof."
      />
    </>
  );
}

/** A South African delivery address. */
export function AddressFields({ value, error }: Props) {
  const provinceId = useId();
  const provinceError = error("province");

  return (
    <>
      <TextField
        label="Street address"
        name="addressLine1"
        autoComplete="address-line1"
        required
        maxLength={200}
        defaultValue={value("addressLine1")}
        error={error("addressLine1")}
      />
      <TextField
        label="Apartment, unit or complex"
        name="addressLine2"
        optional
        autoComplete="address-line2"
        maxLength={200}
        defaultValue={value("addressLine2")}
        error={error("addressLine2")}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <TextField
          label="City or town"
          name="city"
          autoComplete="address-level2"
          required
          maxLength={100}
          defaultValue={value("city")}
          error={error("city")}
        />
        <div className="flex flex-col gap-1.5">
          <label htmlFor={provinceId} className="text-sm font-black text-night">
            Province
          </label>
          <select
            // Remount with the refilled value: a form reset doesn't pick up a <select>'s new defaultValue.
            key={value("province")}
            id={provinceId}
            name="province"
            required
            autoComplete="address-level1"
            defaultValue={value("province")}
            aria-invalid={provinceError ? true : undefined}
            aria-describedby={provinceError ? `${provinceId}-error` : undefined}
            className={`${INPUT_CLASSES} h-[46px] cursor-pointer`}
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
          {provinceError && (
            <p id={`${provinceId}-error`} className="text-sm font-bold text-blaze">
              {provinceError}
            </p>
          )}
        </div>
        <TextField
          label="Postal code"
          name="postalCode"
          autoComplete="postal-code"
          inputMode="numeric"
          required
          maxLength={4}
          defaultValue={value("postalCode")}
          error={error("postalCode")}
        />
      </div>
    </>
  );
}

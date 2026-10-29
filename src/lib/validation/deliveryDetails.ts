import { z } from "zod";
import { nameSchema } from "@/lib/validation/auth";
import { PHONE_PATTERN, optionalText } from "@/lib/validation/profileFields";

/**
 * What checkout needs on the customer's profile before an order can be
 * placed: who it's for, a phone number for the courier, and a South African
 * delivery address. The cart's details popup and account settings save these;
 * checkout re-checks them on the server every time.
 */

export const PROVINCES = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "Northern Cape",
  "North West",
  "Western Cape",
] as const;

/** South African postal codes are four digits. */
export const POSTAL_CODE_PATTERN = /^\d{4}$/;

const requiredText = (max: number, missing: string) =>
  z.string().trim().min(1, missing).max(max, `Keep it under ${max} characters.`);

export const addressSchema = z.object({
  addressLine1: requiredText(200, "Enter your street address."),
  addressLine2: optionalText(200, "this line"),
  city: requiredText(100, "Enter your city or town."),
  province: z.enum(PROVINCES, { message: "Choose your province." }),
  postalCode: z.string().trim().regex(POSTAL_CODE_PATTERN, "Enter your 4-digit postal code."),
});

export const deliveryDetailsSchema = z
  .object({
    firstName: nameSchema("first name"),
    lastName: nameSchema("surname"),
    phone: z.string().trim().regex(PHONE_PATTERN, "Enter a phone number, like 082 123 4567."),
  })
  .extend(addressSchema.shape);

export type DeliveryDetails = z.output<typeof deliveryDetailsSchema>;

type ProfileFields = {
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  province: string | null;
  postalCode: string | null;
};

/** The profile's delivery details if they're complete and valid, otherwise null. */
export function completeDeliveryDetails(profile: ProfileFields | null): DeliveryDetails | null {
  if (!profile) return null;
  const result = deliveryDetailsSchema.safeParse({
    firstName: profile.firstName ?? "",
    lastName: profile.lastName ?? "",
    phone: profile.phone ?? "",
    addressLine1: profile.addressLine1 ?? "",
    addressLine2: profile.addressLine2 ?? "",
    city: profile.city ?? "",
    province: profile.province ?? "",
    postalCode: profile.postalCode ?? "",
  });
  return result.success ? result.data : null;
}

/** "1 Long St, Unit 4, Cape Town, Western Cape, 8001" */
export function formatAddress(details: Pick<DeliveryDetails, "addressLine1" | "addressLine2" | "city" | "province" | "postalCode">): string {
  return [details.addressLine1, details.addressLine2, details.city, details.province, details.postalCode]
    .filter(Boolean)
    .join(", ");
}

export const DELIVERY_PROFILE_SELECT = {
  firstName: true,
  lastName: true,
  phone: true,
  addressLine1: true,
  addressLine2: true,
  city: true,
  province: true,
  postalCode: true,
} as const;

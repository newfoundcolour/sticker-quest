import "server-only";
import { prisma } from "@/lib/prisma";
import { DELIVERY_PROFILE_SELECT, PROVINCES } from "@/lib/validation/deliveryDetails";
import type { DeliveryValues } from "@/components/checkout/DeliveryFields";

const BLANK: DeliveryValues = {
  firstName: "",
  lastName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  province: "",
  postalCode: "",
};

/**
 * Splits an order's stored address back into fields. Orders keep it as one
 * line — "street, [unit,] city, province, postal code" — so this only
 * returns fields when the shape is clear; a guess is never forced.
 */
function addressFromOrder(shippingAddress: string): Partial<DeliveryValues> {
  const parts = shippingAddress.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length < 4) return {};
  const [postalCode, province, city] = parts.slice(-3).reverse();
  if (!(PROVINCES as readonly string[]).includes(province) || !/^\d{4}$/.test(postalCode)) return {};
  return {
    addressLine1: parts[0],
    addressLine2: parts.slice(1, -3).join(", "),
    city,
    province,
    postalCode,
  };
}

/**
 * The details to prefill the checkout popup and settings with, for the
 * signed-in customer only: their Profile first, and anything it's missing
 * from their most recent order. Only ever a starting point — nothing is
 * saved until they submit, and the server validates it then.
 */
export async function savedDeliveryValues(userId: string): Promise<DeliveryValues> {
  const [profile, lastOrder] = await Promise.all([
    prisma.profile.findUnique({ where: { id: userId }, select: DELIVERY_PROFILE_SELECT }),
    prisma.order.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { customerName: true, phone: true, shippingAddress: true },
    }),
  ]);

  const fromProfile: DeliveryValues = {
    firstName: profile?.firstName ?? "",
    lastName: profile?.lastName ?? "",
    phone: profile?.phone ?? "",
    addressLine1: profile?.addressLine1 ?? "",
    addressLine2: profile?.addressLine2 ?? "",
    city: profile?.city ?? "",
    province: profile?.province ?? "",
    postalCode: profile?.postalCode ?? "",
  };
  if (!lastOrder) return fromProfile;

  const [orderFirst = "", ...orderRest] = lastOrder.customerName.trim().split(/\s+/);
  const fromOrder: Partial<DeliveryValues> = {
    firstName: orderFirst,
    lastName: orderRest.join(" "),
    phone: lastOrder.phone,
    ...addressFromOrder(lastOrder.shippingAddress),
  };

  // The address is one unit: take it all from the order only when the profile has none of it.
  const profileHasAddress = Boolean(fromProfile.addressLine1 || fromProfile.city || fromProfile.postalCode);
  const merged = { ...BLANK };
  for (const key of Object.keys(BLANK) as (keyof DeliveryValues)[]) {
    const isAddress = !["firstName", "lastName", "phone"].includes(key);
    merged[key] = fromProfile[key] || (isAddress && profileHasAddress ? "" : (fromOrder[key] ?? ""));
  }
  return merged;
}

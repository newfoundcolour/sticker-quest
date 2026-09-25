"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getPricedCart } from "@/lib/cartPricing";
import { clearCart } from "@/lib/cart";

export type CheckoutResult = { ok: false; error: string };

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

/**
 * PayFast isn't wired up yet (see CLAUDE.md — payments are still a TODO), so
 * this writes the order straight to `awaiting_proof` and treats checkout as
 * functionally complete. Swap in a real payment step before this create()
 * once PayFast is integrated.
 */
export async function submitOrderAction(
  _prevState: CheckoutResult | undefined,
  formData: FormData,
): Promise<CheckoutResult> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const addressLine1 = String(formData.get("addressLine1") ?? "").trim();
  const addressLine2 = String(formData.get("addressLine2") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const province = String(formData.get("province") ?? "").trim();
  const postalCode = String(formData.get("postalCode") ?? "").trim();

  if (!fullName || !email || !phone || !addressLine1 || !city || !province || !postalCode) {
    return { ok: false, error: "Please fill in all required fields." };
  }
  if (!EMAIL_PATTERN.test(email)) {
    return { ok: false, error: "Enter a valid email address." };
  }

  const { items, unavailableItemIds, subtotal } = await getPricedCart();
  if (items.length === 0) {
    return { ok: false, error: "Your cart is empty." };
  }
  if (unavailableItemIds.length > 0) {
    return {
      ok: false,
      error: "Some items in your cart are no longer available — remove them to continue.",
    };
  }

  const shippingAddress = [addressLine1, addressLine2, city, province, postalCode]
    .filter(Boolean)
    .join(", ");

  const order = await prisma.order.create({
    data: {
      customerName: fullName,
      email,
      phone,
      shippingAddress,
      totalPrice: subtotal,
      items: {
        create: items.map((item) => ({
          stickerType: item.stickerType,
          cutType: item.cutType,
          shape: item.shape,
          finish: item.finish,
          roundedCorners: item.roundedCorners ?? false,
          whiteInk: item.whiteInk,
          lamination: item.lamination,
          widthCm: item.widthCm,
          heightCm: item.heightCm,
          quantity: item.quantity,
          artworkUrl: item.artworkUrl,
          artworkFilename: item.artworkFilename,
          pricePerUnit: item.pricePerUnit,
          totalPrice: item.totalPrice,
        })),
      },
    },
  });

  await clearCart();
  redirect(`/checkout/success?order=${order.id}`);
}

"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getPricedCart } from "@/lib/cartPricing";
import { clearCart, setLastOrderCookie } from "@/lib/cart";
import { getSessionUser, isEmailVerified } from "@/lib/auth";

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
  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    return { ok: false, error: "Enter a valid email address." };
  }
  // Public endpoint: cap every field so nobody can store megabytes of text.
  const tooLong =
    fullName.length > 120 ||
    phone.length > 30 ||
    [addressLine1, addressLine2, city, province].some((v) => v.length > 200) ||
    postalCode.length > 12;
  if (tooLong) {
    return { ok: false, error: "One of those fields is too long. Please shorten it." };
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
  // Belt and braces: a valid cart always has a positive price.
  if (!(subtotal > 0) || items.some((i) => !(i.totalPrice > 0))) {
    return { ok: false, error: "Something's off with your cart. Please remove the item and add it again." };
  }

  const shippingAddress = [addressLine1, addressLine2, city, province, postalCode]
    .filter(Boolean)
    .join(", ");

  // Attach the order to the logged-in customer. The id comes from the verified
  // session only — never from the form.
  const user = await getSessionUser();
  const profile =
    user && isEmailVerified(user)
      ? await prisma.profile.findUnique({ where: { id: user.id }, select: { id: true } })
      : null;
  const userId = profile?.id ?? null;

  const order = await prisma.order.create({
    data: {
      userId,
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
          sheetMaterial: item.sheetMaterial ?? null,
          sheetCuts: item.sheetCuts ?? null,
          artworkUrl: item.artworkUrl,
          artworkFilename: item.artworkFilename,
          pricePerUnit: item.pricePerUnit,
          totalPrice: item.totalPrice,
        })),
      },
    },
  });

  await clearCart();
  await setLastOrderCookie(order.id);
  redirect(`/checkout/success?order=${order.id}`);
}

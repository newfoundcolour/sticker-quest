"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";
import { getPricedCart } from "@/lib/cartPricing";
import { checkDiscount } from "@/lib/discounts";
import { clearCart, setLastOrderCookie } from "@/lib/cart";
import { getSessionUser, isEmailVerified, requireVerifiedUser } from "@/lib/auth";
import { keepValues, type AuthFormState } from "@/lib/authForms";
import { fieldErrors, formObject } from "@/lib/validation/auth";
import {
  DELIVERY_PROFILE_SELECT,
  addressSchema,
  completeDeliveryDetails,
  deliveryDetailsSchema,
  formatAddress,
  type DeliveryDetails,
} from "@/lib/validation/deliveryDetails";

/**
 * Why the cart's Checkout button couldn't place the order. The cart already
 * knows most of this when it renders; the server re-checks every time.
 */
export type CheckoutState =
  | { ok: false; reason: "login" | "verify" | "details" }
  | { ok: false; reason: "cart"; message: string }
  | undefined;

type CartProblem = { ok: false; reason: "cart"; message: string };

/**
 * Creates the order from the cart and the customer's saved delivery details,
 * then sends them to the confirmation page.
 *
 * TODO(payfast): this is where the PayFast redirect goes. Payment isn't wired
 * up yet, so the order goes straight to `awaiting_proof`.
 */
async function placeOrder(user: User, details: DeliveryDetails): Promise<CartProblem> {
  const { items, unavailableItemIds, subtotal, discount, discountProblem, shippingFee, total } = await getPricedCart();
  if (items.length === 0) {
    return { ok: false, reason: "cart", message: "Your cart is empty." };
  }
  if (unavailableItemIds.length > 0) {
    return { ok: false, reason: "cart", message: "Some stickers in your cart can't be ordered any more. Remove them to continue." };
  }
  // Don't quietly charge full price for a code the customer thinks they have.
  if (discountProblem) {
    return { ok: false, reason: "cart", message: `${discountProblem.message} Remove the code to check out at full price.` };
  }
  // Belt and braces: a valid cart always has a positive price.
  if (!(subtotal > 0) || items.some((i) => !(i.totalPrice > 0))) {
    return { ok: false, reason: "cart", message: "Something's off with your cart. Please remove the item and add it again." };
  }

  const orderData = {
    // Everything about the customer comes from the verified session and
    // their saved profile — nothing from the browser.
    userId: user.id,
    customerName: `${details.firstName} ${details.lastName}`,
    email: user.email ?? "",
    phone: details.phone,
    shippingAddress: formatAddress(details),
    shippingFee,
    discountAmount: discount?.amount ?? 0,
    discountCodeText: discount?.code ?? null,
    totalPrice: total,
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
  };

  // With a code, lock its row and check it again inside the transaction, so
  // two checkouts can't both take the last use (or a customer's one use).
  type Placed = { id: string } | { problem: string };
  const placed: Placed = await prisma.$transaction(async (tx) => {
    let discountCodeId: string | null = null;
    if (discount) {
      await tx.$queryRaw`SELECT "id" FROM "DiscountCode" WHERE "code" = ${discount.code} FOR UPDATE`;
      const check = await checkDiscount(discount.code, { subtotal, userId: user.id, db: tx });
      if (!check.ok) return { problem: check.message };
      if (check.amount !== discount.amount) return { problem: "Your discount changed. Check the new total and try again." };
      discountCodeId = check.code.id;
    }
    const created = await tx.order.create({ data: { ...orderData, discountCodeId } });
    return { id: created.id };
  });
  if ("problem" in placed) {
    return { ok: false, reason: "cart", message: placed.problem };
  }
  const order = placed;

  await clearCart();
  await setLastOrderCookie(order.id);
  redirect(`/checkout/success?order=${order.id}`);
}

/** A verified customer with a Profile row, or why not. */
async function checkoutUser(): Promise<{ user: User } | { reason: "login" | "verify" }> {
  const user = await getSessionUser();
  if (!user) return { reason: "login" };
  if (!isEmailVerified(user) || !user.email) return { reason: "verify" };
  return { user };
}

/** The cart's Checkout button. */
export async function checkoutAction(): Promise<CheckoutState> {
  const who = await checkoutUser();
  if ("reason" in who) return { ok: false, reason: who.reason };

  const profile = await prisma.profile.findUnique({ where: { id: who.user.id }, select: DELIVERY_PROFILE_SELECT });
  const details = completeDeliveryDetails(profile);
  if (!details) return { ok: false, reason: "details" };

  return placeOrder(who.user, details);
}

/**
 * The cart's details popup. Saves name, surname, phone and address to the
 * customer's own profile, then — when it was opened by Checkout
 * (intent=checkout) — places the order.
 */
export async function saveDeliveryDetailsAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const who = await checkoutUser();
  if ("reason" in who) {
    return { ok: false, message: who.reason === "login" ? "Log in to save your details." : "Verify your email first." };
  }

  const parsed = deliveryDetailsSchema.safeParse(formObject(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: fieldErrors(parsed.error), values: keepValues(formData) };
  }

  const { firstName, lastName, phone, addressLine1, addressLine2, city, province, postalCode } = parsed.data;
  await prisma.profile.update({
    where: { id: who.user.id },
    data: { firstName, lastName, phone, addressLine1, addressLine2, city, province, postalCode },
  });
  // The nav greets the customer by first name; the cart shows the address.
  revalidatePath("/", "layout");

  if (formData.get("intent") === "checkout") {
    const problem = await placeOrder(who.user, parsed.data);
    return { ok: false, message: problem.message };
  }
  return { ok: true, message: "Delivery details saved." };
}

/** Account settings: just the delivery address. */
export async function updateAddressAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const user = await requireVerifiedUser("/account/settings");

  const parsed = addressSchema.safeParse(formObject(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: fieldErrors(parsed.error), values: keepValues(formData) };
  }

  await prisma.profile.update({ where: { id: user.id }, data: parsed.data });
  revalidatePath("/account/settings");
  return { ok: true, message: "Address saved." };
}

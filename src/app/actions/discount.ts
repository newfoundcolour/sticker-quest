"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth";
import { clearAppliedDiscountCode, setAppliedDiscountCode } from "@/lib/cart";
import { getPricedCart } from "@/lib/cartPricing";
import { checkDiscount, normalizeDiscountCode } from "@/lib/discounts";
import { RATE_LIMITS, TOO_MANY_ATTEMPTS, clientIp, rateLimit } from "@/lib/rateLimit";

export type DiscountFormState = { ok: boolean; message: string } | undefined;

/**
 * The cart's Discount card. Checks the code against the cart as priced on the
 * server and, if it gives a discount, remembers it in a cookie. The amount is
 * never stored — it's re-checked on every cart read and at checkout.
 */
export async function applyDiscountAction(_prev: DiscountFormState, formData: FormData): Promise<DiscountFormState> {
  if (!(await rateLimit("discount-apply", await clientIp(), RATE_LIMITS.discountApplyPerIp))) {
    return { ok: false, message: TOO_MANY_ATTEMPTS };
  }

  const code = normalizeDiscountCode(formData.get("code"));
  if (!code) return { ok: false, message: "Enter a code first." };

  const { items, subtotal } = await getPricedCart();
  if (items.length === 0) return { ok: false, message: "Add some stickers first." };

  const user = await getSessionUser();
  const check = await checkDiscount(code, { subtotal, userId: user?.id });
  if (!check.ok) return { ok: false, message: check.message };

  await setAppliedDiscountCode(check.code.code);
  revalidatePath("/cart");
  return { ok: true, message: `${check.code.code} applied.` };
}

export async function removeDiscountAction(): Promise<void> {
  await clearAppliedDiscountCode();
  revalidatePath("/cart");
}

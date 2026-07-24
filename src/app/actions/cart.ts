"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { addToCart, removeFromCart, updateCartItemQuantity, type CartItem } from "@/lib/cart";
import { MIN_QUANTITY, MAX_QUANTITY } from "@/lib/pricingUtils";

/** Called from the configurator once every step is complete. Redirects to the cart on success. */
export async function addToCartAction(item: Omit<CartItem, "id">): Promise<void> {
  await addToCart(item);
  revalidatePath("/", "layout");
  redirect("/cart");
}

export async function removeFromCartAction(itemId: string): Promise<void> {
  await removeFromCart(itemId);
  revalidatePath("/", "layout");
}

export async function updateCartItemQuantityAction(
  itemId: string,
  formData: FormData,
): Promise<void> {
  const raw = Number(formData.get("quantity"));
  const quantity = Number.isFinite(raw)
    ? Math.min(MAX_QUANTITY, Math.max(MIN_QUANTITY, Math.round(raw)))
    : MIN_QUANTITY;
  await updateCartItemQuantity(itemId, quantity);
  revalidatePath("/", "layout");
}

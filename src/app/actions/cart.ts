"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { addToCart, removeFromCart, updateCartItemQuantity, type CartItem } from "@/lib/cart";
import { clampQuantity } from "@/lib/pricingUtils";
import { hasFinishChoice } from "@/lib/orderLabels";

/** Called from the configurator once every step is complete. Redirects to the cart on success. */
export async function addToCartAction(item: Omit<CartItem, "id">): Promise<void> {
  await addToCart(hasFinishChoice(item.stickerType) ? item : { ...item, finish: "MATTE" });
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
  const quantity = clampQuantity(Number(formData.get("quantity")));
  await updateCartItemQuantity(itemId, quantity);
  revalidatePath("/", "layout");
}

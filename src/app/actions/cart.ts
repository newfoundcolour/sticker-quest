"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { addToCart, removeFromCart, updateCartItemQuantity, type CartItem } from "@/lib/cart";
import { clampQuantity } from "@/lib/pricingUtils";
import {
  hasFinishChoice,
  hasWhiteInkOption,
  SHEET_CUTS_VALUES,
  SHEET_MATERIALS,
} from "@/lib/orderLabels";

/** Called from the configurator once every step is complete. Redirects to the cart on success. */
export async function addToCartAction(item: Omit<CartItem, "id">): Promise<void> {
  const { sheetMaterial, sheetCuts, ...rest } = item;
  let material = item.stickerType;
  let sheet: Partial<CartItem> = {};

  // Sheets are always kiss cut on a rectangular sheet, with their own material and cut count.
  if (item.stickerType === "STICKER_SHEETS") {
    if (!sheetMaterial || !SHEET_MATERIALS.includes(sheetMaterial)) return;
    if (!sheetCuts || !SHEET_CUTS_VALUES.includes(sheetCuts)) return;
    material = sheetMaterial;
    sheet = { sheetMaterial, sheetCuts, cutType: "KISS", shape: "RECTANGLE", roundedCorners: false };
  }

  await addToCart({
    ...rest,
    ...sheet,
    finish: hasFinishChoice(material) ? item.finish : "MATTE",
    whiteInk: hasWhiteInkOption(material) && item.whiteInk,
  });
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

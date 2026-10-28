"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { addToCart, removeFromCart, updateCartItemQuantity, type CartItem } from "@/lib/cart";
import { clampQuantity } from "@/lib/pricingUtils";
import {
  hasCutChoice,
  hasFinishChoice,
  hasWhiteInkOption,
  SHEET_CUTS_VALUES,
  SHEET_MATERIALS,
} from "@/lib/orderLabels";
import { isOwnArtworkUrl } from "@/lib/artworkUrls";
import { copyArtwork } from "@/lib/cloudinary";
import { getSessionUser, isEmailVerified } from "@/lib/auth";
import { findCustomerOrderItem } from "@/lib/customerOrders";

export type AddToCartInput = Omit<CartItem, "id"> & {
  /** Set when the artwork is a past order item's (reorder); the server copies it. */
  reorderSourceItemId?: string;
};

/**
 * Resolves the artwork for a new cart line. A reorder gets a fresh copy of
 * the customer's own past artwork (ownership re-checked here, from the
 * session); anything else must be a file we uploaded to Cloudinary.
 */
async function resolveArtwork(input: AddToCartInput): Promise<{ artworkUrl: string; artworkFilename: string } | null> {
  if (input.reorderSourceItemId) {
    const user = await getSessionUser();
    if (!user || !isEmailVerified(user)) return null;
    const source = await findCustomerOrderItem(user.id, input.reorderSourceItemId);
    if (!source || !isOwnArtworkUrl(source.artworkUrl)) return null;
    const copy = await copyArtwork(source.artworkUrl);
    return { artworkUrl: copy.url, artworkFilename: source.artworkFilename ?? input.artworkFilename };
  }

  if (!isOwnArtworkUrl(input.artworkUrl)) return null;
  return { artworkUrl: input.artworkUrl, artworkFilename: String(input.artworkFilename ?? "").slice(0, 255) };
}

/** Called from the configurator once every step is complete. Redirects to the cart on success. */
export async function addToCartAction(input: AddToCartInput): Promise<void> {
  // Pull out everything that must not be copied straight into the cart cookie.
  const { reorderSourceItemId: _reorder, artworkUrl: _url, artworkFilename: _name, ...item } = input;
  void _reorder;
  void _url;
  void _name;
  const { sheetMaterial, sheetCuts, ...rest } = item;
  let material = item.stickerType;
  let sheet: Partial<CartItem> = {};

  // Sheets are always kiss cut on a rectangular sheet, with their own material and cut count.
  if (item.stickerType === "STICKER_SHEETS") {
    if (!sheetMaterial || !SHEET_MATERIALS.includes(sheetMaterial)) return;
    if (!sheetCuts || !SHEET_CUTS_VALUES.includes(sheetCuts)) return;
    material = sheetMaterial;
    sheet = { sheetMaterial, sheetCuts, cutType: "KISS", shape: "RECTANGLE", roundedCorners: false };
  } else if (!hasCutChoice(item.stickerType)) {
    sheet = { cutType: "KISS" };
  }

  const artwork = await resolveArtwork(input);
  if (!artwork) return;

  await addToCart({
    ...rest,
    ...sheet,
    ...artwork,
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

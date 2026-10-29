"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  addToCart,
  cartItemInputSchema,
  removeFromCart,
  replaceCartItem,
  updateCartItemQuantity,
  type CartItem,
} from "@/lib/cart";
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
  /** Set when editing a cart line from /cart: the new choices replace that line. */
  replaceCartItemId?: string;
};

/**
 * Resolves the artwork for a new cart line. A reorder gets a fresh copy of
 * the customer's own past artwork (ownership re-checked here, from the
 * session); anything else must be a file we uploaded to Cloudinary.
 */
async function resolveArtwork(input: AddToCartInput): Promise<{ artworkUrl: string; artworkFilename: string } | null> {
  if (input.reorderSourceItemId !== undefined) {
    if (typeof input.reorderSourceItemId !== "string") return null;
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
  // This is a public endpoint: validate every field server-side (types, enum
  // values, size and quantity limits) before anything else happens.
  const config = cartItemInputSchema.omit({ artworkUrl: true, artworkFilename: true }).safeParse(input);
  if (!config.success) return;
  const item = config.data;
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

  const line = cartItemInputSchema.safeParse({
    ...rest,
    ...sheet,
    ...artwork,
    finish: hasFinishChoice(material) ? item.finish : "MATTE",
    whiteInk: hasWhiteInkOption(material) && item.whiteInk,
  });
  if (!line.success) return;
  // The cart is the visitor's own cookie, so any line id in it is theirs to replace.
  const replaceId = input.replaceCartItemId;
  if (typeof replaceId === "string" && replaceId.length > 0 && replaceId.length <= 64) {
    await replaceCartItem(replaceId, line.data);
  } else {
    await addToCart(line.data);
  }
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

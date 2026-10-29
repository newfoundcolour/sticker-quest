import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { z } from "zod";
import type { CutType, Finish, Shape, SheetCuts, StickerType } from "@/generated/prisma/client";
import {
  CutType as CutTypeEnum,
  Finish as FinishEnum,
  Shape as ShapeEnum,
  SheetCuts as SheetCutsEnum,
  StickerType as StickerTypeEnum,
} from "@/generated/prisma/enums";
import { MAX_SIZE_CM, MIN_QUANTITY, MIN_SIZE_CM } from "@/lib/pricingUtils";
import { isOwnArtworkUrl } from "@/lib/artworkUrls";

const CART_COOKIE = "sq_cart";
const CART_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export type CartItem = {
  id: string;
  stickerType: StickerType;
  cutType: CutType;
  shape: Shape;
  finish: Finish;
  /** Optional so carts saved before the option existed still parse. */
  roundedCorners?: boolean;
  whiteInk: boolean;
  lamination: boolean;
  widthCm: number;
  heightCm: number;
  quantity: number;
  /** Sticker sheets only; see OrderItem.sheetMaterial / sheetCuts. */
  sheetMaterial?: StickerType;
  sheetCuts?: SheetCuts;
  artworkUrl: string;
  artworkFilename: string;
};

const enumOf = <T extends Record<string, string>>(e: T) => z.enum(Object.values(e) as [T[keyof T], ...T[keyof T][]]);
const sizeCm = z.number().finite().min(MIN_SIZE_CM).max(MAX_SIZE_CM);

/**
 * What a valid cart line looks like. The cart lives in a cookie the visitor
 * can edit, and addToCartAction can be called directly, so every line is
 * checked against this on the way in *and* every time the cart is read:
 * real enum values, sizes within the printer limits, at least the minimum
 * quantity, and artwork we uploaded ourselves.
 */
export const cartItemInputSchema = z.object({
  stickerType: enumOf(StickerTypeEnum),
  cutType: enumOf(CutTypeEnum),
  shape: enumOf(ShapeEnum),
  finish: enumOf(FinishEnum),
  roundedCorners: z.boolean().optional(),
  whiteInk: z.boolean(),
  lamination: z.boolean(),
  widthCm: sizeCm,
  heightCm: sizeCm,
  quantity: z.number().int().min(MIN_QUANTITY).max(2_147_483_647),
  sheetMaterial: enumOf(StickerTypeEnum).optional(),
  sheetCuts: enumOf(SheetCutsEnum).optional(),
  artworkUrl: z.string().max(2048).refine((url) => isOwnArtworkUrl(url), "Unknown artwork"),
  artworkFilename: z.string().max(255),
});
const cartItemSchema = cartItemInputSchema.extend({ id: z.string().min(1).max(64) });

/**
 * The cart is the full line-item list, stored client-side in a cookie —
 * there's no server session for anonymous customers. Only the configuration
 * choices live here; price is always recomputed server-side from live
 * PricingRule data (see cartPricing.ts), never trusted from the cookie.
 * Lines that fail validation (tampered or out of date) are dropped.
 */
export async function getCart(): Promise<CartItem[]> {
  const store = await cookies();
  const raw = store.get(CART_COOKIE)?.value;
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((line) => {
      const result = cartItemSchema.safeParse(line);
      return result.success ? [result.data] : [];
    });
  } catch {
    return [];
  }
}

async function setCart(items: CartItem[]): Promise<void> {
  const store = await cookies();
  store.set(CART_COOKIE, JSON.stringify(items), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: CART_COOKIE_MAX_AGE,
  });
}

export async function addToCart(item: Omit<CartItem, "id">): Promise<void> {
  const items = await getCart();
  items.push({ ...item, id: randomUUID() });
  await setCart(items);
}

/**
 * Swaps a line for its edited version, keeping its place in the cart.
 * Adds it as a new line if the old one has gone (e.g. removed in another tab).
 */
export async function replaceCartItem(itemId: string, item: Omit<CartItem, "id">): Promise<void> {
  const items = await getCart();
  const index = items.findIndex((i) => i.id === itemId);
  if (index === -1) items.push({ ...item, id: randomUUID() });
  else items[index] = { ...item, id: itemId };
  await setCart(items);
}

export async function removeFromCart(itemId: string): Promise<void> {
  const items = await getCart();
  await setCart(items.filter((i) => i.id !== itemId));
}

export async function updateCartItemQuantity(itemId: string, quantity: number): Promise<void> {
  const items = await getCart();
  await setCart(items.map((i) => (i.id === itemId ? { ...i, quantity } : i)));
}

export async function clearCart(): Promise<void> {
  const store = await cookies();
  store.delete(CART_COOKIE);
}

const LAST_ORDER_COOKIE = "sq_last_order";

/**
 * Remembers which order this browser just placed, so /checkout/success only
 * shows an order to the browser that created it — not to anyone holding the id.
 */
export async function setLastOrderCookie(orderId: string): Promise<void> {
  const store = await cookies();
  store.set(LAST_ORDER_COOKIE, orderId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/checkout/success",
    maxAge: 60 * 60, // 1 hour
  });
}

export async function getLastOrderId(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(LAST_ORDER_COOKIE)?.value;
}

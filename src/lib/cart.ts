import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import type { CutType, Finish, Shape, SheetCuts, StickerType } from "@/generated/prisma/client";

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

/**
 * The cart is the full line-item list, stored client-side in a cookie —
 * there's no server session for anonymous customers. Only the configuration
 * choices live here; price is always recomputed server-side from live
 * PricingRule data (see cartPricing.ts), never trusted from the cookie.
 */
export async function getCart(): Promise<CartItem[]> {
  const store = await cookies();
  const raw = store.get(CART_COOKIE)?.value;
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
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

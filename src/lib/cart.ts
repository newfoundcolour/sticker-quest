import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import type { CutType, Finish, Shape, StickerType } from "@/generated/prisma/client";

const CART_COOKIE = "sq_cart";
const CART_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export type CartItem = {
  id: string;
  stickerType: StickerType;
  cutType: CutType;
  shape: Shape;
  finish: Finish;
  whiteInk: boolean;
  lamination: boolean;
  widthCm: number;
  heightCm: number;
  quantity: number;
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

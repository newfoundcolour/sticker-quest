import { getCart, type CartItem } from "@/lib/cart";
import { getPricingConfig, MissingPricingRuleError } from "@/lib/pricing";
import { calculateStickerPricing } from "@/lib/pricingUtils";
import { DISCONTINUED_STICKER_TYPES } from "@/lib/stickerTypeSlug";
import type { PricingConfig } from "@/lib/pricing";
import type { StickerType } from "@/generated/prisma/client";

export type PricedCartItem = CartItem & {
  pricePerUnit: number;
  totalPrice: number;
  discountPercent: number;
};

export type PricedCart = {
  items: PricedCartItem[];
  /** Cart items whose sticker type is discontinued or has no PricingRule — excluded from the total, flagged for removal. */
  unavailableItemIds: string[];
  subtotal: number;
};

/**
 * Re-derives every cart line's price from live PricingRule/PricingSetting
 * data rather than trusting anything stored in the cart cookie — the cookie
 * only ever carries the customer's configuration choices.
 */
export async function getPricedCart(): Promise<PricedCart> {
  const cartItems = await getCart();
  if (cartItems.length === 0) {
    return { items: [], unavailableItemIds: [], subtotal: 0 };
  }

  const distinctTypes = [...new Set(cartItems.map((i) => i.stickerType))];
  const configByType = new Map<StickerType, PricingConfig>();
  const unavailableTypes = new Set<StickerType>();

  await Promise.all(
    distinctTypes.map(async (type) => {
      // A cart cookie can outlive a type being discontinued.
      if (DISCONTINUED_STICKER_TYPES.has(type)) {
        unavailableTypes.add(type);
        return;
      }
      try {
        configByType.set(type, await getPricingConfig(type));
      } catch (error) {
        if (error instanceof MissingPricingRuleError) {
          unavailableTypes.add(type);
        } else {
          throw error;
        }
      }
    }),
  );

  const items: PricedCartItem[] = [];
  const unavailableItemIds: string[] = [];

  for (const item of cartItems) {
    const config = configByType.get(item.stickerType);
    if (!config) {
      unavailableItemIds.push(item.id);
      continue;
    }
    const result = calculateStickerPricing({
      config,
      isHolographic: item.stickerType === "HOLOGRAPHIC",
      whiteInk: item.whiteInk,
      lamination: item.lamination,
      widthCm: item.widthCm,
      heightCm: item.heightCm,
      quantity: item.quantity,
    });
    items.push({
      ...item,
      pricePerUnit: result.pricePerUnit,
      totalPrice: result.totalPrice,
      discountPercent: result.discountPercent,
    });
  }

  const subtotal = Math.round(items.reduce((sum, i) => sum + i.totalPrice, 0) * 100) / 100;

  return { items, unavailableItemIds, subtotal };
}

import { getAppliedDiscountCode, getCart, type CartItem } from "@/lib/cart";
import { getSessionUser } from "@/lib/auth";
import { checkDiscount, describeDiscount } from "@/lib/discounts";
import { getPricingConfig, getShippingFee, MissingPricingRuleError } from "@/lib/pricing";
import { calculateStickerPricing } from "@/lib/pricingUtils";
import { DISCONTINUED_STICKER_TYPES } from "@/lib/stickerTypeSlug";
import { itemMaterial } from "@/lib/orderLabels";
import type { PricingConfig } from "@/lib/pricing";
import type { StickerType } from "@/generated/prisma/client";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export type PricedCartItem = CartItem & {
  pricePerUnit: number;
  totalPrice: number;
  discountPercent: number;
};

export type PricedCart = {
  items: PricedCartItem[];
  /** Cart items whose sticker type is discontinued or has no PricingRule — excluded from the total, flagged for removal. */
  unavailableItemIds: string[];
  /** The same lines, so the cart can show what they were and let the customer remove them. */
  unavailableItems: CartItem[];
  /** Sum of the available lines. */
  subtotal: number;
  /** The applied code, when it still gives a discount on this cart. */
  discount: { code: string; label: string; amount: number } | null;
  /** The applied code when it no longer does, and why (shown in the Discount card). */
  discountProblem: { code: string; message: string } | null;
  /** Flat shipping fee (0 when nothing can be ordered). */
  shippingFee: number;
  /** subtotal - discount + shippingFee — what the customer pays. */
  total: number;
};

/**
 * Re-derives every cart line's price from live PricingRule/PricingSetting
 * data rather than trusting anything stored in the cart cookie — the cookie
 * only ever carries the customer's configuration choices.
 */
export async function getPricedCart(): Promise<PricedCart> {
  const cartItems = await getCart();
  if (cartItems.length === 0) {
    return {
      items: [],
      unavailableItemIds: [],
      unavailableItems: [],
      subtotal: 0,
      discount: null,
      discountProblem: null,
      shippingFee: 0,
      total: 0,
    };
  }

  // A sticker sheet is priced on its material's rate; everything else on its own type's.
  const distinctTypes = [...new Set(cartItems.flatMap((i) => [i.stickerType, itemMaterial(i)]))];
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
  const unavailableItems: CartItem[] = [];

  for (const item of cartItems) {
    const material = itemMaterial(item);
    const config = configByType.get(material);
    if (!config || unavailableTypes.has(item.stickerType)) {
      unavailableItems.push(item);
      continue;
    }
    const result = calculateStickerPricing({
      config,
      isHolographic: material === "HOLOGRAPHIC",
      whiteInk: item.whiteInk,
      lamination: item.lamination,
      widthCm: item.widthCm,
      heightCm: item.heightCm,
      quantity: item.quantity,
      surchargePercent: item.sheetCuts ? config.sheetCutSurchargePercent[item.sheetCuts] : 0,
    });
    items.push({
      ...item,
      pricePerUnit: result.pricePerUnit,
      totalPrice: result.totalPrice,
      discountPercent: result.discountPercent,
    });
  }

  const subtotal = round2(items.reduce((sum, i) => sum + i.totalPrice, 0));
  const shippingFee = items.length > 0 ? await getShippingFee() : 0;

  // The discount code is re-checked against the live DiscountCode row every time.
  let discount: PricedCart["discount"] = null;
  let discountProblem: PricedCart["discountProblem"] = null;
  const appliedCode = await getAppliedDiscountCode();
  if (appliedCode && items.length > 0) {
    const user = await getSessionUser();
    const check = await checkDiscount(appliedCode, { subtotal, userId: user?.id });
    if (check.ok) {
      discount = { code: check.code.code, label: describeDiscount(check.code), amount: check.amount };
    } else {
      discountProblem = { code: appliedCode, message: check.message };
    }
  }

  return {
    items,
    unavailableItemIds: unavailableItems.map((i) => i.id),
    unavailableItems,
    subtotal,
    discount,
    discountProblem,
    shippingFee,
    total: round2(subtotal - (discount?.amount ?? 0) + shippingFee),
  };
}

"use server";

import { getPricingConfig, type PricingConfig } from "@/lib/pricing";
import type { StickerType } from "@/generated/prisma/client";

/**
 * Fetches everything the formula needs for one sticker type in a single
 * round trip. The configurator page for a given type calls this once (or a
 * server component fetches it directly) and computes price locally for
 * every subsequent shape/size/add-on/quantity change.
 */
export async function getPricingConfigForType(
  stickerType: StickerType,
): Promise<PricingConfig> {
  return getPricingConfig(stickerType);
}

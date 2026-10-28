import { DISCONTINUED_STICKER_TYPES, STICKER_TYPE_SLUGS } from "@/lib/stickerTypeSlug";
import type { StickerType } from "@/generated/prisma/client";

/**
 * Link that opens the configurator prefilled from one of the customer's past
 * order items. The server re-checks that the item belongs to the logged-in
 * customer, and prices it at today's rates — never the old total.
 */
export function reorderHref(item: { id: string; stickerType: StickerType }): string | null {
  if (DISCONTINUED_STICKER_TYPES.has(item.stickerType)) return null;
  return `/configure/${STICKER_TYPE_SLUGS[item.stickerType]}?reorder=${encodeURIComponent(item.id)}`;
}

import type { ConversationStatus, SupportCategory } from "@/generated/prisma/client";

/** Client-safe labels and limits for support messaging. */

export const SUPPORT_CATEGORIES: SupportCategory[] = [
  "PRINT_QUALITY",
  "WRONG_SIZE",
  "WRONG_DESIGN",
  "DAMAGED_IN_SHIPPING",
  "MISSING_ITEM",
  "SHIPPING_DELIVERY",
  "OTHER",
];

export const SUPPORT_CATEGORY_LABELS: Record<SupportCategory, string> = {
  PRINT_QUALITY: "Print quality",
  WRONG_SIZE: "Wrong size",
  WRONG_DESIGN: "Wrong design",
  DAMAGED_IN_SHIPPING: "Damaged in shipping",
  MISSING_ITEM: "Missing item",
  SHIPPING_DELIVERY: "Shipping / Delivery",
  OTHER: "Other",
};

export const SUPPORT_CATEGORY_ICONS: Record<SupportCategory, string> = {
  PRINT_QUALITY: "🎨",
  WRONG_SIZE: "📏",
  WRONG_DESIGN: "🖼️",
  DAMAGED_IN_SHIPPING: "📦",
  MISSING_ITEM: "🔍",
  SHIPPING_DELIVERY: "🚚",
  OTHER: "💬",
};

export const CONVERSATION_STATUS_LABELS: Record<ConversationStatus, string> = {
  OPEN: "Open",
  RESOLVED: "Resolved",
};

export const MESSAGE_MAX_LENGTH = 5000;
export const ATTACHMENT_MAX_BYTES = 5 * 1024 * 1024;
export const ATTACHMENT_ACCEPT = ".jpg,.jpeg,.png,.webp";
/** How often an open thread checks for new messages. */
export const THREAD_POLL_MS = 10_000;

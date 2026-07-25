import type { CutType, Finish, OrderStatus, Shape } from "@/generated/prisma/client";

/** Shared between the cart and checkout summaries — the configurator's own labels live inline there. */
export const CUT_TYPE_LABELS: Record<CutType, string> = {
  DIE: "Die Cut",
  KISS: "Kiss Cut",
};

export const SHAPE_LABELS: Record<Shape, string> = {
  SQUARE: "Square",
  CIRCLE: "Circle",
  RECTANGLE: "Rectangle",
  OVAL: "Oval",
  CUSTOM: "Custom Shape",
};

export const FINISH_LABELS: Record<Finish, string> = {
  MATTE: "Matte",
  GLOSS: "Gloss",
};

/** Pipeline order per CLAUDE.md: awaiting_proof -> approved -> printing -> shipped. */
export const ORDER_STATUS_VALUES: OrderStatus[] = [
  "AWAITING_PROOF",
  "APPROVED",
  "PRINTING",
  "SHIPPED",
];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  AWAITING_PROOF: "Awaiting Proof",
  APPROVED: "Approved",
  PRINTING: "Printing",
  SHIPPED: "Shipped",
};

/** Used for the status badge in the admin orders list and detail view. */
export const ORDER_STATUS_BADGE_CLASSES: Record<OrderStatus, string> = {
  AWAITING_PROOF: "bg-waypoint-gold/20 text-ink-navy",
  APPROVED: "bg-trail-teal/15 text-trail-teal",
  PRINTING: "bg-coral-signal/15 text-coral-signal",
  SHIPPED: "bg-ink-navy text-paper",
};

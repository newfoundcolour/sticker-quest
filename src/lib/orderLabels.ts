import type { CutType, Finish, Shape } from "@/generated/prisma/client";

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

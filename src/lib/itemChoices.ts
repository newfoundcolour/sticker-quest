import type { CutType, Finish, Shape, SheetCuts, StickerType } from "@/generated/prisma/client";
import { CUT_TYPE_HINTS, sizePresetLabel } from "@/lib/configuratorOptions";
import {
  CUT_TYPE_LABELS,
  FINISH_LABELS,
  SHAPE_LABELS,
  SHEET_CUTS_LABELS,
  finishLabel,
  hasCutChoice,
  hasFinishChoice,
  hasWhiteInkOption,
  itemMaterial,
} from "@/lib/orderLabels";
import { STICKER_TYPE_LABELS } from "@/lib/stickerTypeSlug";
import { cmToMm, formatMmValue } from "@/lib/pricingUtils";

export type ItemChoice = {
  /** The configurator question, e.g. "Cut". */
  label: string;
  /** What the customer picked, e.g. "Die Cut". */
  value: string;
  /** A short line under the value, e.g. "Through the backing" or "75 × 75 mm". */
  detail?: string;
};

type ChoiceItem = {
  stickerType: StickerType;
  cutType: CutType;
  shape: Shape;
  finish: Finish;
  roundedCorners?: boolean | null;
  whiteInk: boolean;
  lamination: boolean;
  widthCm: number;
  heightCm: number;
  sheetMaterial?: StickerType | null;
  sheetCuts?: SheetCuts | null;
};

const yesNo = (value: boolean | null | undefined) => (value ? "Yes" : "No");

/**
 * Every choice the configurator asked about for this item, in the
 * configurator's order and wording, with the answer. Each sticker type asks
 * different questions, so this mirrors TypeConfigurator's rules:
 *  - sticker sheets: material, finish (vinyl only), stickers per sheet, size, white ink, lamination
 *  - label sheets: shape (always kiss cut), corners, finish, lamination, size
 *  - everything else: cut, shape, corners, material/finish, white ink, lamination, size
 * Corners only come up for square and rectangle shapes; white ink isn't
 * offered on vinyl or label sheets. Quantity is shown separately.
 */
export function itemChoices(item: ChoiceItem): ItemChoice[] {
  const isSheet = item.stickerType === "STICKER_SHEETS";
  const material = itemMaterial(item);
  const widthMm = cmToMm(item.widthCm);
  const heightMm = cmToMm(item.heightCm);
  const dimensions = `${formatMmValue(widthMm)} × ${formatMmValue(heightMm)} mm`;
  const size: ItemChoice = {
    label: "Size",
    value: sizePresetLabel(isSheet, widthMm, heightMm) ?? "Custom",
    detail: dimensions,
  };
  const whiteInk: ItemChoice[] = hasWhiteInkOption(material)
    ? [{ label: "White ink", value: yesNo(item.whiteInk) }]
    : [];
  const laminated: ItemChoice = { label: "Laminated", value: yesNo(item.lamination) };

  if (isSheet) {
    return [
      { label: "Material", value: STICKER_TYPE_LABELS[material] },
      // Only vinyl sheets get a matte/gloss choice; other materials are the finish.
      ...(hasFinishChoice(material) || item.finish === "GLOSS"
        ? [{ label: "Finish", value: FINISH_LABELS[item.finish] }]
        : []),
      ...(item.sheetCuts ? [{ label: "Stickers per sheet", value: SHEET_CUTS_LABELS[item.sheetCuts] }] : []),
      size,
      ...whiteInk,
      laminated,
    ];
  }

  const corners: ItemChoice[] =
    item.shape === "SQUARE" || item.shape === "RECTANGLE"
      ? [{ label: "Rounded corners", value: yesNo(item.roundedCorners) }]
      : [];

  return [
    ...(hasCutChoice(item.stickerType)
      ? [{ label: "Cut", value: CUT_TYPE_LABELS[item.cutType], detail: CUT_TYPE_HINTS[item.cutType] }]
      : []),
    { label: "Shape", value: SHAPE_LABELS[item.shape] },
    ...corners,
    { label: "Material", value: finishLabel(item) },
    ...whiteInk,
    laminated,
    size,
  ];
}

import Link from "next/link";
import type { StickerType } from "@/generated/prisma/client";
import { MaterialIcon } from "@/components/icons/MaterialIcon";
import { STICKER_TYPE_LABELS, STICKER_TYPE_SLUGS } from "@/lib/stickerTypeSlug";

const TYPE_DESCRIPTIONS: Record<StickerType, string> = {
  VINYL: "Durable, all-purpose stickers for indoor or outdoor use.",
  HOLOGRAPHIC: "Rainbow-shift finish that catches the light.",
  CHROME: "Mirror-like metallic finish.",
  CLEAR: "Transparent background — the print shows through.",
  ECONOMY: "Budget-friendly, built for short runs and testing.",
  STICKER_SHEETS: "Several sticker designs cut from one sheet.",
  LABEL_SHEETS: "Rectangular labels, sheet-fed for packaging and jars.",
};

const TYPE_ORDER: StickerType[] = [
  "VINYL",
  "HOLOGRAPHIC",
  "CHROME",
  "CLEAR",
  "ECONOMY",
  "STICKER_SHEETS",
  "LABEL_SHEETS",
];

export function TypeGrid() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <p className="font-mono text-sm uppercase tracking-wide text-coral-signal">
        Start your quest
      </p>
      <h1 className="mt-2 font-display text-4xl font-bold text-ink-navy">
        Pick your sticker type
      </h1>
      <p className="mt-2 text-ink-navy/60">
        This is the core choice — everything else is configured on the next page.
      </p>

      <div className="mt-8 flex flex-col gap-3">
        {TYPE_ORDER.map((type) => (
          <Link
            key={type}
            href={`/configure/${STICKER_TYPE_SLUGS[type]}`}
            className="flex items-center gap-4 rounded-2xl border border-ink-navy/10 bg-white/70 p-4 transition-colors hover:border-coral-signal"
          >
            <MaterialIcon material={type} className="h-12 w-12 shrink-0 text-ink-navy" />
            <div>
              <p className="font-display text-lg font-semibold text-ink-navy">
                {STICKER_TYPE_LABELS[type]}
              </p>
              <p className="text-sm text-ink-navy/60">{TYPE_DESCRIPTIONS[type]}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

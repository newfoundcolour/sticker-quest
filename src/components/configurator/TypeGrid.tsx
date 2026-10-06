import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/Container";
import { StickerTypeImage } from "@/components/StickerTypeImage";
import {
  LIFT_ON_HOVER_ANY,
  OPTION_TRANSITION,
  StepCard,
  TILT_ON_HOVER,
} from "@/components/configurator/StepCard";
import {
  STICKER_TYPE_DESCRIPTIONS,
  STICKER_TYPE_GROUPS,
  STICKER_TYPE_LABELS,
  STICKER_TYPE_SLUGS,
} from "@/lib/stickerTypeSlug";

/** Per-group layout: on wide screens the groups share a row, sized so every tile is the same width. */
const GROUP_LAYOUT: Record<string, { card: string; grid: string }> = {
  "Individually cut": { card: "lg:col-span-2", grid: "grid-cols-2 sm:grid-cols-4" },
  Sheets: { card: "", grid: "grid-cols-2" },
};

export function TypeGrid() {
  return (
    <Container className="pb-8 pt-4">
      <div className="flex items-center gap-5 overflow-hidden rounded-[20px] bg-linear-[167deg] from-zap via-blaze via-55% to-grape px-5 py-4 sm:px-8 md:h-[208px] md:py-0 lg:px-12">
        <Image
          src="/mascot/knight-helmet.png"
          alt=""
          width={615}
          height={880}
          priority
          className="hidden h-28 w-auto shrink-0 drop-shadow-[4px_4px_0_rgba(22,18,42,0.45)] sm:block md:h-40"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black uppercase tracking-wide text-night">Start your quest</p>
          <h1 className="pt-1 break-words text-[28px] font-black leading-none text-sand uppercase lg:text-[40px] xl:text-[64px]">
            Pick your sticker type
          </h1>
          <p className="pt-3 text-sm leading-[1.5] text-sand md:text-base">
            Choose a material to start — shape, size and quantity come next.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {STICKER_TYPE_GROUPS.map((group, i) => {
          const layout = GROUP_LAYOUT[group.title] ?? { card: "", grid: "grid-cols-2" };
          return (
            <StepCard key={group.title} step={i + 1} title={group.title} className={layout.card}>
              <div className={`grid flex-1 gap-2.5 p-4 ${layout.grid}`}>
                {group.types.map((type) => (
                  <Link
                    key={type}
                    href={`/configure/${STICKER_TYPE_SLUGS[type]}`}
                    className={[
                      "group flex flex-col items-center gap-2 rounded-[14px] border border-grape bg-sand p-3 text-center text-night",
                      "hover:border-zap-deep hover:bg-zap hover:shadow-pop-zap",
                      OPTION_TRANSITION,
                      LIFT_ON_HOVER_ANY,
                    ].join(" ")}
                  >
                    <StickerTypeImage type={type} className={`size-20 sm:size-24 ${TILT_ON_HOVER}`} />
                    <span className="text-base font-black">{STICKER_TYPE_LABELS[type]}</span>
                    <span className="text-xs leading-snug text-night/70">
                      {STICKER_TYPE_DESCRIPTIONS[type]}
                    </span>
                  </Link>
                ))}
              </div>
            </StepCard>
          );
        })}
      </div>
    </Container>
  );
}

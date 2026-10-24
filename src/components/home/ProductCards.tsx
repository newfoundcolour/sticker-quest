import Link from "next/link";
import { Container } from "@/components/Container";
import { StickerTypeImage } from "@/components/StickerTypeImage";
import { OPTION_TRANSITION, TILT_ON_HOVER } from "@/components/configurator/StepCard";
import {
  STICKER_TYPE_DESCRIPTIONS,
  STICKER_TYPE_GROUPS,
  STICKER_TYPE_LABELS,
  STICKER_TYPE_SLUGS,
} from "@/lib/stickerTypeSlug";

/** "Pick your sticker." — one large card per main product, each opening its configurator. */
export function ProductCards() {
  const types = STICKER_TYPE_GROUPS.flatMap((group) => group.types);

  return (
    <section id="products" aria-labelledby="products-heading" className="scroll-mt-6 pt-8 md:pt-10">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-wider text-zap">Start your quest</p>
            <h2
              id="products-heading"
              className="pt-3 text-[36px] font-black leading-none text-white uppercase md:text-[56px]"
            >
              Pick your sticker.
            </h2>
          </div>
          <Link href="/stickers" className="text-base font-black text-zap transition-colors hover:text-white">
            Not sure? Compare them all →
          </Link>
        </div>

        <ul className="mt-9 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {types.map((type) => {
            const label = STICKER_TYPE_LABELS[type];
            return (
              <li key={type} className="flex">
                <Link
                  href={`/configure/${STICKER_TYPE_SLUGS[type]}`}
                  className={[
                    "group flex flex-1 flex-col gap-3 rounded-[24px] border-[1.5px] border-grape bg-sand p-4 pb-5 text-night",
                    "shadow-[5px_5px_0_0_rgba(104,94,168,0.55)] hover:border-zap-deep hover:bg-zap hover:shadow-pop-zap",
                    "motion-safe:hover:-translate-y-0.5",
                    OPTION_TRANSITION,
                  ].join(" ")}
                >
                  <span className="relative aspect-square rounded-2xl bg-mist transition-colors group-hover:bg-sand">
                    <StickerTypeImage type={type} className={`absolute inset-2 ${TILT_ON_HOVER}`} />
                  </span>
                  {/* "Sticker Sheets", not "Sticker Sheets Stickers". */}
                  <span className="text-xl leading-[1.1] font-black lg:text-[22px]">
                    {label.endsWith("Sheets") ? label : `${label} Stickers`}
                  </span>
                  <span className="text-sm leading-[1.4] text-night/70">
                    {STICKER_TYPE_DESCRIPTIONS[type]}
                  </span>
                  <span className="mt-auto self-start rounded-full bg-blaze px-4 py-2.5 text-sm font-black text-white shadow-pop-blaze">
                    Start →
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}

import Link from "next/link";
import { Container } from "@/components/Container";
import { StickerTypeImage } from "@/components/StickerTypeImage";
import { TILT_ON_HOVER } from "@/components/configurator/StepCard";
import {
  STICKER_TYPE_DESCRIPTIONS,
  STICKER_TYPE_GROUPS,
  STICKER_TYPE_LABELS,
  STICKER_TYPE_SLUGS,
} from "@/lib/stickerTypeSlug";

/** "Pick your sticker type" — the product directory, one column per group. */
export function TypeGrid() {
  return (
    <Container className="pt-12 pb-[72px] lg:px-[72px]">
      <div className="flex flex-col gap-3.5">
        <p className="text-[13px] font-black uppercase tracking-[0.06em] text-zap">Start your quest</p>
        <h1 className="font-headline text-[36px] font-bold leading-[1.05] text-sand uppercase md:text-[56px]">
          Pick your sticker type
        </h1>
        <p className="text-base leading-normal text-[#b5b0c4] md:text-[17px]">
          Choose a material to start — shape, size and quantity come next.
        </p>
      </div>

      <div className="mt-11 grid gap-10 md:grid-cols-2 md:gap-9">
        {STICKER_TYPE_GROUPS.map((group, i) => (
          <section
            key={group.title}
            aria-labelledby={`type-group-${i}`}
            // A thin rule splits the two columns on wider screens.
            className={i === 0 ? "md:border-r md:border-white/9 md:pr-9" : "md:pr-9"}
          >
            <h2
              id={`type-group-${i}`}
              className="text-[15px] font-extrabold uppercase tracking-[0.05em] text-[#b9a6f4]"
            >
              {group.title}
            </h2>
            <ul className="mt-3">
              {group.types.map((type) => (
                <li key={type} className="border-b border-white/9 last:border-b-0">
                  <Link
                    href={`/configure/${STICKER_TYPE_SLUGS[type]}`}
                    className="group flex min-h-[112px] items-center gap-[18px] py-[18px]"
                  >
                    <StickerTypeImage
                      type={type}
                      size={72}
                      className={`size-[72px] shrink-0 ${TILT_ON_HOVER}`}
                    />
                    <span className="flex min-w-0 flex-col gap-1.5">
                      <span className="text-base leading-[1.25] font-bold text-white transition-colors group-hover:text-zap">
                        {STICKER_TYPE_LABELS[type]}
                        {STICKER_TYPE_LABELS[type].endsWith("Sheets") ? "" : " Stickers"}
                        <span aria-hidden className="ml-2 inline-block transition-transform group-hover:translate-x-0.5">
                          →
                        </span>
                      </span>
                      <span className="text-sm leading-[1.4] text-[#b5b0c4]">
                        {STICKER_TYPE_DESCRIPTIONS[type]}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Container>
  );
}

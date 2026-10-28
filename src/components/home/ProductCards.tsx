import Link from "next/link";
import { Container } from "@/components/Container";
import { StickerTypeImage } from "@/components/StickerTypeImage";

/** Each card's art tips a different way on hover, like stickers slapped on by hand.
 *  Full class strings so Tailwind can see them. */
const HOVER_TILTS = [
  "motion-safe:group-hover:-rotate-[6deg]",
  "motion-safe:group-hover:rotate-[4deg]",
  "motion-safe:group-hover:-rotate-[3deg]",
  "motion-safe:group-hover:rotate-[7deg]",
  "motion-safe:group-hover:-rotate-[5deg]",
  "motion-safe:group-hover:rotate-[3deg]",
];
import { STICKER_TYPE_GROUPS, STICKER_TYPE_LABELS, STICKER_TYPE_SLUGS } from "@/lib/stickerTypeSlug";

/** "Pick your sticker." — one dark card per main product, each opening its configurator. */
export function ProductCards() {
  const types = STICKER_TYPE_GROUPS.flatMap((group) => group.types);

  return (
    <section id="products" aria-labelledby="products-heading" className="scroll-mt-6 pt-16">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-3 uppercase">
            <p className="text-sm font-black tracking-[0.06em] text-zap">Start your quest</p>
            <h2
              id="products-heading"
              className="font-headline text-[36px] font-bold leading-none text-white md:text-[56px]"
            >
              Pick your sticker.
            </h2>
          </div>
          <Link href="/stickers" className="text-base font-black text-zap transition-colors hover:text-white">
            Not sure? Compare them all →
          </Link>
        </div>

        <ul className="mt-9 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {types.map((type, i) => {
            const label = STICKER_TYPE_LABELS[type];
            return (
              <li key={type} className="flex">
                <Link
                  href={`/configure/${STICKER_TYPE_SLUGS[type]}`}
                  className={[
                    "group flex flex-1 flex-col items-center gap-3 rounded-[24px] border border-dusk-line bg-dusk px-3 pt-4 pb-[18px] text-white",
                    "shadow-[0_4px_6px_rgba(0,0,0,0.28)] hover:bg-dusk-line",
                    "transition-[background-color,scale] duration-200 motion-safe:hover:scale-[1.04]",
                  ].join(" ")}
                >
                  <span className="relative h-[160px] w-full">
                    <StickerTypeImage type={type} size={160} className={`absolute inset-0 transition-transform duration-200 ${HOVER_TILTS[i % HOVER_TILTS.length]}`} />
                  </span>
                  <span className="mt-auto flex min-h-6 items-center gap-[5px] text-[15px] leading-[1.1] font-black transition-colors duration-200 group-hover:text-zap">
                    {/* "Sticker Sheets", not "Sticker Sheets Stickers". */}
                    <span className="max-w-[145px] text-center">
                      {label.endsWith("Sheets") ? label : `${label} Stickers`}
                    </span>
                    <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
                      →
                    </span>
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

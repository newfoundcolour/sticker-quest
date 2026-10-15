import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/Container";

/** Night-ink hard shadow under each mascot, same as the configurator banner's helmet. */
const MASCOT_SHADOW = "drop-shadow-[6px_6px_0_rgba(22,18,42,0.45)]";

/** "On a quest for custom stickers?" — the gradient landing banner. */
export function HomeHero() {
  return (
    <Container className="pt-4 sm:pt-6">
      <div className="flex flex-col items-center gap-8 overflow-hidden rounded-[28px] bg-linear-[167deg] from-zap via-blaze via-55% to-grape px-6 py-10 sm:px-10 md:flex-row md:gap-6 md:py-14 lg:pl-[72px] lg:pr-12">
        <div className="min-w-0 flex-1">
          <p className="inline-block rounded-full bg-night px-4 py-2 text-xs font-black uppercase tracking-wide text-zap sm:text-sm">
            ✦ Custom stickers &amp; labels
          </p>
          <h1 className="pt-6 text-[44px] font-black leading-[0.92] text-sand uppercase drop-shadow-[4px_4px_0_rgba(22,18,42,0.35)] sm:text-[64px] xl:text-[88px]">
            On a quest for custom stickers?
          </h1>
          <p className="max-w-[620px] pt-6 text-base font-bold leading-[1.45] text-night sm:text-xl">
            Upload your design, approve your proof, and we&rsquo;ll print vinyl, holographic,
            chrome and clear stickers from just 50.
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-6">
            <Link
              href="/stickers"
              className="rounded-full bg-night px-8 py-[18px] text-lg font-black text-white shadow-[4px_4px_0_0_var(--color-blaze)] transition-[translate,box-shadow] duration-150 motion-safe:hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_var(--color-blaze)]"
            >
              Start your quest →
            </Link>
            <a
              href="#products"
              className="rounded-full border-[2.5px] border-night px-8 py-4 text-lg font-black text-night transition-colors hover:bg-night hover:text-white"
            >
              Browse sticker types
            </a>
          </div>
        </div>

        <div aria-hidden="true" className="relative aspect-[500/440] w-full max-w-[420px] shrink-0 lg:max-w-[500px]">
          <Image
            src="/mascot/vinyl-wizard.png"
            alt=""
            width={1024}
            height={1024}
            priority
            className={`absolute left-[10%] top-[4.5%] w-[80%] ${MASCOT_SHADOW}`}
          />
          <Image
            src="/mascot/holo-dragon.png"
            alt=""
            width={868}
            height={868}
            className={`absolute -left-[2%] top-[55%] w-[38%] rotate-[-10deg] ${MASCOT_SHADOW}`}
          />
          <Image
            src="/mascot/chrome-knight.png"
            alt=""
            width={830}
            height={905}
            className={`absolute right-0 top-[2%] w-[34%] rotate-[8deg] ${MASCOT_SHADOW}`}
          />
        </div>
      </div>
    </Container>
  );
}

import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/Container";

/** "On a quest for custom stickers?" — the gradient landing banner. */
export function HomeHero() {
  return (
    <Container className="pt-4 sm:pt-6">
      <div className="flex flex-col items-center gap-8 overflow-hidden rounded-[28px] bg-linear-[167deg] from-zap via-blaze via-55% to-grape px-6 py-10 sm:px-10 md:flex-row md:gap-8 md:py-14 lg:pl-[72px] lg:pr-12">
        <div className="flex min-w-0 flex-1 flex-col items-center gap-5 text-center">
          <p className="rounded-full bg-night px-4 py-2 text-xs font-black uppercase tracking-[0.04em] text-zap sm:text-sm">
            ✦ Custom stickers &amp; labels ✦
          </p>
          <h1 className="max-w-[700px] font-headline text-[44px] font-bold leading-[0.92] text-sand uppercase sm:text-[64px] xl:text-[70px]">
            On a quest for custom stickers?
          </h1>
          <p className="max-w-[620px] text-base font-bold leading-[1.45] text-night sm:text-xl">
            Upload your design, approve your proof, and we&rsquo;ll print vinyl, holographic,
            chrome and clear stickers from just 50.
          </p>
          <Link
            href="/stickers"
            className="rounded-full bg-night px-8 py-[18px] text-lg font-black text-white transition-[translate] duration-150 motion-safe:hover:-translate-y-0.5"
          >
            Start your quest →
          </Link>
        </div>

        {/* The wizard is taller than its box and spills into the banner's padding, as in the Figma. */}
        {/* Clicking him jumps to the type cards; he's decorative, so keyboard users skip him. */}
        <a
          href="#products"
          aria-hidden="true"
          tabIndex={-1}
          className="group relative my-4 block aspect-[500/440] w-full max-w-[380px] shrink-0 md:my-0 lg:max-w-[450px]"
        >
          <div className="pointer-events-none absolute inset-[4%] -top-[6%] rounded-full bg-[radial-gradient(closest-side,rgb(245_240_232/0.75),rgb(245_240_232/0.25)_55%,transparent)] opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />
          {/* wizard-sticker.png is wizard-full.png with a baked-in white die-cut border. */}
          <div className="absolute inset-0 motion-safe:animate-bob">
            <Image
              src="/mascot/wizard-sticker.png"
              alt=""
              width={3211}
              height={3813}
              priority
              sizes="(min-width: 1024px) 410px, 347px"
              className="absolute -left-[1.8%] -top-[12.2%] w-[91.2%] drop-shadow-[0_12px_14px_rgb(32_31_32/0.35)]"
            />
          </div>
        </a>
      </div>
    </Container>
  );
}

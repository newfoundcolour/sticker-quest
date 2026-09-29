import Link from "next/link";
import { Container } from "@/components/Container";

/** Stand-in page for footer links whose real page hasn't been built yet. */
export function ComingSoon({ title, blurb }: { title: string; blurb: string }) {
  return (
    <main className="flex flex-1 flex-col bg-night">
      <Container className="py-24 text-center">
        <h1 className="text-[36px] font-black leading-none text-white uppercase md:text-[56px]">
          {title}
        </h1>
        <p className="mx-auto mt-5 max-w-md text-base leading-[1.5] text-white/65">{blurb}</p>
        <Link
          href="/"
          className="mt-8 inline-block rounded-full border-2 border-night bg-blaze px-7 py-3 text-sm font-black text-white uppercase shadow-pop-blaze"
        >
          Make some stickers
        </Link>
      </Container>
    </main>
  );
}

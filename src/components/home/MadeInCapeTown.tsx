import { Container } from "@/components/Container";
import { SouthAfricaMap } from "@/components/home/SouthAfricaMap";

/** "Made in Cape Town. Ships anywhere in South Africa." — copy beside a map. */
export function MadeInCapeTown() {
  return (
    <section aria-labelledby="cape-town-heading" className="py-16 md:py-24">
      <Container>
        <div className="flex flex-col items-center gap-12 rounded-[28px] border-[1.5px] border-night bg-grape px-6 py-10 sm:px-10 lg:flex-row lg:gap-12 lg:py-14 lg:pl-[72px] lg:pr-14">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black uppercase tracking-wider text-zap">Proudly South African</p>
            <h2
              id="cape-town-heading"
              className="pt-5 text-[40px] font-black leading-[0.95] text-sand uppercase md:text-[64px]"
            >
              Made in Cape Town.
              <span className="block pt-5 text-[28px] leading-none text-zap md:text-[40px]">
                Ships anywhere in South Africa.
              </span>
            </h2>
            <p className="max-w-[520px] pt-5 text-base leading-[1.5] text-sand/90 md:text-lg">
              Every order is printed in Cape Town and couriered to your door with The Courier Guy,
              from Joburg to Gqeberha and everywhere in between.
            </p>
          </div>
          {/* Narrower and left-aligned on phones, leaving room for the city labels on the right. */}
          <SouthAfricaMap className="w-[72%] max-w-[488px] shrink-0 self-start pb-8 sm:w-full sm:self-center" />
        </div>
      </Container>
    </section>
  );
}

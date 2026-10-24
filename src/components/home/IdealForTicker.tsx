import { Container } from "@/components/Container";

// Placeholder industries — swap for real client names once we've worked with some reputable brands.
const INDUSTRIES = [
  "Coffee shops",
  "Product labels",
  "Record stores",
  "Food trucks",
  "Merch",
  "Small businesses",
  "Musicians",
  "Bumper stickers",
  "Tattoo artists",
  "Breweries",
  "Skate shops",
  "Graphic designers",
  "Bakeries",
  "Events",
  "Gaming streamers",
  "Packaging",
];

// Fixed "random" tilts, one per item, so the server and browser render the same thing.
const TILTS = [-6, 4, -2, 7, -5, 3, -8, 2, 5, -3, 6, -4, 1, -7, 4, -1];

function IndustryList({ hidden = false }: { hidden?: boolean }) {
  return (
    // One copy of the list is wider than even a very wide screen.
    <ul aria-hidden={hidden || undefined} className="flex shrink-0 items-center gap-5 pr-5 sm:gap-7 sm:pr-7">
      {INDUSTRIES.map((industry, i) => {
        return (
          <li key={industry}>
            {/* Each item is a sticker — swap the text for a client logo later. */}
            <span
              className="sticker-text flex flex-col items-center text-xl leading-[0.95] font-black text-ink uppercase sm:text-[28px]"
              style={{ rotate: `${TILTS[i % TILTS.length]}deg` }}
            >
              {/* Two-word names stack, one word per line. */}
              {industry.split(" ").map((word) => (
                <span key={word}>{word}</span>
              ))}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/** "Ideal for:" — tilted, sticker-style industry names scrolling right to left. */
export function IdealForTicker() {
  return (
      <section aria-label="Ideal for" className="pt-10">
        <Container>
        <p className="mx-auto w-fit rounded-full bg-night px-[18px] py-2.5 text-[14px] font-black uppercase tracking-wide text-zap">
          Ideal for:
        </p>
        {/* Same width as the hero banner; both ends fade into the page. */}
        <div className="relative overflow-hidden py-4 [--fade:32px] [mask-image:linear-gradient(to_right,transparent,black_var(--fade),black_calc(100%-var(--fade)),transparent)] sm:[--fade:64px]">
          {/* Two copies of the list, so sliding left by exactly one copy loops seamlessly. */}
          <div className="flex w-max animate-ticker">
            <IndustryList />
            <IndustryList hidden />
        </div>
      </div>
      </Container>
    </section>
  );
}

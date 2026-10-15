// Placeholder industries — swap for real client names once we've worked with some reputable brands.
const INDUSTRIES = [
  "Coffee shops",
  "Record stores",
  "Merch",
  "Musicians",
  "Tattoo artists",
  "Graphic designers",
];

function IndustryList({ hidden = false }: { hidden?: boolean }) {
  return (
    <ul aria-hidden={hidden || undefined} className="flex shrink-0 items-center">
      {/* Three rounds per copy, so one copy is wider than even a very wide screen. */}
      {[0, 1, 2].flatMap((round) => INDUSTRIES.map((industry) => (
        <li key={`${round}-${industry}`} aria-hidden={round > 0 || undefined} className="flex items-center">
          <span className="whitespace-nowrap px-7 text-xl font-black text-night uppercase sm:text-[28px]">
            {industry}
          </span>
          <span aria-hidden="true" className="text-2xl font-black text-blaze">
            ✦
          </span>
        </li>
      )))}
    </ul>
  );
}

/** "Ideal for:" — a lime band of industries scrolling right to left. */
export function IdealForTicker() {
  return (
    <section aria-label="Ideal for" className="pt-10">
      <div className="relative overflow-hidden bg-zap py-[22px]">
        {/* Pinned over the left edge; the list slides out from under it. */}
        <div className="absolute inset-y-0 left-0 z-10 flex items-center bg-zap pr-3 pl-4 shadow-[16px_0_14px_0_var(--color-zap)] sm:pl-[44px]">
          <p className="rounded-full bg-night px-[18px] py-2.5 text-sm font-black uppercase tracking-wide text-zap sm:text-base">
            Ideal for:
          </p>
        </div>
        {/* Two copies of the list, so sliding left by exactly one copy loops seamlessly. */}
        <div className="flex w-max animate-ticker">
          <IndustryList />
          <IndustryList hidden />
        </div>
      </div>
    </section>
  );
}

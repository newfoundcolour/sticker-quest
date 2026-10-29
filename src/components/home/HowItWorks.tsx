import { Container } from "@/components/Container";

/** Shared badge look: a little sticker with a light die-cut edge. */
const BADGE = "flex h-14 items-center justify-center text-[26px] font-black shadow-[0_4px_6px_rgba(0,0,0,0.35)]";
const BADGE_EDGE = "border border-sand/65";

/** Numbered step badges, each a different sticker shape: circle, square, rectangle, oval. Also used on the order confirmation. */
export const STEP_BADGES = [
  `${BADGE} ${BADGE_EDGE} w-14 rounded-full bg-blaze text-white`,
  `${BADGE} ${BADGE_EDGE} w-14 rounded-[4px] bg-grape text-white`,
  `${BADGE} ${BADGE_EDGE} w-20 rounded-[4px] bg-zap text-night`,
  // The oval's edge is drawn in the SVG, so no border here.
  `${BADGE} w-20 rounded-full bg-[url(/how-it-works/oval-badge.svg)] bg-size-[100%_100%] text-white`,
];

const STEPS = [
  {
    title: "Upload your design",
    body: "PNG, PDF, AI, EPS, SVG. We’ll take anything.",
    badge: STEP_BADGES[0],
  },
  {
    title: "Approve your proof",
    body: "Sent to you quickly via email or WhatsApp.",
    badge: STEP_BADGES[1],
  },
  {
    title: "Fast shipping",
    body: "Approve your proof and we print it. It’s out the door the next business day.",
    badge: STEP_BADGES[2],
  },
  {
    title: "Shipped to your door",
    body: "Leave us a five-star review if you love them.",
    badge: STEP_BADGES[3],
  },
];

/** "We made it easy to get custom stickers." — four steps split by thin dividers. */
export function HowItWorks() {
  return (
    <section aria-labelledby="how-it-works-heading" className="pt-[30px] pb-6">
      <Container>
        <div className="flex flex-col items-center gap-3 text-center uppercase">
          <p className="text-sm font-black tracking-[0.06em] text-zap">How it works</p>
          <h2
            id="how-it-works-heading"
            className="max-w-[900px] font-headline text-[36px] font-bold leading-none text-white md:text-[56px]"
          >
            We made it easy to get custom stickers.
          </h2>
        </div>

        <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="relative flex flex-col items-center gap-4 p-7 text-center text-white"
            >
              <span aria-hidden="true" className={step.badge}>
                {i + 1}
              </span>
              <h3 className="text-2xl leading-[1.1] font-black">{step.title}</h3>
              <p className="text-base leading-[1.45] text-white/70">{step.body}</p>
              {/* Divider sits in the middle of the gap to the next step (desktop row only). */}
              {i < STEPS.length - 1 && (
                <span
                  aria-hidden="true"
                  className="absolute top-7 bottom-7 -right-2 hidden w-px bg-sand/25 lg:block"
                />
              )}
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}

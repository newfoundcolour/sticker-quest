import { Container } from "@/components/Container";

const STEPS = [
  {
    title: "Upload your design",
    body: "PNG, PDF, AI, EPS, SVG. We’ll take anything.",
    badge: "bg-blaze text-white",
  },
  {
    title: "Approve your proof",
    body: "Sent to you quickly via email or WhatsApp.",
    badge: "bg-grape text-white",
  },
  {
    title: "Fast shipping",
    body: "Approve your proof and we print it. It’s out the door the next business day.",
    badge: "bg-zap text-night",
  },
  {
    title: "Shipped to your door",
    body: "Leave us a five-star review if you love them.",
    badge: "bg-blaze text-white",
  },
];

/** "We made it easy to get custom stickers." — the four-step process strip. */
export function HowItWorks() {
  return (
    <section aria-labelledby="how-it-works-heading" className="pt-10 pb-6">
      <Container>
        <div className="text-center">
          <p className="text-sm font-black uppercase tracking-wider text-zap">How it works</p>
          <h2
            id="how-it-works-heading"
            className="mx-auto max-w-[900px] pt-3 text-[36px] font-black leading-none text-white uppercase md:text-[56px]"
          >
            We made it easy to get custom stickers.
          </h2>
        </div>

        <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="flex flex-col gap-4 rounded-[24px] border-[1.5px] border-night bg-sand px-7 pt-7 pb-8 text-night shadow-[5px_5px_0_0_rgba(104,94,168,0.55)]"
            >
              <span
                aria-hidden="true"
                className={`flex size-14 items-center justify-center rounded-full border-[1.5px] border-night text-[26px] font-black ${step.badge}`}
              >
                {i + 1}
              </span>
              <h3 className="text-2xl leading-[1.1] font-black">{step.title}</h3>
              <p className="text-base leading-[1.45] text-night/75">{step.body}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}

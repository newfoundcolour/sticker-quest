import { Container } from "@/components/Container";
import { getReviews } from "@/lib/reviews";

/** Cards cycle through these fills and tilts, left to right. */
const CARD_STYLES = [
  "bg-zap md:-rotate-2",
  "bg-peach",
  "bg-lilac md:rotate-2",
];

/** "Our Quest For Quality." — tilted review cards on the dark page, below the configurator. */
export async function Reviews() {
  const reviews = await getReviews();
  if (reviews.length === 0) return null;

  return (
    <section aria-labelledby="reviews-heading" className="pt-16 pb-[68px]">
      <Container>
        <h2
          id="reviews-heading"
          className="text-center text-[36px] font-black leading-none text-white uppercase md:text-[56px]"
        >
          Our Quest For Quality.
        </h2>

        <ul className="mt-9 grid gap-6 md:grid-cols-3 md:gap-[18px]">
          {reviews.map((review, i) => (
            <li
              key={review.id}
              className={[
                "flex min-h-[220px] flex-col gap-4 rounded-[24px] border-[1.5px] border-night p-7 text-ink shadow-pop-night",
                CARD_STYLES[i % CARD_STYLES.length],
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-xl leading-none text-blaze" aria-label={`${review.rating} out of 5 stars`}>
                  {"★".repeat(review.rating)}
                </p>
                <span className="shrink-0 rounded-full bg-night px-3 py-[5px] text-[10px] font-black text-white">
                  {review.badge}
                </span>
              </div>
              <blockquote className="text-[15px] leading-[1.5]">&ldquo;{review.quote}&rdquo;</blockquote>
              <p className="text-sm font-black">{review.name}</p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

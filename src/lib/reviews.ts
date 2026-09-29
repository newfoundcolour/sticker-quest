export type Review = {
  id: string;
  name: string;
  /** Whole stars, 1–5. */
  rating: number;
  quote: string;
  /** Short tag shown on the card, e.g. "Verified buyer". */
  badge: string;
};

/**
 * Placeholder reviews (copy from the Figma mock) until reviews can be added
 * from the admin backend. Swap `getReviews` for a database query then —
 * callers already await it.
 */
const PLACEHOLDER_REVIEWS: Review[] = [
  {
    id: "placeholder-1",
    name: "Priya S.",
    rating: 5,
    quote:
      "Ordered holo stickers for my Etsy shop - the quality is insane. Customers keep asking where I get them.",
    badge: "Verified buyer",
  },
  {
    id: "placeholder-2",
    name: "Marco L.",
    rating: 5,
    quote:
      "Turned our band logo into kiss-cut stickers for merch. They look way better in person. Super fast shipping.",
    badge: "Repeat customer",
  },
  {
    id: "placeholder-3",
    name: "Tanya K.",
    rating: 5,
    quote:
      "The configurator is so easy. I could see exactly how my sticker would look before ordering. 10/10.",
    badge: "Verified buyer",
  },
];

export async function getReviews(): Promise<Review[]> {
  return PLACEHOLDER_REVIEWS;
}

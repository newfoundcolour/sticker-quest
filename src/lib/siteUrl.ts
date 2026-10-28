/**
 * The site's public origin, used for links in auth emails. Set
 * NEXT_PUBLIC_SITE_URL per environment (e.g. https://stickerquest.co.za);
 * deliberately not derived from the request's Host header, which a caller
 * controls.
 */
export function siteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
  if (fromEnv) return fromEnv.replace(/\/+$/, "");
  // Vercel preview deployments, before a site URL is configured for them.
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  if (process.env.NODE_ENV !== "production") return "http://localhost:3000";
  throw new Error("NEXT_PUBLIC_SITE_URL is not set");
}

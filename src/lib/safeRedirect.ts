/**
 * Turns an untrusted `next` value (from a query string or form field) into a
 * same-site path, or the fallback. Blocks open redirects like
 * `//evil.com`, `/\evil.com` or `https://evil.com` — the URL parser
 * normalises those to a different origin, which we reject.
 */
export function safeRedirectPath(next: unknown, fallback = "/account"): string {
  if (typeof next !== "string" || next.length === 0 || next.length > 2048) return fallback;

  const base = "https://sticker-quest.invalid";
  let url: URL;
  try {
    // Absolute links back to our own site (e.g. Supabase's RedirectTo) are fine.
    const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "");
    const relative = site && next.startsWith(`${site}/`) ? next.slice(site.length) : next;
    if (!relative.startsWith("/")) return fallback;
    url = new URL(relative, base);
  } catch {
    return fallback;
  }

  if (url.origin !== base) return fallback;
  // Never bounce back into the auth callback itself.
  if (url.pathname.startsWith("/auth/")) return fallback;
  return `${url.pathname}${url.search}${url.hash}`;
}

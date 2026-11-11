import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/Container";
import { blogCoverUrl } from "@/lib/artworkUrls";
import { listPublishedPosts, readingMinutes } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog · Sticker Quest",
  description: "Sticker tips, how-tos and behind-the-scenes posts from the Sticker Quest team.",
};

function formatPostDate(date: Date | null): string {
  return date ? date.toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" }) : "";
}

/** The newest post as a wide feature card, then the rest in a grid. */
export default async function BlogPage() {
  const posts = await listPublishedPosts();
  const [featured, ...rest] = posts;

  return (
    <main className="relative isolate flex flex-1 flex-col bg-night">
      <Container className="pb-20 pt-10 sm:pt-14">
        <header className="mb-10 flex flex-col gap-3">
          <h1 className="font-headline text-[44px] font-bold leading-none text-sand sm:text-[64px]">The Sticker Quest blog</h1>
          <p className="max-w-xl text-base leading-relaxed text-white/60 sm:text-lg">
            Sticker tips, how-tos and behind-the-scenes from our print shop in Cape Town.
          </p>
        </header>

        {!featured ? (
          <div className="rounded-[20px] border-[1.5px] border-dusk-line bg-dusk px-6 py-16 text-center">
            <p className="text-lg font-black text-sand">First posts are on the way</p>
            <p className="mt-2 text-sm text-white/50">Check back soon for sticker tips and how-tos.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            <Link
              href={`/blog/${featured.slug}`}
              className="group grid overflow-hidden rounded-[24px] border-[1.5px] border-dusk-line bg-dusk transition-colors hover:border-grape lg:grid-cols-[1.4fr_1fr]"
            >
              <Cover url={featured.coverImageUrl} alt={featured.coverImageAlt} width={1120} height={630} priority />
              <div className="flex flex-col justify-center gap-4 p-6 sm:p-9">
                <PostMeta date={featured.publishedAt} minutes={readingMinutes(featured.body)} />
                <h2 className="font-headline text-[30px] font-bold leading-tight text-sand group-hover:text-zap sm:text-[38px]">
                  {featured.title}
                </h2>
                <p className="text-base leading-relaxed text-white/65">{featured.excerpt}</p>
                <span className="text-sm font-black text-zap">Read the post →</span>
              </div>
            </Link>

            {rest.length > 0 && (
              <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((post) => (
                  <li key={post.id}>
                    <Link
                      href={`/blog/${post.slug}`}
                      className="group flex h-full flex-col overflow-hidden rounded-[20px] border-[1.5px] border-dusk-line bg-dusk transition-colors hover:border-grape"
                    >
                      <Cover url={post.coverImageUrl} alt={post.coverImageAlt} width={720} height={405} />
                      <div className="flex flex-1 flex-col gap-3 p-5">
                        <PostMeta date={post.publishedAt} minutes={readingMinutes(post.body)} />
                        <h2 className="text-xl font-black leading-snug text-sand group-hover:text-zap">{post.title}</h2>
                        <p className="line-clamp-3 text-sm leading-relaxed text-white/60">{post.excerpt}</p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </Container>

      <div aria-hidden="true" className="pointer-events-none sticky bottom-0 -z-10 h-0">
        <div className="page-glow-left absolute bottom-0 left-0 h-[85vh] w-[70%]" />
        <div className="page-glow-right absolute bottom-0 right-0 h-[85vh] w-[70%]" />
      </div>
    </main>
  );

}

function PostMeta({ date, minutes }: { date: Date | null; minutes: number }) {
  return (
    <p className="text-xs font-bold uppercase tracking-wide text-dusk-note">
      {formatPostDate(date)} · {minutes} min read
    </p>
  );
}

/** A post's cover, or a brand-coloured block when it has none. */
function Cover({
  url,
  alt,
  width,
  height,
  priority = false,
}: {
  url: string | null;
  alt: string | null;
  width: number;
  height: number;
  priority?: boolean;
}) {
  return (
    <div className="aspect-[16/9] w-full overflow-hidden bg-gradient-to-br from-grape to-plum">
      {url && (
        // eslint-disable-next-line @next/next/no-img-element -- Cloudinary URL with its own transforms
        <img
          src={blogCoverUrl(url, width, height)}
          alt={alt ?? ""}
          width={width}
          height={height}
          loading={priority ? "eager" : "lazy"}
          className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />
      )}
    </div>
  );
}

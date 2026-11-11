import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/Container";
import { Markdown } from "@/components/blog/Markdown";
import { blogCoverUrl } from "@/lib/artworkUrls";
import { getPublishedPost, readingMinutes } from "@/lib/blog";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  if (!post) return { title: "Blog · Sticker Quest" };
  return {
    title: `${post.title} · Sticker Quest`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),
      images: post.coverImageUrl ? [{ url: blogCoverUrl(post.coverImageUrl, 1200, 630), width: 1200, height: 630 }] : undefined,
    },
  };
}

/** One published post. Drafts and posts awaiting review are a 404 here. */
export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  if (!post) notFound();

  const byline = post.author?.firstName ? `By ${post.author.firstName}` : "By the Sticker Quest team";
  const date = post.publishedAt?.toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" });

  return (
    <main className="relative isolate flex flex-1 flex-col bg-night">
      <Container className="pb-20 pt-8 sm:pt-12">
        <article className="mx-auto w-full max-w-[760px]">
          <Link href="/blog" className="text-sm font-bold text-dusk-note hover:text-sand">
            ← All posts
          </Link>

          <header className="mt-6 flex flex-col gap-4">
            <p className="text-xs font-bold uppercase tracking-wide text-dusk-note">
              {date} · {readingMinutes(post.body)} min read
            </p>
            <h1 className="font-headline text-[38px] font-bold leading-[1.05] text-sand sm:text-[54px]">{post.title}</h1>
            <p className="text-lg leading-relaxed text-white/65">{post.excerpt}</p>
            <p className="text-sm font-bold text-sand">{byline}</p>
          </header>

          {post.coverImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- Cloudinary URL with its own transforms
            <img
              src={blogCoverUrl(post.coverImageUrl, 1520, 855)}
              alt={post.coverImageAlt ?? ""}
              width={1520}
              height={855}
              className="mt-8 aspect-[16/9] w-full rounded-[24px] border-[1.5px] border-dusk-line object-cover"
            />
          )}

          <div className="mt-10">
            <Markdown>{post.body}</Markdown>
          </div>

          <aside className="mt-14 flex flex-col items-start gap-4 rounded-[24px] border-[1.5px] border-dusk-line bg-dusk p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div>
              <p className="font-headline text-2xl font-bold text-sand">Ready to make your own?</p>
              <p className="mt-1 text-sm text-white/60">Custom stickers, printed in Cape Town and dispatched the day after you approve the proof.</p>
            </div>
            <Link
              href="/stickers"
              className="shrink-0 rounded-full bg-zap px-6 py-3 text-sm font-black text-night shadow-[0_4px_0_0_var(--color-grape)] transition-[translate,box-shadow] duration-150 motion-safe:hover:-translate-y-0.5"
            >
              Make stickers →
            </Link>
          </aside>
        </article>
      </Container>

      <div aria-hidden="true" className="pointer-events-none sticky bottom-0 -z-10 h-0">
        <div className="page-glow-left absolute bottom-0 left-0 h-[85vh] w-[70%]" />
        <div className="page-glow-right absolute bottom-0 right-0 h-[85vh] w-[70%]" />
      </div>
    </main>
  );
}

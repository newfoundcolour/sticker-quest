import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth";
import { canEditPost, canViewPost, isAdmin, readingMinutes } from "@/lib/blog";
import { saveBlogPostAction } from "@/app/actions/blog";
import { BlogEditor } from "@/components/admin/BlogEditor";
import { BlogPostControls } from "@/components/admin/BlogPostControls";
import { Markdown } from "@/components/blog/Markdown";
import { AdminCard, AdminIcon, AdminPageHeader, BlogStatusBadge, DetailList, formatAdminDateTime } from "@/components/admin/ui";

const SAVED_MESSAGES: Record<string, string> = {
  save: "Draft saved.",
  submit: "Submitted for review. An admin will publish it or send it back with notes.",
  publish: "Published. It's live on the blog.",
};

export default async function EditBlogPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const staff = await requireStaff();
  const { id } = await params;
  const { saved } = await searchParams;
  if (id.length > 64) notFound();

  const post = await prisma.blogPost.findUnique({
    where: { id },
    include: { author: { select: { firstName: true, lastName: true, email: true } } },
  });
  // Staff can only open their own posts; anything else is a 404.
  if (!post || !canViewPost(staff, post)) notFound();

  const admin = isAdmin(staff);
  const editable = canEditPost(staff, post);
  const mine = post.authorId === staff.id;
  const author = post.author ? [post.author.firstName, post.author.lastName].filter(Boolean).join(" ") || post.author.email : "Former staff";
  const host = (await headers()).get("host") ?? "stickerquest";

  const buttons = admin
    ? post.status === "PUBLISHED"
      ? [{ intent: "save" as const, label: "Update live post", primary: true }]
      : [
          { intent: "save" as const, label: post.status === "SUBMITTED" ? "Save changes" : "Save draft" },
          { intent: "publish" as const, label: "Publish", primary: true },
        ]
    : [
        { intent: "save" as const, label: "Save draft" },
        { intent: "submit" as const, label: "Submit for review", primary: true },
      ];

  return (
    <>
      <AdminPageHeader
        back={{ href: "/admin/blog", label: "All posts" }}
        title={
          <span className="flex flex-wrap items-center gap-3">
            <span className="min-w-0 break-words">{post.title}</span>
            <BlogStatusBadge status={post.status} />
          </span>
        }
        description={`By ${author} · ${readingMinutes(post.body)} min read`}
        actions={
          post.status === "PUBLISHED" ? (
            <a
              href={`/blog/${post.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-grape hover:underline"
            >
              View on site
              <AdminIcon name="external" className="size-3.5" />
            </a>
          ) : undefined
        }
      />

      {saved && SAVED_MESSAGES[saved] && (
        <p role="status" className="mb-4 rounded-lg bg-trail-teal/10 px-3 py-2 text-sm font-medium text-admin-ink">
          {SAVED_MESSAGES[saved]}
        </p>
      )}

      {post.status === "DRAFT" && post.reviewNote && (
        <div className="mb-4 rounded-xl border border-blaze/30 bg-blaze/5 px-4 py-3">
          <p className="text-sm font-semibold text-admin-ink">Changes requested</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-admin-ink">{post.reviewNote}</p>
        </div>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        {editable ? (
          <AdminCard>
            <div className="px-5 pt-5">
              <BlogEditor
                action={saveBlogPostAction.bind(null, post.id)}
                siteUrl={host}
                slugLocked={!!post.publishedAt}
                buttons={buttons}
                defaults={{
                  title: post.title,
                  slug: post.slug,
                  excerpt: post.excerpt,
                  body: post.body,
                  coverImageUrl: post.coverImageUrl ?? "",
                  coverImageAlt: post.coverImageAlt ?? "",
                }}
              />
            </div>
          </AdminCard>
        ) : (
          // The author's own post while it waits for review: read-only.
          <AdminCard title="Waiting for review" description="An admin will publish it or send it back with notes. Withdraw it to keep editing.">
            <div className="bg-night px-6 py-8 sm:px-10">
              <h2 className="font-headline text-3xl font-bold text-sand">{post.title}</h2>
              <p className="mb-6 mt-2 text-white/60">{post.excerpt}</p>
              <Markdown>{post.body}</Markdown>
            </div>
          </AdminCard>
        )}

        <div className="flex flex-col gap-6">
          <AdminCard title="Status">
            <DetailList
              rows={[
                { label: "Status", value: <BlogStatusBadge status={post.status} /> },
                { label: "Author", value: author },
                { label: "Last edited", value: formatAdminDateTime(post.updatedAt) },
                ...(post.submittedAt && post.status === "SUBMITTED"
                  ? [{ label: "Submitted", value: formatAdminDateTime(post.submittedAt) }]
                  : []),
                ...(post.publishedAt ? [{ label: "First published", value: formatAdminDateTime(post.publishedAt) }] : []),
              ]}
            />
            <div className="border-t border-admin-line px-5 py-4">
              <BlogPostControls
                postId={post.id}
                canWithdraw={post.status === "SUBMITTED" && mine && !admin}
                canReturn={admin && post.status === "SUBMITTED"}
                canUnpublish={admin && post.status === "PUBLISHED"}
                canDelete={admin || (mine && post.status === "DRAFT" && !post.publishedAt)}
              />
            </div>
          </AdminCard>

          <AdminCard title="How publishing works">
            <ol className="flex list-decimal flex-col gap-2 py-4 pl-9 pr-5 text-sm text-admin-muted">
              <li>Write the post and save it as a draft as often as you like.</li>
              <li>Submit it for review when it&apos;s ready.</li>
              <li>An admin publishes it, or sends it back with notes.</li>
            </ol>
          </AdminCard>
        </div>
      </div>
    </>
  );
}

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth";
import { isAdmin } from "@/lib/blog";
import { blogCoverUrl } from "@/lib/artworkUrls";
import {
  AdminIcon,
  AdminPageHeader,
  AdminTabs,
  BlogStatusBadge,
  CARD_CLASSES,
  EmptyMessage,
  PRIMARY_BUTTON,
  formatAdminDate,
} from "@/components/admin/ui";
import type { BlogPostStatus, Prisma } from "@/generated/prisma/client";

const TABS: { key: string; label: string; status?: BlogPostStatus }[] = [
  { key: "", label: "All" },
  { key: "submitted", label: "Awaiting review", status: "SUBMITTED" },
  { key: "drafts", label: "Drafts", status: "DRAFT" },
  { key: "published", label: "Published", status: "PUBLISHED" },
];

export default async function AdminBlogPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string; deleted?: string }>;
}) {
  const staff = await requireStaff();
  const admin = isAdmin(staff);
  const { show, deleted } = await searchParams;
  const tab = TABS.find((t) => t.key === show) ?? TABS[0];

  // Admins see every post; other staff see only their own.
  const scope: Prisma.BlogPostWhereInput = admin ? {} : { authorId: staff.id };
  const [posts, counts] = await Promise.all([
    prisma.blogPost.findMany({
      where: { ...scope, ...(tab.status ? { status: tab.status } : {}) },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        excerpt: true,
        status: true,
        coverImageUrl: true,
        updatedAt: true,
        publishedAt: true,
        reviewNote: true,
        author: { select: { firstName: true, lastName: true, email: true } },
      },
      take: 200,
    }),
    prisma.blogPost.groupBy({ by: ["status"], where: scope, _count: { _all: true } }),
  ]);
  const countOf = (status?: BlogPostStatus) =>
    counts.filter((c) => !status || c.status === status).reduce((sum, c) => sum + c._count._all, 0);

  return (
    <>
      <AdminPageHeader
        title="Blog"
        description={
          admin
            ? "Write posts, review what the team submits, and publish to the blog."
            : "Write posts and submit them for review. An admin publishes them."
        }
        actions={
          <>
            <a href="/blog" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-grape hover:underline">
              View blog
            </a>
            <Link href="/admin/blog/new" className={PRIMARY_BUTTON}>
              <AdminIcon name="plus" className="size-4" />
              New post
            </Link>
          </>
        }
      />

      {deleted && (
        <p role="status" className="mb-4 rounded-lg bg-trail-teal/10 px-3 py-2 text-sm font-medium text-admin-ink">
          Post deleted.
        </p>
      )}

      <section className={`${CARD_CLASSES} overflow-hidden`}>
        <AdminTabs
          label="Filter by status"
          tabs={TABS.map((t) => ({
            href: t.key ? `/admin/blog?show=${t.key}` : "/admin/blog",
            label: t.label,
            count: countOf(t.status),
            active: t === tab,
          }))}
        />

        {posts.length === 0 ? (
          <EmptyMessage>
            {countOf() === 0 ? (
              <>
                No posts yet.{" "}
                <Link href="/admin/blog/new" className="font-medium text-grape hover:underline">
                  Write the first one
                </Link>
                .
              </>
            ) : (
              "No posts here."
            )}
          </EmptyMessage>
        ) : (
          <ul className="divide-y divide-admin-line">
            {posts.map((p) => {
              const author = p.author ? [p.author.firstName, p.author.lastName].filter(Boolean).join(" ") || p.author.email : "Former staff";
              return (
                <li key={p.id} className="transition-colors hover:bg-admin-canvas/60">
                  <Link href={`/admin/blog/${p.id}`} className="flex items-center gap-4 px-5 py-4">
                    <span className="hidden aspect-[16/9] w-28 shrink-0 overflow-hidden rounded-lg bg-admin-canvas sm:block">
                      {p.coverImageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element -- Cloudinary URL with its own transforms
                        <img src={blogCoverUrl(p.coverImageUrl, 224, 126)} alt="" className="size-full object-cover" />
                      )}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="truncate font-semibold text-admin-ink">{p.title}</span>
                      <span className="truncate text-sm text-admin-muted">{p.excerpt}</span>
                      <span className="text-xs text-admin-faint">
                        {admin && `${author} · `}
                        {p.status === "PUBLISHED" && p.publishedAt
                          ? `Published ${formatAdminDate(p.publishedAt)}`
                          : `Edited ${formatAdminDate(p.updatedAt)}`}
                        {p.status === "DRAFT" && p.reviewNote && <span className="font-medium text-blaze"> · Changes requested</span>}
                      </span>
                    </span>
                    <BlogStatusBadge status={p.status} />
                    <AdminIcon name="chevron-right" className="size-4 text-admin-faint" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}

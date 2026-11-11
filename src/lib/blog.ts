import "server-only";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isOwnBlogImageUrl } from "@/lib/artworkUrls";
import type { BlogPost, BlogPostStatus, Profile } from "@/generated/prisma/client";

export const BLOG_TITLE_MAX = 120;
export const BLOG_EXCERPT_MAX = 300;
export const BLOG_BODY_MAX = 60_000;
export const BLOG_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** "Holo vs Chrome: Which Pops More?" → "holo-vs-chrome-which-pops-more". */
export function slugify(title: string): string {
  return title
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/, "");
}

/** About 200 words a minute, at least 1. */
export function readingMinutes(markdown: string): number {
  const words = markdown.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export function isAdmin(profile: Pick<Profile, "role">): boolean {
  return profile.role === "ADMIN";
}

/**
 * Who may change a post: admins always; its author only while it's a draft
 * (once submitted it waits for an admin to publish it or send it back).
 */
export function canEditPost(profile: Pick<Profile, "id" | "role">, post: Pick<BlogPost, "authorId" | "status">): boolean {
  if (isAdmin(profile)) return true;
  return post.authorId === profile.id && post.status === "DRAFT";
}

/** Who may open a post in the admin: admins, and its author. */
export function canViewPost(profile: Pick<Profile, "id" | "role">, post: Pick<BlogPost, "authorId">): boolean {
  return isAdmin(profile) || post.authorId === profile.id;
}

// ─── Form ──────────────────────────────────────────────────────────────────

/** The admin editor's fields. Checked server-side on every save. */
export const blogPostFormSchema = z.object({
  title: z.string().trim().min(3, "Give the post a title.").max(BLOG_TITLE_MAX, `Keep the title under ${BLOG_TITLE_MAX} characters.`),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .max(80, "Keep the link under 80 characters.")
    .refine((v) => v === "" || BLOG_SLUG_PATTERN.test(v), "Lower-case letters, numbers and single dashes only."),
  excerpt: z
    .string()
    .trim()
    .min(10, "Add a sentence or two for the blog list.")
    .max(BLOG_EXCERPT_MAX, `Keep the summary under ${BLOG_EXCERPT_MAX} characters.`),
  body: z.string().max(BLOG_BODY_MAX, "That post is too long."),
  coverImageUrl: z
    .string()
    .trim()
    .max(2048)
    .refine((v) => v === "" || isOwnBlogImageUrl(v), "Upload the cover image again.")
    .transform((v) => v || null),
  coverImageAlt: z
    .string()
    .trim()
    .max(200, "Keep the description under 200 characters.")
    .transform((v) => v || null),
});

export type BlogPostFormData = z.output<typeof blogPostFormSchema>;

/** A post needs a real body before it can be submitted or published. */
export function readyToPublish(post: Pick<BlogPost, "body" | "title" | "excerpt">): string | null {
  if (post.body.trim().length < 50) return "Write a bit more before submitting. The post needs a body.";
  return null;
}

/** A free slug based on `base`, adding -2, -3… if it's taken by another post. */
export async function uniqueSlug(base: string, exceptId?: string): Promise<string> {
  const root = base || "post";
  for (let n = 1; n < 50; n++) {
    const candidate = n === 1 ? root : `${root.slice(0, 76)}-${n}`;
    const taken = await prisma.blogPost.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!taken || taken.id === exceptId) return candidate;
  }
  return `${root.slice(0, 60)}-${Date.now().toString(36)}`;
}

// ─── Public ────────────────────────────────────────────────────────────────

const PUBLIC_SELECT = {
  id: true,
  slug: true,
  title: true,
  excerpt: true,
  coverImageUrl: true,
  coverImageAlt: true,
  publishedAt: true,
  body: true,
  author: { select: { firstName: true } },
} as const;

export async function listPublishedPosts() {
  return prisma.blogPost.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    select: PUBLIC_SELECT,
    take: 100,
  });
}

/** A live post by its slug, or null (drafts and submitted posts are never public). */
export async function getPublishedPost(slug: string) {
  if (!BLOG_SLUG_PATTERN.test(slug) || slug.length > 80) return null;
  return prisma.blogPost.findFirst({ where: { slug, status: "PUBLISHED" }, select: PUBLIC_SELECT });
}

export const BLOG_STATUS_LABELS: Record<BlogPostStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  PUBLISHED: "Published",
};

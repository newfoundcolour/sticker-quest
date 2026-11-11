"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth";
import {
  blogPostFormSchema,
  canEditPost,
  isAdmin,
  readyToPublish,
  slugify,
  uniqueSlug,
} from "@/lib/blog";
import { checkUpload } from "@/lib/fileSniff";
import { uploadBlogCover } from "@/lib/cloudinary";
import { RATE_LIMITS, rateLimit } from "@/lib/rateLimit";
import type { Profile } from "@/generated/prisma/client";

export type BlogFormState =
  | { ok: boolean; message?: string; fieldErrors?: Record<string, string>; values?: Record<string, string> }
  | undefined;

export type CoverUploadResult = { ok: true; url: string } | { ok: false; error: string };

const idSchema = z.string().min(1).max(64);
const FIELDS = ["title", "slug", "excerpt", "body", "coverImageUrl", "coverImageAlt"] as const;
const INTENTS = ["save", "submit", "publish"] as const;
type Intent = (typeof INTENTS)[number];

function readForm(formData: FormData): Record<string, string> {
  return Object.fromEntries(FIELDS.map((k) => [k, String(formData.get(k) ?? "")]));
}

function errorsFrom(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) out[String(issue.path[0] ?? "form")] ??= issue.message;
  return out;
}

function revalidateBlog(post?: { id: string; slug: string }) {
  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  if (post) {
    revalidatePath(`/admin/blog/${post.id}`);
    revalidatePath(`/blog/${post.slug}`);
  }
}

async function findPost(postId: string) {
  if (!idSchema.safeParse(postId).success) return null;
  return prisma.blogPost.findUnique({ where: { id: postId } });
}

/**
 * The editor's buttons: Save draft, Submit for review (author) and Publish
 * (admins only). The post is saved first, then the intent is applied.
 */
export async function saveBlogPostAction(postId: string | null, _prev: BlogFormState, formData: FormData): Promise<BlogFormState> {
  const staff = await requireStaff();
  const intentRaw = String(formData.get("intent") ?? "save");
  const intent: Intent = (INTENTS as readonly string[]).includes(intentRaw) ? (intentRaw as Intent) : "save";
  if (intent === "publish" && !isAdmin(staff)) return { ok: false, message: "Only admins can publish posts." };

  const existing = postId ? await findPost(postId) : null;
  if (postId && !existing) return { ok: false, message: "That post no longer exists." };
  if (existing && !canEditPost(staff, existing)) {
    return { ok: false, message: "This post is waiting for review, so it can't be edited right now." };
  }

  const values = readForm(formData);
  const parsed = blogPostFormSchema.safeParse(values);
  if (!parsed.success) return { ok: false, fieldErrors: errorsFrom(parsed.error), values };
  const data = parsed.data;

  // The link is fixed once a post has been live, so shared links keep working.
  let slug: string;
  if (existing?.publishedAt) {
    slug = existing.slug;
  } else if (data.slug) {
    const taken = await prisma.blogPost.findUnique({ where: { slug: data.slug }, select: { id: true } });
    if (taken && taken.id !== existing?.id) return { ok: false, fieldErrors: { slug: "Another post already uses this link." }, values };
    slug = data.slug;
  } else {
    slug = await uniqueSlug(slugify(data.title), existing?.id);
  }

  if (intent !== "save") {
    const problem = readyToPublish(data);
    if (problem) return { ok: false, fieldErrors: { body: problem }, values };
  }

  const fields = {
    title: data.title,
    slug,
    excerpt: data.excerpt,
    body: data.body,
    coverImageUrl: data.coverImageUrl,
    coverImageAlt: data.coverImageAlt,
  };
  const now = new Date();
  const statusChange =
    intent === "submit" && existing?.status !== "PUBLISHED"
      ? { status: "SUBMITTED" as const, submittedAt: now, reviewNote: null }
      : intent === "publish"
        ? { status: "PUBLISHED" as const, publishedAt: existing?.publishedAt ?? now, reviewNote: null }
        : {};

  const post = existing
    ? await prisma.blogPost.update({ where: { id: existing.id }, data: { ...fields, ...statusChange } })
    : await prisma.blogPost.create({ data: { ...fields, ...statusChange, authorId: staff.id } });

  revalidateBlog(post);
  if (existing && existing.slug !== post.slug) revalidatePath(`/blog/${existing.slug}`);

  if (!existing) redirect(`/admin/blog/${post.id}?saved=${intent}`);
  return {
    ok: true,
    message:
      intent === "publish"
        ? "Published. It's live on the blog."
        : intent === "submit"
          ? "Submitted for review. An admin will publish it or send it back with notes."
          : "Draft saved.",
  };
}

/** Uploads a cover image from the editor; returns its URL to put in the form. */
export async function uploadBlogCoverAction(formData: FormData): Promise<CoverUploadResult> {
  const staff = await requireStaff();
  if (!(await rateLimit("blog-cover", staff.id, RATE_LIMITS.staffUploadPerUser))) {
    return { ok: false, error: "Too many uploads. Try again in a few minutes." };
  }
  const check = await checkUpload(formData.get("file"), {
    maxBytes: 10 * 1024 * 1024,
    allowed: ["png", "jpeg", "webp"],
    label: "a PNG, JPG or WebP image",
  });
  if (!check.ok) return { ok: false, error: check.error };

  try {
    const { url } = await uploadBlogCover(Buffer.from(check.bytes), check.filename);
    return { ok: true, url };
  } catch (error) {
    console.error("Blog cover upload failed:", error);
    return { ok: false, error: "The upload failed. Please try again." };
  }
}

type SimpleResult = { ok: false; message: string } | void;

async function changePost(
  postId: string,
  allowed: (staff: Profile, post: NonNullable<Awaited<ReturnType<typeof findPost>>>) => string | null,
  data: (post: NonNullable<Awaited<ReturnType<typeof findPost>>>) => Parameters<typeof prisma.blogPost.update>[0]["data"],
): Promise<SimpleResult> {
  const staff = await requireStaff();
  const post = await findPost(postId);
  if (!post) return { ok: false, message: "That post no longer exists." };
  const problem = allowed(staff, post);
  if (problem) return { ok: false, message: problem };
  const updated = await prisma.blogPost.update({ where: { id: post.id }, data: data(post) });
  revalidateBlog(updated);
}

/** Author takes a submitted post back to keep editing. */
export async function withdrawBlogPostAction(postId: string): Promise<SimpleResult> {
  return changePost(
    postId,
    (staff, post) =>
      post.status !== "SUBMITTED"
        ? "This post isn't waiting for review."
        : post.authorId === staff.id || isAdmin(staff)
          ? null
          : "Only the author can withdraw this post.",
    () => ({ status: "DRAFT", submittedAt: null }),
  );
}

/** Admin sends a submitted post back to its author, with a note. */
export async function returnBlogPostAction(postId: string, note: string): Promise<SimpleResult> {
  const cleanNote = String(note ?? "").trim().slice(0, 1000);
  return changePost(
    postId,
    (staff, post) =>
      !isAdmin(staff)
        ? "Only admins can review posts."
        : post.status !== "SUBMITTED"
          ? "This post isn't waiting for review."
          : cleanNote.length < 3
            ? "Add a short note so the writer knows what to change."
            : null,
    () => ({ status: "DRAFT", submittedAt: null, reviewNote: cleanNote }),
  );
}

/** Admin takes a live post off the blog. It keeps its link for when it's republished. */
export async function unpublishBlogPostAction(postId: string): Promise<SimpleResult> {
  return changePost(
    postId,
    (staff, post) => (!isAdmin(staff) ? "Only admins can unpublish posts." : post.status !== "PUBLISHED" ? "This post isn't live." : null),
    () => ({ status: "DRAFT" }),
  );
}

/** Admins can delete any post; authors only their own drafts that were never live. */
export async function deleteBlogPostAction(postId: string): Promise<SimpleResult> {
  const staff = await requireStaff();
  const post = await findPost(postId);
  if (!post) return { ok: false, message: "That post no longer exists." };
  const allowed = isAdmin(staff) || (post.authorId === staff.id && post.status === "DRAFT" && !post.publishedAt);
  if (!allowed) return { ok: false, message: "You can only delete your own drafts." };

  await prisma.blogPost.delete({ where: { id: post.id } });
  revalidateBlog(post);
  redirect("/admin/blog?deleted=1");
}

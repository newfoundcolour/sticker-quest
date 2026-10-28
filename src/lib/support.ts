import "server-only";
import { notFound } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkUpload } from "@/lib/fileSniff";
import { BUCKETS, randomStoragePath, removePrivateFile, uploadPrivateFile } from "@/lib/storage";
import { ATTACHMENT_MAX_BYTES, MESSAGE_MAX_LENGTH, SUPPORT_CATEGORIES } from "@/lib/supportLabels";
import type { ConversationStatus } from "@/generated/prisma/client";

/**
 * Support messaging. Customer functions always take the user id from the
 * verified session and scope every query by it — someone else's
 * conversation is "not found". Staff functions are only called after
 * requireStaff().
 */

export const ADMIN_SUPPORT_PAGE_SIZE = 20;

const idSchema = z.string().min(1).max(64);

export const messageBodySchema = z
  .string()
  .trim()
  .min(1, "Type a message first.")
  .max(MESSAGE_MAX_LENGTH, `Keep it under ${MESSAGE_MAX_LENGTH.toLocaleString("en-ZA")} characters.`);

export const newConversationSchema = z.object({
  category: z.enum(SUPPORT_CATEGORIES as [string, ...string[]], { message: "Choose what it's about." }),
  orderId: z
    .string()
    .max(64)
    .optional()
    .transform((v) => (v ? v : undefined)),
  body: messageBodySchema,
});

const messageSelect = {
  id: true,
  sender: true,
  body: true,
  attachmentPath: true,
  attachmentName: true,
  createdAt: true,
  readAt: true,
} as const;

/** Validates and stores an optional reference image; returns its path, or an error for the form. */
async function storeAttachment(file: unknown, ownerUserId: string) {
  if (!(file instanceof File) || file.size === 0) return { ok: true as const, attachment: null };
  const check = await checkUpload(file, { maxBytes: ATTACHMENT_MAX_BYTES, allowed: ["jpeg", "png", "webp"], label: "a JPG, PNG or WebP image" });
  if (!check.ok) return check;
  const path = randomStoragePath(`users/${ownerUserId}`, check.sniffed.ext);
  await uploadPrivateFile(BUCKETS.supportAttachments, path, check.bytes, check.sniffed.mime);
  return { ok: true as const, attachment: { path, name: check.filename } };
}

// ─── Customer side ──────────────────────────────────────────────────────────

export async function listCustomerConversations(userId: string) {
  const conversations = await prisma.supportConversation.findMany({
    where: { userId },
    orderBy: { lastMessageAt: "desc" },
    take: 100,
    include: {
      order: { select: { id: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1, select: { body: true, sender: true, attachmentPath: true } },
      _count: { select: { messages: { where: { sender: "STAFF", readAt: null } } } },
    },
  });
  return conversations.map((c) => ({ ...c, lastMessage: c.messages[0], unread: c._count.messages }));
}

/** One of the customer's conversations with its messages, or a 404 if it isn't theirs. */
export async function getCustomerConversationOr404(userId: string, conversationId: string) {
  if (!idSchema.safeParse(conversationId).success) notFound();
  const conversation = await prisma.supportConversation.findFirst({
    where: { id: conversationId, userId },
    include: {
      order: { select: { id: true } },
      messages: { orderBy: { createdAt: "asc" }, select: messageSelect },
    },
  });
  if (!conversation) notFound();
  return conversation;
}

/** Marks staff replies as read once the customer has the thread open. */
export async function markReadByCustomer(userId: string, conversationId: string) {
  await prisma.supportMessage.updateMany({
    where: { conversationId, conversation: { userId }, sender: "STAFF", readAt: null },
    data: { readAt: new Date() },
  });
}

export async function countUnreadForCustomer(userId: string): Promise<number> {
  return prisma.supportMessage.count({ where: { sender: "STAFF", readAt: null, conversation: { userId } } });
}

/** The customer's orders, for the "link an order" picker. */
export async function listOrdersForSupportPicker(userId: string) {
  return prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, createdAt: true },
  });
}

export type SupportWriteResult = { ok: true; conversationId: string } | { ok: false; error: string };

export async function startConversation(
  userId: string,
  input: { category: string; orderId?: string; body: string },
  file: unknown,
): Promise<SupportWriteResult> {
  const parsed = newConversationSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { category, orderId, body } = parsed.data;

  // A linked order must be the customer's own.
  if (orderId) {
    const owned = await prisma.order.findFirst({ where: { id: orderId, userId }, select: { id: true } });
    if (!owned) return { ok: false, error: "Choose one of your own orders." };
  }

  const stored = await storeAttachment(file, userId);
  if (!stored.ok) return { ok: false, error: stored.error };

  try {
    const conversation = await prisma.supportConversation.create({
      data: {
        userId,
        category: category as (typeof SUPPORT_CATEGORIES)[number],
        orderId: orderId ?? null,
        lastMessageAt: new Date(),
        messages: {
          create: {
            sender: "CUSTOMER",
            senderUserId: userId,
            body,
            attachmentPath: stored.attachment?.path,
            attachmentName: stored.attachment?.name,
          },
        },
      },
    });
    return { ok: true, conversationId: conversation.id };
  } catch (error) {
    if (stored.attachment) await removePrivateFile(BUCKETS.supportAttachments, stored.attachment.path);
    throw error;
  }
}

/** Customer reply. Replying to a resolved conversation reopens it. */
export async function replyAsCustomer(userId: string, conversationId: string, body: string, file: unknown): Promise<SupportWriteResult> {
  if (!idSchema.safeParse(conversationId).success) return { ok: false, error: "We couldn't find that conversation." };
  const parsedBody = messageBodySchema.safeParse(body);
  if (!parsedBody.success) return { ok: false, error: parsedBody.error.issues[0].message };

  const conversation = await prisma.supportConversation.findFirst({ where: { id: conversationId, userId }, select: { id: true } });
  if (!conversation) return { ok: false, error: "We couldn't find that conversation." };

  const stored = await storeAttachment(file, userId);
  if (!stored.ok) return { ok: false, error: stored.error };

  try {
    const now = new Date();
    await prisma.$transaction([
      prisma.supportMessage.create({
        data: {
          conversationId,
          sender: "CUSTOMER",
          senderUserId: userId,
          body: parsedBody.data,
          attachmentPath: stored.attachment?.path,
          attachmentName: stored.attachment?.name,
        },
      }),
      prisma.supportConversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: now, status: "OPEN", resolvedAt: null },
      }),
    ]);
    return { ok: true, conversationId };
  } catch (error) {
    if (stored.attachment) await removePrivateFile(BUCKETS.supportAttachments, stored.attachment.path);
    throw error;
  }
}

/** Where a message's attachment lives — only if it's in one of the customer's conversations. */
export async function findCustomerAttachment(userId: string, messageId: string) {
  if (!idSchema.safeParse(messageId).success) return null;
  return prisma.supportMessage.findFirst({
    where: { id: messageId, conversation: { userId }, attachmentPath: { not: null } },
    select: { attachmentPath: true, attachmentName: true },
  });
}

// ─── Staff side (callers must requireStaff() first) ──────────────────────────

export async function listConversationsForAdmin(opts: { status?: ConversationStatus; page: number }) {
  const where = opts.status ? { status: opts.status } : {};
  const [conversations, totalCount] = await Promise.all([
    prisma.supportConversation.findMany({
      where,
      // Open first (enum order), then most recent activity.
      orderBy: [{ status: "asc" }, { lastMessageAt: "desc" }],
      skip: (opts.page - 1) * ADMIN_SUPPORT_PAGE_SIZE,
      take: ADMIN_SUPPORT_PAGE_SIZE,
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        order: { select: { id: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 1, select: { body: true, sender: true } },
        _count: { select: { messages: { where: { sender: "CUSTOMER", readAt: null } } } },
      },
    }),
    prisma.supportConversation.count({ where }),
  ]);
  return {
    conversations: conversations.map((c) => ({ ...c, lastMessage: c.messages[0], unread: c._count.messages })),
    totalCount,
  };
}

export async function getConversationForAdminOr404(conversationId: string) {
  if (!idSchema.safeParse(conversationId).success) notFound();
  const conversation = await prisma.supportConversation.findUnique({
    where: { id: conversationId },
    include: {
      user: { select: { firstName: true, lastName: true, email: true } },
      order: { select: { id: true, status: true } },
      messages: { orderBy: { createdAt: "asc" }, select: messageSelect },
    },
  });
  if (!conversation) notFound();
  return conversation;
}

export async function markReadByStaff(conversationId: string) {
  await prisma.supportMessage.updateMany({
    where: { conversationId, sender: "CUSTOMER", readAt: null },
    data: { readAt: new Date() },
  });
}

export async function replyAsStaff(staffUserId: string, conversationId: string, body: string): Promise<SupportWriteResult> {
  if (!idSchema.safeParse(conversationId).success) return { ok: false, error: "Conversation not found." };
  const parsedBody = messageBodySchema.safeParse(body);
  if (!parsedBody.success) return { ok: false, error: parsedBody.error.issues[0].message };

  const conversation = await prisma.supportConversation.findUnique({ where: { id: conversationId }, select: { id: true } });
  if (!conversation) return { ok: false, error: "Conversation not found." };

  await prisma.$transaction([
    prisma.supportMessage.create({
      data: { conversationId, sender: "STAFF", senderUserId: staffUserId, body: parsedBody.data },
    }),
    prisma.supportConversation.update({ where: { id: conversationId }, data: { lastMessageAt: new Date() } }),
  ]);
  return { ok: true, conversationId };
}

export async function setConversationStatus(conversationId: string, status: ConversationStatus) {
  if (!idSchema.safeParse(conversationId).success) return;
  await prisma.supportConversation.updateMany({
    where: { id: conversationId },
    data: { status, resolvedAt: status === "RESOLVED" ? new Date() : null },
  });
}

export async function findAttachmentForStaff(messageId: string) {
  if (!idSchema.safeParse(messageId).success) return null;
  return prisma.supportMessage.findFirst({
    where: { id: messageId, attachmentPath: { not: null } },
    select: { attachmentPath: true, attachmentName: true },
  });
}

/** For the admin Quick Stats and nav badge. */
export async function getSupportCountsForStaff() {
  const [open, unreadConversations] = await Promise.all([
    prisma.supportConversation.count({ where: { status: "OPEN" } }),
    prisma.supportConversation.count({ where: { messages: { some: { sender: "CUSTOMER", readAt: null } } } }),
  ]);
  return { open, unreadConversations };
}

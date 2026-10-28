"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff, requireVerifiedUser } from "@/lib/auth";
import { RATE_LIMITS, TOO_MANY_ATTEMPTS, rateLimit } from "@/lib/rateLimit";
import { notify } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { replyAsCustomer, replyAsStaff, setConversationStatus, startConversation } from "@/lib/support";

export type SupportFormState =
  | { ok: true; message?: string }
  | { ok: false; error: string; values?: { category?: string; orderId?: string; body?: string } }
  | undefined;

const FAILED = "We couldn't send that just now. Please try again.";

function text(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v : "";
}

// ─── Customer ───────────────────────────────────────────────────────────────

/** "New message": always starts a new private conversation, then opens it. */
export async function startConversationAction(_prev: SupportFormState, formData: FormData): Promise<SupportFormState> {
  const user = await requireVerifiedUser("/account/support/new");
  const values = { category: text(formData, "category"), orderId: text(formData, "orderId"), body: text(formData, "body") };

  if (!(await rateLimit("support-new", user.id, RATE_LIMITS.supportNewConversationPerUser))) {
    return { ok: false, error: TOO_MANY_ATTEMPTS, values };
  }

  let conversationId: string;
  try {
    const result = await startConversation(user.id, values, formData.get("attachment"));
    if (!result.ok) return { ok: false, error: result.error, values };
    conversationId = result.conversationId;
  } catch (error) {
    console.error("Start conversation failed:", error);
    return { ok: false, error: FAILED, values };
  }

  await notify({ type: "support_message_from_customer", conversationId });
  revalidatePath("/account/support");
  redirect(`/account/support/${conversationId}`);
}

export async function customerReplyAction(
  conversationId: string,
  _prev: SupportFormState,
  formData: FormData,
): Promise<SupportFormState> {
  const user = await requireVerifiedUser("/account/support");
  const body = text(formData, "body");

  if (!(await rateLimit("support-message", user.id, RATE_LIMITS.supportMessagePerUser))) {
    return { ok: false, error: TOO_MANY_ATTEMPTS, values: { body } };
  }

  try {
    // Scoped to the session user inside replyAsCustomer; another customer's id is "not found".
    const result = await replyAsCustomer(user.id, conversationId, body, formData.get("attachment"));
    if (!result.ok) return { ok: false, error: result.error, values: { body } };
  } catch (error) {
    console.error("Customer reply failed:", error);
    return { ok: false, error: FAILED, values: { body } };
  }

  await notify({ type: "support_message_from_customer", conversationId });
  revalidatePath(`/account/support/${conversationId}`);
  revalidatePath("/account/support");
  return { ok: true };
}

// ─── Staff ──────────────────────────────────────────────────────────────────

export async function staffReplyAction(
  conversationId: string,
  _prev: SupportFormState,
  formData: FormData,
): Promise<SupportFormState> {
  const staff = await requireStaff();
  const body = text(formData, "body");

  const result = await replyAsStaff(staff.id, conversationId, body);
  if (!result.ok) return { ok: false, error: result.error, values: { body } };

  const conversation = await prisma.supportConversation.findUnique({
    where: { id: conversationId },
    select: { user: { select: { email: true } } },
  });
  if (conversation) {
    await notify({ type: "support_reply_from_staff", conversationId, customerEmail: conversation.user.email });
  }
  revalidatePath(`/admin/support/${conversationId}`);
  revalidatePath("/admin/support");
  return { ok: true };
}

export async function setConversationStatusAction(conversationId: string, resolved: boolean): Promise<void> {
  await requireStaff();
  await setConversationStatus(conversationId, resolved ? "RESOLVED" : "OPEN");
  revalidatePath(`/admin/support/${conversationId}`);
  revalidatePath("/admin/support");
  revalidatePath("/admin/orders");
}

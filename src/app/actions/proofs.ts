"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStaff, requireVerifiedUser } from "@/lib/auth";
import { RATE_LIMITS, TOO_MANY_ATTEMPTS, rateLimit } from "@/lib/rateLimit";
import { notify } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import {
  PROOF_COMMENT_MAX,
  PROOF_COMMENT_MIN,
  decideProof,
  uploadProof,
  type DecisionResult,
} from "@/lib/proofs";

export type ProofActionState = { ok: true; message: string } | { ok: false; message: string } | undefined;

const DECISION_MESSAGES: Record<Exclude<DecisionResult, "ok">, string> = {
  not_found: "We couldn't find that proof.",
  already_decided: "This proof has already been approved or rejected.",
  superseded: "There's a newer version of this proof. Have a look at that one instead.",
  not_awaiting: "This proof isn't waiting for a decision any more.",
};

const proofIdSchema = z.string().min(1).max(64);

function revalidateProofPages(orderId?: string) {
  revalidatePath("/account", "layout");
  if (orderId) revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
}

// ─── Customer ───────────────────────────────────────────────────────────────

/**
 * The proof id comes from the page, but the decision only goes through if
 * that proof is on an order owned by the session user (decideProof scopes by
 * ownerUserId). Anyone else's proof id is simply "not found".
 */
export async function approveProofAction(proofId: string): Promise<ProofActionState> {
  const user = await requireVerifiedUser("/account/proofs");
  if (!proofIdSchema.safeParse(proofId).success) return { ok: false, message: DECISION_MESSAGES.not_found };
  if (!(await rateLimit("proof-decision", user.id, RATE_LIMITS.proofDecisionPerUser))) {
    return { ok: false, message: TOO_MANY_ATTEMPTS };
  }

  const { result, orderId } = await decideProof({
    proofId,
    decision: "APPROVE",
    actorUserId: user.id,
    source: "CUSTOMER",
    ownerUserId: user.id,
  });
  revalidateProofPages(orderId);
  if (result !== "ok") return { ok: false, message: DECISION_MESSAGES[result] };

  await notify({ type: "proof_approved", orderId: orderId!, proofId, source: "CUSTOMER" });
  return { ok: true, message: "Approved! Your stickers go to print next and ship the next business day. 🎉" };
}

const rejectSchema = z.object({
  comment: z
    .string()
    .trim()
    .min(PROOF_COMMENT_MIN, `Tell us what to change (at least ${PROOF_COMMENT_MIN} characters).`)
    .max(PROOF_COMMENT_MAX, `Keep it under ${PROOF_COMMENT_MAX.toLocaleString("en-ZA")} characters.`),
});

export async function rejectProofAction(
  proofId: string,
  _prev: ProofActionState,
  formData: FormData,
): Promise<ProofActionState> {
  const user = await requireVerifiedUser("/account/proofs");
  if (!proofIdSchema.safeParse(proofId).success) return { ok: false, message: DECISION_MESSAGES.not_found };

  const parsed = rejectSchema.safeParse({ comment: formData.get("comment") ?? "" });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };

  if (!(await rateLimit("proof-decision", user.id, RATE_LIMITS.proofDecisionPerUser))) {
    return { ok: false, message: TOO_MANY_ATTEMPTS };
  }

  const { result, orderId } = await decideProof({
    proofId,
    decision: "REJECT",
    comment: parsed.data.comment,
    actorUserId: user.id,
    source: "CUSTOMER",
    ownerUserId: user.id,
  });
  revalidateProofPages(orderId);
  if (result !== "ok") return { ok: false, message: DECISION_MESSAGES[result] };

  await notify({ type: "proof_rejected", orderId: orderId!, proofId });
  return { ok: true, message: "Thanks! We've got your notes and will send a new proof soon." };
}

// ─── Staff ──────────────────────────────────────────────────────────────────

export async function uploadProofAction(
  orderId: string,
  _prev: ProofActionState,
  formData: FormData,
): Promise<ProofActionState> {
  const staff = await requireStaff();
  if (!(await rateLimit("proof-upload", staff.id, RATE_LIMITS.staffUploadPerUser))) {
    return { ok: false, message: TOO_MANY_ATTEMPTS };
  }

  try {
    const result = await uploadProof(orderId, formData.get("file"), staff.id);
    if (!result.ok) return { ok: false, message: result.error };

    const order = await prisma.order.findUnique({ where: { id: orderId }, select: { email: true } });
    if (order) await notify({ type: "proof_ready", orderId, proofId: result.proofId, customerEmail: order.email });

    revalidateProofPages(orderId);
    return { ok: true, message: `Version ${result.version} uploaded. The order is now Awaiting Approval.` };
  } catch (error) {
    console.error("Proof upload failed:", error);
    return { ok: false, message: "Upload failed. Check the Supabase service key and the proofs bucket, then try again." };
  }
}

/** For approvals given outside the site (WhatsApp, email): recorded as STAFF_ON_BEHALF with the staff member's id. */
export async function approveOnBehalfAction(proofId: string): Promise<ProofActionState> {
  const staff = await requireStaff();
  if (!proofIdSchema.safeParse(proofId).success) return { ok: false, message: DECISION_MESSAGES.not_found };

  const { result, orderId } = await decideProof({
    proofId,
    decision: "APPROVE",
    actorUserId: staff.id,
    source: "STAFF_ON_BEHALF",
  });
  revalidateProofPages(orderId);
  if (result !== "ok") return { ok: false, message: DECISION_MESSAGES[result] };

  await notify({ type: "proof_approved", orderId: orderId!, proofId, source: "STAFF_ON_BEHALF" });
  return { ok: true, message: "Recorded as approved on the customer's behalf. The order is now Approved." };
}

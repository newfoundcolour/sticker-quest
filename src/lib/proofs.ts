import "server-only";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { checkUpload, type SniffedKind } from "@/lib/fileSniff";
import { BUCKETS, randomStoragePath, removePrivateFile, uploadPrivateFile } from "@/lib/storage";
import type { ProofDecisionSource, ProofStatus } from "@/generated/prisma/client";

export const PROOF_MAX_BYTES = 20 * 1024 * 1024;
export const PROOF_KINDS: SniffedKind[] = ["png", "jpeg", "webp", "pdf"];
export const PROOF_ACCEPT = ".png,.jpg,.jpeg,.webp,.pdf";
export const PROOF_COMMENT_MIN = 3;
export const PROOF_COMMENT_MAX = 2000;

/** How a proof reads to people: its stored status, or "superseded" once a newer version exists. */
export type ProofDisplayStatus = ProofStatus | "SUPERSEDED";

export function displayStatus(proof: { status: ProofStatus; version: number }, latestVersion: number): ProofDisplayStatus {
  return proof.status === "PENDING" && proof.version < latestVersion ? "SUPERSEDED" : proof.status;
}

function latestVersionsByOrder(proofs: { orderId: string; version: number }[]): Map<string, number> {
  const latest = new Map<string, number>();
  for (const p of proofs) latest.set(p.orderId, Math.max(latest.get(p.orderId) ?? 0, p.version));
  return latest;
}

// ─── Customer side — always scoped by the session user's id ─────────────────

const proofWithOrder = {
  order: { select: { id: true, status: true, createdAt: true, items: { orderBy: { createdAt: "asc" as const } } } },
};

/** All proofs on the customer's orders, newest first, with "can I act on this?" worked out. */
export async function listCustomerProofs(userId: string) {
  const proofs = await prisma.proof.findMany({
    where: { order: { userId } },
    include: proofWithOrder,
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const latest = latestVersionsByOrder(proofs);
  return proofs.map((p) => {
    const shown = displayStatus(p, latest.get(p.orderId) ?? p.version);
    return { ...p, shownStatus: shown, actionable: shown === "PENDING" && p.order.status === "AWAITING_APPROVAL" };
  });
}

/** One of the customer's proofs plus every version on that order — or a 404 if it isn't theirs. */
export async function getCustomerProofOr404(userId: string, proofId: string) {
  if (typeof proofId !== "string" || proofId.length > 64) notFound();
  const proof = await prisma.proof.findFirst({ where: { id: proofId, order: { userId } }, include: proofWithOrder });
  if (!proof) notFound();
  const versions = await prisma.proof.findMany({
    where: { orderId: proof.orderId },
    orderBy: { version: "desc" },
    select: { id: true, version: true, status: true, createdAt: true, customerComment: true, decidedAt: true, decisionSource: true },
  });
  const latestVersion = versions[0]?.version ?? proof.version;
  const shownStatus = displayStatus(proof, latestVersion);
  return {
    proof,
    versions: versions.map((v) => ({ ...v, shownStatus: displayStatus(v, latestVersion) })),
    shownStatus,
    actionable: shownStatus === "PENDING" && proof.order.status === "AWAITING_APPROVAL",
  };
}

/** Proofs on one of the customer's orders (order detail page). The order must already be ownership-checked. */
export async function listProofsForOwnedOrder(userId: string, orderId: string) {
  const proofs = await prisma.proof.findMany({
    where: { orderId, order: { userId } },
    orderBy: { version: "desc" },
  });
  const latest = proofs[0]?.version ?? 0;
  return proofs.map((p) => ({ ...p, shownStatus: displayStatus(p, latest) }));
}

/** Where a customer's proof file lives — only if the proof is on one of their orders. */
export async function findCustomerProofFile(userId: string, proofId: string) {
  if (typeof proofId !== "string" || proofId.length > 64) return null;
  return prisma.proof.findFirst({
    where: { id: proofId, order: { userId } },
    select: { storagePath: true, mimeType: true, originalFilename: true },
  });
}

/** Orders waiting on the customer (for the nav badge). */
export async function countProofsAwaiting(userId: string): Promise<number> {
  return prisma.order.count({
    where: { userId, status: "AWAITING_APPROVAL", proofs: { some: { status: "PENDING" } } },
  });
}

// ─── Decisions ──────────────────────────────────────────────────────────────

export type DecisionResult = "ok" | "not_found" | "already_decided" | "superseded" | "not_awaiting";

/**
 * Approves or rejects one proof version. Decisions are final: the update only
 * matches a PENDING proof, so a double-click or a second tab can't decide
 * twice. The order row is locked for the duration, so a new version being
 * uploaded at the same moment can't race it.
 *
 * Pass `ownerUserId` for customer decisions — the proof must be on their order.
 */
export async function decideProof(input: {
  proofId: string;
  decision: "APPROVE" | "REJECT";
  comment?: string;
  actorUserId: string;
  source: ProofDecisionSource;
  ownerUserId?: string;
}): Promise<{ result: DecisionResult; orderId?: string }> {
  return prisma.$transaction(async (tx) => {
    const proof = await tx.proof.findFirst({
      where: { id: input.proofId, ...(input.ownerUserId && { order: { userId: input.ownerUserId } }) },
      select: { id: true, orderId: true, version: true },
    });
    if (!proof) return { result: "not_found" as const };

    await tx.$queryRaw`SELECT 1 FROM "Order" WHERE "id" = ${proof.orderId} FOR UPDATE`;

    const latest = await tx.proof.aggregate({ where: { orderId: proof.orderId }, _max: { version: true } });
    if (latest._max.version !== proof.version) return { result: "superseded" as const, orderId: proof.orderId };

    if (input.source === "CUSTOMER") {
      const order = await tx.order.findUnique({ where: { id: proof.orderId }, select: { status: true } });
      if (order?.status !== "AWAITING_APPROVAL") return { result: "not_awaiting" as const, orderId: proof.orderId };
    }

    const { count } = await tx.proof.updateMany({
      where: { id: proof.id, status: "PENDING" },
      data: {
        status: input.decision === "APPROVE" ? "APPROVED" : "REJECTED",
        customerComment: input.decision === "REJECT" ? input.comment : null,
        decidedAt: new Date(),
        decidedBy: input.actorUserId,
        decisionSource: input.source,
      },
    });
    if (count !== 1) return { result: "already_decided" as const, orderId: proof.orderId };

    await tx.order.update({
      where: { id: proof.orderId },
      data: { status: input.decision === "APPROVE" ? "APPROVED" : "AWAITING_PROOF" },
    });
    return { result: "ok" as const, orderId: proof.orderId };
  });
}

/**
 * When staff set an order to Approved by hand (e.g. the customer approved on
 * WhatsApp), record that against the latest pending proof so the history
 * shows who approved it and how.
 */
export async function recordStaffApprovalIfPending(orderId: string, staffUserId: string): Promise<void> {
  const latest = await prisma.proof.findFirst({
    where: { orderId },
    orderBy: { version: "desc" },
    select: { id: true, status: true },
  });
  if (latest?.status !== "PENDING") return;
  await decideProof({ proofId: latest.id, decision: "APPROVE", actorUserId: staffUserId, source: "STAFF_ON_BEHALF" });
}

// ─── Admin side ─────────────────────────────────────────────────────────────

export type UploadProofResult = { ok: true; version: number; proofId: string } | { ok: false; error: string };

/**
 * Stores a new proof version for an order: content-checked file, random
 * storage name, version N+1, order moved to Awaiting Approval. If saving the
 * record fails, the uploaded file is removed again.
 */
export async function uploadProof(orderId: string, file: unknown, staffUserId: string): Promise<UploadProofResult> {
  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { id: true } });
  if (!order) return { ok: false, error: "That order doesn't exist." };

  const check = await checkUpload(file, { maxBytes: PROOF_MAX_BYTES, allowed: PROOF_KINDS, label: "PNG, JPG, WebP or PDF" });
  if (!check.ok) return check;

  const storagePath = randomStoragePath(`orders/${orderId}`, check.sniffed.ext);
  await uploadPrivateFile(BUCKETS.proofs, storagePath, check.bytes, check.sniffed.mime);

  try {
    const proof = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT 1 FROM "Order" WHERE "id" = ${orderId} FOR UPDATE`;
      const latest = await tx.proof.aggregate({ where: { orderId }, _max: { version: true } });
      const created = await tx.proof.create({
        data: {
          orderId,
          version: (latest._max.version ?? 0) + 1,
          storagePath,
          originalFilename: check.filename,
          mimeType: check.sniffed.mime,
          sizeBytes: check.bytes.byteLength,
          uploadedBy: staffUserId,
        },
      });
      await tx.order.update({ where: { id: orderId }, data: { status: "AWAITING_APPROVAL" } });
      return created;
    });
    return { ok: true, version: proof.version, proofId: proof.id };
  } catch (error) {
    await removePrivateFile(BUCKETS.proofs, storagePath);
    throw error;
  }
}

/** Every version for the admin Proofs panel, with uploader/decider emails. */
export async function listProofsForAdmin(orderId: string) {
  const proofs = await prisma.proof.findMany({ where: { orderId }, orderBy: { version: "desc" } });
  const ids = [...new Set(proofs.flatMap((p) => [p.uploadedBy, p.decidedBy]).filter((v): v is string => !!v))];
  const people = await prisma.profile.findMany({ where: { id: { in: ids } }, select: { id: true, email: true, firstName: true } });
  const nameOf = new Map(people.map((p) => [p.id, p.firstName || p.email]));
  const latest = proofs[0]?.version ?? 0;
  return proofs.map((p) => ({
    ...p,
    shownStatus: displayStatus(p, latest),
    uploadedByName: nameOf.get(p.uploadedBy) ?? "Staff",
    decidedByName: p.decidedBy ? (nameOf.get(p.decidedBy) ?? "Unknown") : null,
  }));
}

export async function findProofFileForStaff(proofId: string) {
  if (typeof proofId !== "string" || proofId.length > 64) return null;
  return prisma.proof.findUnique({
    where: { id: proofId },
    select: { storagePath: true, mimeType: true, originalFilename: true },
  });
}

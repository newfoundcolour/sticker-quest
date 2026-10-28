import { PROOF_STATUS_CLASSES, PROOF_STATUS_LABELS } from "@/lib/orderLabels";
import type { ProofDisplayStatus } from "@/lib/proofs";

export function ProofStatusPill({ status }: { status: ProofDisplayStatus }) {
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-black ${PROOF_STATUS_CLASSES[status]}`}>
      {PROOF_STATUS_LABELS[status]}
    </span>
  );
}

export function proofFileIcon(mimeType: string): string {
  return mimeType === "application/pdf" ? "📄" : "🖼️";
}

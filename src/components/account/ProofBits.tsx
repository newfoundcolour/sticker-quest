import Image from "next/image";
import { PROOF_STATUS_CLASSES, PROOF_STATUS_LABELS } from "@/lib/orderLabels";
import type { ProofDisplayStatus } from "@/lib/proofs";

export function ProofStatusPill({ status }: { status: ProofDisplayStatus }) {
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-black ${PROOF_STATUS_CLASSES[status]}`}>
      {PROOF_STATUS_LABELS[status]}
    </span>
  );
}

const PROOF_CHIP_STYLES: Record<ProofDisplayStatus, { chip: string; dot: string }> = {
  PENDING: { chip: "border-zap/[0.38] bg-zap/[0.13] text-zap", dot: "/icons/orders/dot-zap.svg" },
  APPROVED: { chip: "border-leaf/[0.38] bg-leaf/[0.13] text-leaf", dot: "/icons/orders/dot-leaf.svg" },
  REJECTED: { chip: "border-blaze/[0.38] bg-blaze/[0.13] text-blaze", dot: "/icons/orders/dot-blaze.svg" },
  SUPERSEDED: { chip: "border-white/[0.13] bg-white/[0.06] text-dusk-note", dot: "/icons/orders/dot-grape.svg" },
};

/** The proof status pill for dark surfaces, matching the Orders page's StatusChip. */
export function ProofStatusChip({ status }: { status: ProofDisplayStatus }) {
  const style = PROOF_CHIP_STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-[9px] py-[5px] text-xs font-medium ${style.chip}`}
    >
      <Image src={style.dot} alt="" width={5} height={5} />
      {PROOF_STATUS_LABELS[status]}
    </span>
  );
}

export function proofFileIcon(mimeType: string): string {
  return mimeType === "application/pdf" ? "📄" : "🖼️";
}

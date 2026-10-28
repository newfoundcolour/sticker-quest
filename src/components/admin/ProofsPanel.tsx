import { listProofsForAdmin, PROOF_ACCEPT } from "@/lib/proofs";
import { PROOF_STATUS_CLASSES, PROOF_STATUS_LABELS } from "@/lib/orderLabels";
import { ApproveOnBehalfButton, ProofUploadForm } from "@/components/admin/ProofForms";

function formatWhen(date: Date): string {
  return date.toLocaleString("en-ZA", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatSize(bytes: number): string {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/** Staff view of every proof version on an order, plus upload. Rendered on /admin/orders/[id] (staff-only). */
export async function ProofsPanel({ orderId }: { orderId: string }) {
  const proofs = await listProofsForAdmin(orderId);

  return (
    <section className="mt-8 rounded-2xl border border-ink-navy/10 bg-white/70 p-5">
      <h2 className="text-sm font-semibold text-ink-navy/80">Proofs</h2>
      <div className="mt-3">
        <ProofUploadForm orderId={orderId} accept={PROOF_ACCEPT} />
      </div>

      {proofs.length === 0 ? (
        <p className="mt-4 text-sm text-ink-navy/50">No proofs yet. Uploading one moves the order to Awaiting Approval.</p>
      ) : (
        <ol className="mt-5 flex flex-col gap-3">
          {proofs.map((p) => (
            <li key={p.id} className="rounded-xl border border-ink-navy/10 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-ink-navy">
                    Version {p.version}{" "}
                    <span className="font-normal text-ink-navy/50">
                      · {p.originalFilename} · {formatSize(p.sizeBytes)}
                    </span>
                  </p>
                  <p className="text-xs text-ink-navy/50">
                    Uploaded {formatWhen(p.createdAt)} by {p.uploadedByName}
                  </p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${PROOF_STATUS_CLASSES[p.shownStatus]}`}>
                  {PROOF_STATUS_LABELS[p.shownStatus]}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap gap-4 text-xs">
                <a href={`/admin/proofs/${p.id}/file`} target="_blank" rel="noopener noreferrer" className="font-medium text-coral-signal underline underline-offset-2">
                  View
                </a>
                <a href={`/admin/proofs/${p.id}/file?download=1`} className="font-medium text-coral-signal underline underline-offset-2">
                  Download
                </a>
              </div>

              {p.decidedAt && (
                <p className="mt-2 text-sm text-ink-navy/70">
                  {p.status === "APPROVED" ? "Approved" : "Changes requested"} {formatWhen(p.decidedAt)}
                  {p.decisionSource === "STAFF_ON_BEHALF"
                    ? ` · recorded by ${p.decidedByName ?? "staff"} on the customer's behalf`
                    : " · by the customer"}
                </p>
              )}
              {p.customerComment && (
                <blockquote className="mt-2 whitespace-pre-wrap rounded-lg border-l-4 border-coral-signal bg-coral-signal/5 px-3 py-2 text-sm text-ink-navy">
                  {p.customerComment}
                </blockquote>
              )}
              {p.shownStatus === "PENDING" && (
                <div className="mt-3">
                  <ApproveOnBehalfButton proofId={p.id} />
                </div>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

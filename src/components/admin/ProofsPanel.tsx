import { listProofsForAdmin, PROOF_ACCEPT } from "@/lib/proofs";
import { ApproveOnBehalfButton, ProofUploadForm } from "@/components/admin/ProofForms";
import {
  AdminCard,
  AdminIcon,
  ProofStatusBadge,
  SMALL_SECONDARY_BUTTON,
  formatAdminDateTime,
} from "@/components/admin/ui";

function formatSize(bytes: number): string {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/** Staff view of every proof version on an order, newest first, plus upload. Rendered on /admin/orders/[id] (staff-only). */
export async function ProofsPanel({ orderId }: { orderId: string }) {
  const proofs = await listProofsForAdmin(orderId);

  return (
    <AdminCard
      title="Proofs"
      description="Uploading a new version sends it to the customer and moves the order to Awaiting Approval."
    >
      <div className="border-b border-admin-line px-5 py-4">
        <ProofUploadForm orderId={orderId} accept={PROOF_ACCEPT} />
      </div>

      {proofs.length === 0 ? (
        <p className="px-5 py-6 text-sm text-admin-muted">No proofs yet.</p>
      ) : (
        <ol className="divide-y divide-admin-line">
          {proofs.map((p) => (
            <li key={p.id} className="flex flex-col gap-3 px-5 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-admin-ink">Version {p.version}</p>
                  <p className="truncate text-xs text-admin-muted">
                    {p.originalFilename} · {formatSize(p.sizeBytes)} · uploaded {formatAdminDateTime(p.createdAt)} by{" "}
                    {p.uploadedByName}
                  </p>
                </div>
                <ProofStatusBadge status={p.shownStatus} />
              </div>

              {p.decidedAt && (
                <p className="text-sm text-admin-muted">
                  {p.status === "APPROVED" ? "Approved" : "Changes requested"} {formatAdminDateTime(p.decidedAt)}
                  {p.decisionSource === "STAFF_ON_BEHALF"
                    ? ` · recorded by ${p.decidedByName ?? "staff"} on the customer's behalf`
                    : " · by the customer"}
                </p>
              )}
              {p.customerComment && (
                <blockquote className="whitespace-pre-wrap rounded-lg border-l-4 border-blaze bg-blaze/5 px-3 py-2 text-sm text-admin-ink">
                  {p.customerComment}
                </blockquote>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <a href={`/admin/proofs/${p.id}/file`} target="_blank" rel="noopener noreferrer" className={SMALL_SECONDARY_BUTTON}>
                  <AdminIcon name="external" className="size-3.5" />
                  View
                </a>
                <a href={`/admin/proofs/${p.id}/file?download=1`} className={SMALL_SECONDARY_BUTTON}>
                  <AdminIcon name="download" className="size-3.5" />
                  Download
                </a>
                {p.shownStatus === "PENDING" && <ApproveOnBehalfButton proofId={p.id} />}
              </div>
            </li>
          ))}
        </ol>
      )}
    </AdminCard>
  );
}

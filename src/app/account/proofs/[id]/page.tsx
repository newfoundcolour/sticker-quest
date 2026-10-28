import type { Metadata } from "next";
import Link from "next/link";
import { StepCard } from "@/components/configurator/StepCard";
import { FormMessage } from "@/components/auth/fields";
import { AccountPageHeader } from "@/components/account/AccountPageHeader";
import { ArtworkThumb } from "@/components/account/ArtworkThumb";
import { StatusPill, formatOrderDate } from "@/components/account/OrderBits";
import { ProofStatusPill } from "@/components/account/ProofBits";
import { ProofDecision } from "@/components/account/ProofDecision";
import { requireVerifiedUser } from "@/lib/auth";
import { getCustomerProofOr404 } from "@/lib/proofs";
import { itemSummary, orderNumber } from "@/lib/orderLabels";

export const metadata: Metadata = { title: "Review proof · Sticker Quest" };

export default async function ProofPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireVerifiedUser("/account/proofs");
  // 404s unless this proof is on one of the user's own orders.
  const { proof, versions, shownStatus, actionable } = await getCustomerProofOr404(user.id, id);
  const fileUrl = `/account/proofs/${proof.id}/file`;
  const isPdf = proof.mimeType === "application/pdf";
  const latest = versions[0];

  return (
    <>
      <Link href="/account/proofs" className="mb-3 inline-block text-sm font-bold text-zap hover:underline">
        ← All proofs
      </Link>
      <AccountPageHeader
        title={`Proof for order ${orderNumber(proof.order.id)}`}
        intro={`Version ${proof.version} · sent ${formatOrderDate(proof.createdAt)}`}
        action={<ProofStatusPill status={shownStatus} />}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <StepCard icon="🖼️" title="Your proof">
          <div className="flex flex-col items-center gap-4 p-4 sm:p-6">
            {isPdf ? (
              <div className="flex w-full flex-col items-center gap-3 rounded-xl border-[1.5px] border-dashed border-grape/50 bg-white px-6 py-12 text-center">
                <span aria-hidden className="text-5xl">📄</span>
                <p className="font-black text-night">{proof.originalFilename}</p>
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border-2 border-night bg-blaze px-6 py-3 text-sm font-black uppercase text-white shadow-pop-blaze"
                >
                  Open the PDF ↗
                </a>
              </div>
            ) : (
              <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="block w-full" title="Open full size">
                {/* eslint-disable-next-line @next/next/no-img-element -- private, short-lived signed URL via our own route */}
                <img
                  src={fileUrl}
                  alt={`Proof version ${proof.version} for order ${orderNumber(proof.order.id)}`}
                  className="mx-auto max-h-[75vh] w-auto max-w-full rounded-xl border-[1.5px] border-grape/30 bg-white object-contain"
                />
              </a>
            )}
            <a href={`${fileUrl}?download=1`} className="text-sm font-bold text-blaze hover:underline">
              Download
            </a>
          </div>
        </StepCard>

        <div className="flex flex-col gap-6">
          <StepCard icon="✅" title="Your decision">
            <div className="p-5">
              {actionable ? (
                <ProofDecision proofId={proof.id} />
              ) : shownStatus === "SUPERSEDED" && latest ? (
                <FormMessage tone="info">
                  There&apos;s a newer version of this proof.{" "}
                  <Link href={`/account/proofs/${latest.id}`} className="font-black underline">
                    See version {latest.version}
                  </Link>
                </FormMessage>
              ) : proof.status === "APPROVED" ? (
                <FormMessage tone="success">
                  Approved {proof.decidedAt ? formatOrderDate(proof.decidedAt) : ""}
                  {proof.decisionSource === "STAFF_ON_BEHALF" && " (recorded by our team from your message)"}. Off to print!
                </FormMessage>
              ) : proof.status === "REJECTED" ? (
                <div className="flex flex-col gap-2">
                  <FormMessage tone="info">You asked for changes. We&apos;re working on a new version.</FormMessage>
                  {proof.customerComment && (
                    <blockquote className="whitespace-pre-wrap rounded-xl bg-white px-4 py-3 text-sm text-ink">
                      {proof.customerComment}
                    </blockquote>
                  )}
                </div>
              ) : (
                <p className="text-sm text-ink">This proof isn&apos;t waiting for a decision right now.</p>
              )}
            </div>
          </StepCard>

          <StepCard icon="📦" title="Order">
            <div className="flex flex-col gap-3 p-5">
              <div className="flex items-center justify-between gap-2">
                <Link href={`/account/orders/${proof.order.id}`} className="font-black text-night hover:text-blaze">
                  Order {orderNumber(proof.order.id)}
                </Link>
                <StatusPill status={proof.order.status} />
              </div>
              <ul className="flex flex-col gap-3">
                {proof.order.items.map((item) => (
                  <li key={item.id} className="flex items-center gap-3">
                    <ArtworkThumb url={item.artworkUrl} size={44} />
                    <span className="text-sm text-ink">{itemSummary(item)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </StepCard>

          {versions.length > 1 && (
            <StepCard icon="🕓" title="All versions">
              <ul className="divide-y divide-grape/20">
                {versions.map((v) => (
                  <li key={v.id}>
                    <Link
                      href={`/account/proofs/${v.id}`}
                      aria-current={v.id === proof.id ? "page" : undefined}
                      className="flex items-center justify-between gap-3 px-5 py-3 text-sm hover:bg-white/60 aria-[current=page]:bg-white/80"
                    >
                      <span className="font-black text-night">Version {v.version}</span>
                      <ProofStatusPill status={v.shownStatus} />
                    </Link>
                  </li>
                ))}
              </ul>
            </StepCard>
          )}
        </div>
      </div>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { StepCard } from "@/components/configurator/StepCard";
import { AccountPageHeader } from "@/components/account/AccountPageHeader";
import { EmptyState, formatOrderDate } from "@/components/account/OrderBits";
import { ProofStatusPill, proofFileIcon } from "@/components/account/ProofBits";
import { requireVerifiedUser } from "@/lib/auth";
import { listCustomerProofs } from "@/lib/proofs";
import { itemSummary, orderNumber } from "@/lib/orderLabels";

export const metadata: Metadata = { title: "Proofs · Sticker Quest" };

type ProofRow = Awaited<ReturnType<typeof listCustomerProofs>>[number];

function ProofList({ proofs, highlight }: { proofs: ProofRow[]; highlight?: boolean }) {
  return (
    <ul className="divide-y divide-grape/20">
      {proofs.map((proof) => {
        const firstItem = proof.order.items[0];
        return (
          <li key={proof.id}>
            <Link
              href={`/account/proofs/${proof.id}`}
              className="flex items-center gap-4 p-4 transition-colors hover:bg-white/60 sm:p-5"
            >
              <span aria-hidden className="flex size-12 shrink-0 items-center justify-center rounded-xl border-[1.5px] border-grape/40 bg-white text-2xl">
                {proofFileIcon(proof.mimeType)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-black text-night">
                  Order {orderNumber(proof.order.id)} · Version {proof.version}
                </span>
                <span className="block truncate text-sm text-quiet">
                  {firstItem ? itemSummary(firstItem) : ""}
                  {proof.order.items.length > 1 && ` + ${proof.order.items.length - 1} more`}
                </span>
                <span className="block text-xs text-quiet">Sent {formatOrderDate(proof.createdAt)}</span>
              </span>
              <span className="flex shrink-0 flex-col items-end gap-2">
                <ProofStatusPill status={proof.shownStatus} />
                {highlight && <span className="text-xs font-black text-blaze">Review now →</span>}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export default async function ProofsPage() {
  const user = await requireVerifiedUser("/account/proofs");
  const proofs = await listCustomerProofs(user.id);
  const waiting = proofs.filter((p) => p.actionable);
  const history = proofs.filter((p) => !p.actionable);

  return (
    <>
      <AccountPageHeader
        title="Proofs"
        intro="Before anything is printed, we send you a proof. Approve it, or tell us what to change."
      />

      <div className="flex flex-col gap-6">
        <StepCard
          icon="👀"
          title="Waiting for you"
          description={waiting.length > 0 ? `${waiting.length} to review` : undefined}
        >
          {waiting.length > 0 ? (
            <ProofList proofs={waiting} highlight />
          ) : (
            <EmptyState title="You're all caught up">
              When we send you a new proof, it&apos;ll pop up right here.
            </EmptyState>
          )}
        </StepCard>

        {history.length > 0 && (
          <StepCard icon="🗂️" title="History">
            <ProofList proofs={history} />
          </StepCard>
        )}
      </div>
    </>
  );
}

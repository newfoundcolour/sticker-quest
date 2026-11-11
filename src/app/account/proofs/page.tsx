import type { Metadata } from "next";
import Link from "next/link";
import { AccountCard, CARD_LIST_CLASSES, CARD_ROW_HOVER_CLASSES } from "@/components/account/AccountCard";
import { AccountPageHeader } from "@/components/account/AccountPageHeader";
import { EmptyState, formatOrderDate } from "@/components/account/OrderBits";
import { ProofStatusChip, proofFileIcon } from "@/components/account/ProofBits";
import { requireVerifiedUser } from "@/lib/auth";
import { listCustomerProofs } from "@/lib/proofs";
import { itemSummary, orderNumber } from "@/lib/orderLabels";

export const metadata: Metadata = { title: "Proofs · Sticker Quest" };

type ProofRow = Awaited<ReturnType<typeof listCustomerProofs>>[number];

function ProofList({ proofs, highlight }: { proofs: ProofRow[]; highlight?: boolean }) {
  return (
    <ul className={CARD_LIST_CLASSES}>
      {proofs.map((proof) => {
        const firstItem = proof.order.items[0];
        return (
          <li key={proof.id}>
            <Link
              href={`/account/proofs/${proof.id}`}
              className={`flex items-center gap-4 px-6 py-4 ${CARD_ROW_HOVER_CLASSES}`}
            >
              <span
                aria-hidden
                className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/[0.08] text-xl"
              >
                {proofFileIcon(proof.mimeType)}
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-[13px] font-semibold text-sand">
                  Order {orderNumber(proof.order.id)} · Version {proof.version}
                </span>
                <span className="truncate text-xs text-dusk-note">
                  {firstItem ? itemSummary(firstItem) : ""}
                  {proof.order.items.length > 1 && ` + ${proof.order.items.length - 1} more`}
                </span>
                <span className="text-[11px] text-white/[0.31]">Sent {formatOrderDate(proof.createdAt)}</span>
              </span>
              <span className="flex shrink-0 flex-col items-end gap-2">
                <ProofStatusChip status={proof.shownStatus} />
                {highlight && <span className="text-xs font-semibold text-zap">Review now →</span>}
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
        <AccountCard
          title="Waiting for you"
          description={waiting.length > 0 ? `${waiting.length} to review` : "Nothing to review right now."}
        >
          {waiting.length > 0 ? (
            <ProofList proofs={waiting} highlight />
          ) : (
            <div className="border-t border-white/[0.06]">
              <EmptyState dark title="You're all caught up">
                When we send you a new proof, it&apos;ll pop up right here.
              </EmptyState>
            </div>
          )}
        </AccountCard>

        {history.length > 0 && (
          <AccountCard title="History" description="Proofs you've already decided on.">
            <ProofList proofs={history} />
          </AccountCard>
        )}
      </div>
    </>
  );
}

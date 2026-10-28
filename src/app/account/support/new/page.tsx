import type { Metadata } from "next";
import Link from "next/link";
import { StepCard } from "@/components/configurator/StepCard";
import { AccountPageHeader } from "@/components/account/AccountPageHeader";
import { NewConversationForm } from "@/components/support/NewConversationForm";
import { formatOrderDate } from "@/components/account/OrderBits";
import { requireVerifiedUser } from "@/lib/auth";
import { listOrdersForSupportPicker } from "@/lib/support";
import { orderNumber } from "@/lib/orderLabels";

export const metadata: Metadata = { title: "New message · Support · Sticker Quest" };

export default async function NewSupportMessagePage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const user = await requireVerifiedUser("/account/support/new");
  const { order } = await searchParams;
  const orders = await listOrdersForSupportPicker(user.id);
  // Only preselect an order from the URL if it's one of theirs.
  const defaultOrderId = orders.some((o) => o.id === order) ? order : undefined;

  return (
    <>
      <Link href="/account/support" className="mb-3 inline-block text-sm font-bold text-zap hover:underline">
        ← All conversations
      </Link>
      <AccountPageHeader title="New message" intro="Only you and our team can see this conversation." />
      <div className="max-w-[760px]">
        <StepCard icon="✉️" title="Message our team">
          <div className="p-5 sm:p-7">
            <NewConversationForm
              defaultOrderId={defaultOrderId}
              orders={orders.map((o) => ({ id: o.id, label: `${orderNumber(o.id)} · ${formatOrderDate(o.createdAt)}` }))}
            />
          </div>
        </StepCard>
      </div>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { StepCard } from "@/components/configurator/StepCard";
import { AccountPageHeader } from "@/components/account/AccountPageHeader";
import { AutoRefresh } from "@/components/support/AutoRefresh";
import { Composer } from "@/components/support/Composer";
import { MessageThread } from "@/components/support/MessageThread";
import { customerReplyAction } from "@/app/actions/support";
import { requireVerifiedUser } from "@/lib/auth";
import { getCustomerConversationOr404, markReadByCustomer } from "@/lib/support";
import { orderNumber } from "@/lib/orderLabels";
import { CONVERSATION_STATUS_LABELS, SUPPORT_CATEGORY_LABELS } from "@/lib/supportLabels";
import { formatOrderDate } from "@/components/account/OrderBits";

export const metadata: Metadata = { title: "Conversation · Support · Sticker Quest" };

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireVerifiedUser("/account/support");
  // 404s unless the conversation belongs to the session user.
  const conversation = await getCustomerConversationOr404(user.id, id);
  // Seeing the thread marks the team's replies as read.
  await markReadByCustomer(user.id, conversation.id);

  const resolved = conversation.status === "RESOLVED";

  return (
    <>
      <AutoRefresh />
      <Link href="/account/support" className="mb-3 inline-block text-sm font-bold text-zap hover:underline">
        ← All conversations
      </Link>
      <AccountPageHeader
        title={SUPPORT_CATEGORY_LABELS[conversation.category]}
        intro={
          <>
            Started {formatOrderDate(conversation.createdAt)} · {CONVERSATION_STATUS_LABELS[conversation.status]}
            {conversation.order && (
              <>
                {" · "}
                <Link href={`/account/orders/${conversation.order.id}`} className="font-bold text-zap hover:underline">
                  Order {orderNumber(conversation.order.id)}
                </Link>
              </>
            )}
          </>
        }
      />

      <div className="flex max-w-[860px] flex-col gap-6">
        <StepCard icon="💬" title="Conversation">
          <div className="p-5 sm:p-6">
            <MessageThread
              messages={conversation.messages}
              viewer="CUSTOMER"
              theme="account"
              attachmentHref={(messageId) => `/account/support/attachments/${messageId}`}
            />
          </div>
        </StepCard>

        <StepCard icon="✍️" title={resolved ? "Reply to reopen" : "Reply"}>
          <div className="p-5 sm:p-6">
            {resolved && (
              <p className="mb-3 text-sm text-ink">
                We marked this as resolved. Still need a hand? Reply here and it&apos;ll reopen.
              </p>
            )}
            <Composer
              action={customerReplyAction.bind(null, conversation.id)}
              theme="account"
              allowAttachment
              placeholder="Write your reply…"
            />
          </div>
        </StepCard>
      </div>
    </>
  );
}
